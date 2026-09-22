package com.courseflow.payment;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@Profile("!standalone")
class PaymentService {
    private static final Duration CHECKOUT_TTL = Duration.ofMinutes(30);
    private final PaymentRepository repository;
    private final PaymentGateway gateway;
    private final Clock clock;
    private final TransactionTemplate transactions;

    @Autowired
    PaymentService(PaymentRepository repository, PaymentGateway gateway, PlatformTransactionManager manager) {
        this(repository, gateway, Clock.systemUTC(), new TransactionTemplate(manager));
    }

    PaymentService(PaymentRepository repository, PaymentGateway gateway, Clock clock, TransactionTemplate transactions) {
        this.repository = repository;
        this.gateway = gateway;
        this.clock = clock;
        this.transactions = transactions;
    }

    boolean providerEnabled() { return gateway.enabled(); }
    String providerPublicKey() { return gateway.publicKey(); }

    OrderCreated createOrder(String subject, Long courseId, String promotionCode) {
        requireSubject(subject);
        String code = promotionCode == null ? "" : promotionCode.trim().toUpperCase(Locale.ROOT);
        return transactions.execute(tx -> {
            repository.lockCheckout(subject, courseId);
            var previous = repository.findOpenOrder(subject, courseId);
            if (previous.isPresent()) {
                OrderRecord order = previous.get();
                var active = repository.findActivePayment(order.id());
                if (active.isPresent()) return toOrderView(order, active.get());
                if (order.status() != OrderStatus.PENDING_PAYMENT) {
                    throw new CheckoutConflictException("This course already has an order awaiting resolution");
                }
                if (order.expiresAt().isAfter(clock.instant()) && Objects.equals(order.promotionCode(), code)) {
                    return toOrderView(order, null);
                }
                // This order has no charge in progress, so replacing its quote cannot cause a duplicate charge.
                repository.closeUnpaidOrder(order.id());
            }
            CoursePrice course = repository.findCourse(courseId).orElseThrow(CheckoutNotFoundException::new);
            long promoDiscount = repository.findPromotionDiscount(courseId, code);
            if (!code.isBlank() && promoDiscount == 0) throw new CheckoutConflictException("Promotion code is invalid or expired");
            long discount = Math.max(course.defaultDiscountSatang(), promoDiscount);
            long total = course.subtotalSatang() - discount;
            if (discount < 0 || total <= 0) throw new CheckoutConflictException("Order total must be greater than zero");
            UUID id = UUID.randomUUID();
            OrderRecord order = new OrderRecord(id, "CF" + id.toString().replace("-", "").substring(0, 20).toUpperCase(Locale.ROOT),
                courseId, course.title(), subject, code, course.subtotalSatang(), discount, total, "thb",
                OrderStatus.PENDING_PAYMENT, clock.instant().plus(CHECKOUT_TTL));
            repository.insertOrder(order);
            return toOrderView(order, null);
        });
    }

    PaymentView createCardPayment(UUID orderId, String subject, UUID key, String cardToken) {
        return createPayment(orderId, subject, key, PaymentMethod.CARD, cardToken);
    }

    PaymentView createPromptPayPayment(UUID orderId, String subject, UUID key) {
        return createPayment(orderId, subject, key, PaymentMethod.PROMPTPAY, null);
    }

    private PaymentView createPayment(UUID orderId, String subject, UUID key, PaymentMethod method, String token) {
        // Commit the attempt before the network call. A timeout or process crash must not erase it.
        Reservation reservation = transactions.execute(tx -> {
            OrderRecord order = requireOrder(orderId, subject, true);
            var retry = repository.findPaymentByIdempotency(orderId, key);
            if (retry.isPresent()) return new Reservation(order, retry.get(), false);
            var active = repository.findActivePayment(orderId);
            if (active.isPresent()) return new Reservation(order, active.get(), false);
            if (order.status() != OrderStatus.PENDING_PAYMENT) throw new CheckoutConflictException("Order cannot accept another payment");
            if (!order.expiresAt().isAfter(clock.instant())) throw new CheckoutConflictException("Checkout expired. Reload to review the current price.");
            if (!gateway.enabled()) throw new PaymentProviderUnavailableException();
            PaymentRecord payment = new PaymentRecord(UUID.randomUUID(), orderId, null, key, method,
                order.totalSatang(), order.currency(), PaymentStatus.CREATING, null, null, null,
                order.expiresAt(), clock.instant());
            repository.insertPayment(payment);
            return new Reservation(order, payment, true);
        });
        OrderRecord order = reservation.order();
        PaymentRecord payment = reservation.payment();
        if (!reservation.created()) return toView(order, payment);
        try {
            ProviderCharge charge = method == PaymentMethod.CARD
                ? gateway.createCardCharge(orderId, payment.id(), order.reference(), order.totalSatang(), order.currency(), token, order.expiresAt())
                : gateway.createPromptPayCharge(orderId, payment.id(), order.reference(), order.totalSatang(), order.currency(), order.expiresAt());
            applyCharge(payment.id(), charge);
        } catch (PaymentProviderRejectedException error) {
            transactions.executeWithoutResult(tx -> {
                repository.findOrder(orderId, true).orElseThrow();
                repository.markPaymentFailed(payment.id(), "The provider rejected this payment. Please check your details or choose another method.");
            });
        } catch (PaymentProviderException error) {
            transactions.executeWithoutResult(tx -> {
                repository.findOrder(orderId, true).orElseThrow();
                PaymentRecord current = repository.findPayment(payment.id()).orElseThrow();
                // A webhook may already have completed the attempt while the POST timed out.
                if (current.status() == PaymentStatus.CREATING) {
                    repository.markPaymentReview(payment.id(), "We are confirming this payment. Please do not pay again.");
                    repository.markOrderForReview(orderId);
                }
            });
        }
        return toView(order, repository.findPayment(payment.id()).orElseThrow());
    }

    PaymentView getPayment(UUID paymentId, String subject) {
        PaymentRecord payment = repository.findPayment(paymentId).orElseThrow(CheckoutNotFoundException::new);
        OrderRecord order = requireOrder(payment.orderId(), subject, false);
        if ((payment.status() == PaymentStatus.PENDING || payment.status() == PaymentStatus.REVIEW)
            && payment.providerChargeId() != null) {
            applyCharge(paymentId, gateway.retrieveCharge(payment.providerChargeId()));
            payment = repository.findPayment(paymentId).orElseThrow();
        }
        return toView(order, payment);
    }

    DownloadedQr downloadQr(UUID paymentId, String subject) {
        PaymentRecord payment = repository.findPayment(paymentId).orElseThrow(CheckoutNotFoundException::new);
        requireOrder(payment.orderId(), subject, false);
        if (payment.method() != PaymentMethod.PROMPTPAY || payment.qrImageUrl() == null) throw new CheckoutNotFoundException();
        return gateway.downloadQr(payment.qrImageUrl());
    }

    List<SubscriptionView> subscriptions(String subject) {
        requireSubject(subject);
        return repository.findSubscriptions(subject);
    }

    void handleWebhook(String eventId, String eventKey, String chargeId) {
        if (!eventKey.startsWith("charge.")) return;
        ProviderCharge charge = gateway.retrieveCharge(chargeId);
        // Only use metadata returned by the authenticated provider API, never posted metadata.
        var payment = repository.findPaymentByChargeId(charge.id());
        if (payment.isEmpty() && charge.paymentId() != null) payment = repository.findPayment(charge.paymentId());
        if (payment.isEmpty()) return; // Other applications may share this Omise account.
        UUID paymentId = payment.get().id();
        transactions.executeWithoutResult(tx -> {
            // All writers acquire the order lock first, avoiding webhook/polling deadlocks.
            OrderRecord order = repository.findOrder(paymentOrderId(paymentId), true).orElseThrow();
            if (!repository.reserveWebhookEvent(eventId, eventKey)) return;
            reconcile(order, repository.findPayment(paymentId).orElseThrow(), charge);
            repository.completeWebhookEvent(eventId);
        });
    }

    void reconcileOutstanding() {
        if (!gateway.enabled()) return;
        List<PaymentRecord> batch = transactions.execute(tx -> repository.claimReconciliationBatch(clock.instant()));
        for (PaymentRecord payment : batch) {
            try {
                if (payment.providerChargeId() != null) {
                    applyCharge(payment.id(), gateway.retrieveCharge(payment.providerChargeId()));
                } else {
                    gateway.findCharge(payment.id(), payment.createdAt()).ifPresent(charge -> applyCharge(payment.id(), charge));
                    // Absence is not proof of failure. Keep the reservation; never resubmit a charge.
                }
            } catch (RuntimeException error) {
                org.slf4j.LoggerFactory.getLogger(PaymentService.class)
                    .warn("Payment reconciliation deferred for {} ({})", payment.id(), error.getClass().getSimpleName());
            }
        }
    }

    private UUID paymentOrderId(UUID paymentId) {
        return repository.findPayment(paymentId).orElseThrow(CheckoutNotFoundException::new).orderId();
    }

    private void applyCharge(UUID paymentId, ProviderCharge charge) {
        transactions.executeWithoutResult(tx -> {
            OrderRecord order = repository.findOrder(paymentOrderId(paymentId), true).orElseThrow();
            reconcile(order, repository.findPayment(paymentId).orElseThrow(), charge);
        });
    }

    private void reconcile(OrderRecord order, PaymentRecord payment, ProviderCharge charge) {
        if (payment.status() == PaymentStatus.SUCCESSFUL) return; // Never overwrite success with a stale poll.
        if (!order.id().equals(charge.orderId()) || !payment.id().equals(charge.paymentId())
            || (payment.providerChargeId() != null && !payment.providerChargeId().equals(charge.id()))) {
            repository.markPaymentReview(payment.id(), "Payment identity needs verification. Please contact support.");
            repository.markOrderForReview(order.id());
            return;
        }
        if ((payment.status() == PaymentStatus.FAILED || payment.status() == PaymentStatus.EXPIRED)
            && charge.status() != PaymentStatus.SUCCESSFUL) return;
        if (charge.amountSatang() != payment.amountSatang() || !payment.currency().equalsIgnoreCase(charge.currency())
            || order.status() == OrderStatus.CANCELLED || order.customerSubject() == null) {
            repository.updatePaymentFromProvider(payment.id(), new ProviderCharge(charge.id(), PaymentStatus.REVIEW,
                charge.amountSatang(), charge.currency(), null, null,
                "Payment requires manual verification. Please contact support.", charge.orderId(), charge.paymentId()));
            repository.markOrderForReview(order.id());
            return;
        }
        repository.updatePaymentFromProvider(payment.id(), charge);
        if (charge.status() == PaymentStatus.SUCCESSFUL) repository.activateSubscription(order);
        else if (charge.status() == PaymentStatus.REVIEW) repository.markOrderForReview(order.id());
        else repository.restorePendingOrder(order.id());
    }

    private OrderRecord requireOrder(UUID id, String subject, boolean lock) {
        requireSubject(subject);
        OrderRecord order = repository.findOrder(id, lock).orElseThrow(CheckoutNotFoundException::new);
        if (!subject.equals(order.customerSubject())) throw new CheckoutNotFoundException();
        return order;
    }

    private void requireSubject(String subject) {
        if (subject == null || subject.isBlank()) throw new CheckoutAccessDeniedException();
    }

    private OrderCreated toOrderView(OrderRecord order, PaymentRecord payment) {
        return new OrderCreated(order.id(), order.courseId(), order.reference(), order.courseTitle(), order.promotionCode(),
            order.subtotalSatang(), order.discountSatang(), order.totalSatang(), order.currency(), order.expiresAt(),
            payment == null ? null : toView(order, payment));
    }

    private PaymentView toView(OrderRecord order, PaymentRecord payment) {
        return new PaymentView(payment.id(), order.id(), order.courseId(), order.reference(), payment.method().value(),
            payment.status().value(), payment.amountSatang(), payment.currency(),
            payment.qrImageUrl() == null ? null : "/api/payments/" + payment.id() + "/qr",
            payment.status() == PaymentStatus.PENDING ? payment.authorizeUrl() : null, payment.failureMessage(), payment.expiresAt());
    }

    private record Reservation(OrderRecord order, PaymentRecord payment, boolean created) {}
}