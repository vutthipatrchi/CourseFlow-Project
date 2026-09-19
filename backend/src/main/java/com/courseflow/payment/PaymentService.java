package com.courseflow.payment;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Profile("!standalone")
class PaymentService {
    static final String CHECKOUT_TOKEN_HEADER = "X-Checkout-Token";
    private static final Duration CHECKOUT_TTL = Duration.ofMinutes(30);

    private final PaymentRepository repository;
    private final PaymentGateway gateway;
    private final Clock clock;
    private final SecureRandom random;
    private final String appBaseUrl;

    PaymentService(
        PaymentRepository repository,
        PaymentGateway gateway,
        @Value("${courseflow.app-base-url:http://localhost:5173}") String appBaseUrl
    ) {
        this(repository, gateway, Clock.systemUTC(), new SecureRandom(), appBaseUrl);
    }

    PaymentService(
        PaymentRepository repository, PaymentGateway gateway, Clock clock,
        SecureRandom random, String appBaseUrl
    ) {
        this.repository = repository;
        this.gateway = gateway;
        this.clock = clock;
        this.random = random;
        this.appBaseUrl = appBaseUrl.replaceAll("/+$", "");
    }

    boolean providerEnabled() { return gateway.enabled(); }
    String providerPublicKey() { return gateway.publicKey(); }

    @Transactional
    OrderCreated createOrder(Long courseId, String promotionCode) {
        Instant now = clock.instant();
        CoursePrice course = repository.findCourse(courseId).orElseThrow(CheckoutNotFoundException::new);
        long promoDiscount = repository.findPromotionDiscount(course.id(), promotionCode);
        if (promotionCode != null && !promotionCode.isBlank() && promoDiscount == 0) {
            throw new CheckoutConflictException("Promotion code is invalid or expired");
        }
        long discount = Math.max(course.defaultDiscountSatang(), promoDiscount);
        long total = course.subtotalSatang() - discount;
        if (total <= 0) throw new CheckoutConflictException("Order total must be greater than zero");

        UUID orderId = UUID.randomUUID();
        String token = createAccessToken();
        String reference = "CF" + orderId.toString().replace("-", "").substring(0, 10).toUpperCase(Locale.ROOT);
        Instant expiresAt = now.plus(CHECKOUT_TTL);
        repository.insertOrder(new OrderRecord(
            orderId, reference, course.id(), course.title(), hashToken(token),
            course.subtotalSatang(), discount, total, "thb",
            OrderStatus.PENDING_PAYMENT, expiresAt
        ));
        return new OrderCreated(
            orderId, token, reference, course.title(), course.subtotalSatang(),
            discount, total, "thb", expiresAt
        );
    }

    @Transactional(noRollbackFor = PaymentProviderException.class)
    PaymentView createCardPayment(
        UUID orderId, String accessToken, UUID idempotencyKey, String cardToken
    ) {
        return createPayment(orderId, accessToken, idempotencyKey, PaymentMethod.CARD, cardToken);
    }

    @Transactional(noRollbackFor = PaymentProviderException.class)
    PaymentView createPromptPayPayment(
        UUID orderId, String accessToken, UUID idempotencyKey
    ) {
        return createPayment(orderId, accessToken, idempotencyKey, PaymentMethod.PROMPTPAY, null);
    }

    private PaymentView createPayment(
        UUID orderId, String accessToken, UUID idempotencyKey,
        PaymentMethod method, String cardToken
    ) {
        if (!gateway.enabled()) throw new PaymentProviderUnavailableException();
        OrderRecord order = requireOrder(orderId, accessToken, true);
        Instant now = clock.instant();
        if (order.status() != OrderStatus.PENDING_PAYMENT) {
            throw new CheckoutConflictException("Order cannot accept another payment");
        }
        if (!order.expiresAt().isAfter(now)) {
            repository.markOrderExpired(order.id());
            throw new CheckoutConflictException("Checkout has expired");
        }

        var retry = repository.findPaymentByIdempotency(orderId, idempotencyKey);
        if (retry.isPresent()) return toView(order, retry.get());
        var active = repository.findActivePayment(orderId);
        if (active.isPresent()) return toView(order, active.get());

        UUID paymentId = UUID.randomUUID();
        PaymentRecord payment = new PaymentRecord(
            paymentId, orderId, null, idempotencyKey, method,
            order.totalSatang(), order.currency(), PaymentStatus.CREATING,
            null, null, null, order.expiresAt()
        );
        repository.insertPayment(payment);

        try {
            ProviderCharge charge = method == PaymentMethod.CARD
                ? gateway.createCardCharge(
                    order.id(), paymentId, order.reference(), order.totalSatang(),
                    order.currency(), cardToken,
                    appBaseUrl + "/payment/status?paymentId=" + paymentId,
                    order.expiresAt()
                )
                : gateway.createPromptPayCharge(
                    order.id(), paymentId, order.reference(), order.totalSatang(),
                    order.currency(), order.expiresAt()
                );
            repository.updatePaymentFromProvider(paymentId, charge);
            PaymentRecord updated = repository.findPayment(paymentId).orElseThrow();
            reconcile(order, updated, charge);
            return toView(order, repository.findPayment(paymentId).orElseThrow());
        } catch (PaymentProviderException error) {
            repository.markPaymentReview(paymentId, "Provider result is unknown; do not retry automatically");
            repository.markOrderForReview(order.id());
            throw error;
        }
    }

    @Transactional
    PaymentView getPayment(UUID paymentId, String accessToken) {
        PaymentRecord payment = repository.findPayment(paymentId).orElseThrow(CheckoutNotFoundException::new);
        OrderRecord order = requireOrder(payment.orderId(), accessToken, false);
        if (payment.status() == PaymentStatus.PENDING && payment.providerChargeId() != null) {
            ProviderCharge charge = gateway.retrieveCharge(payment.providerChargeId());
            repository.updatePaymentFromProvider(payment.id(), charge);
            payment = repository.findPayment(paymentId).orElseThrow();
            reconcile(order, payment, charge);
            payment = repository.findPayment(paymentId).orElseThrow();
        }
        return toView(order, payment);
    }

    @Transactional(readOnly = true)
    DownloadedQr downloadQr(UUID paymentId, String accessToken) {
        PaymentRecord payment = repository.findPayment(paymentId).orElseThrow(CheckoutNotFoundException::new);
        requireOrder(payment.orderId(), accessToken, false);
        if (payment.method() != PaymentMethod.PROMPTPAY || payment.qrImageUrl() == null) {
            throw new CheckoutNotFoundException();
        }
        return gateway.downloadQr(payment.qrImageUrl());
    }

    @Transactional
    void handleWebhook(String eventId, String eventKey, String providerChargeId) {
        if (!eventKey.startsWith("charge.")) return;
        ProviderCharge charge = gateway.retrieveCharge(providerChargeId);
        PaymentRecord payment = repository.findPaymentByChargeId(charge.id(), true)
            .orElseThrow(CheckoutNotFoundException::new);
        if (!repository.reserveWebhookEvent(eventId, eventKey)) return;
        OrderRecord order = repository.findOrder(payment.orderId(), true)
            .orElseThrow(CheckoutNotFoundException::new);
        repository.updatePaymentFromProvider(payment.id(), charge);
        reconcile(order, payment, charge);
        repository.completeWebhookEvent(eventId);
    }

    private void reconcile(OrderRecord order, PaymentRecord payment, ProviderCharge charge) {
        if (charge.amountSatang() != payment.amountSatang()
            || !charge.currency().equalsIgnoreCase(payment.currency())) {
            repository.markPaymentReview(payment.id(), "Provider amount or currency mismatch");
            repository.markOrderForReview(order.id());
            return;
        }
        if (charge.status() == PaymentStatus.SUCCESSFUL) {
            if (order.status() == OrderStatus.CANCELLED) {
                repository.markPaymentReview(payment.id(), "Payment arrived after cancellation");
                repository.markOrderForReview(order.id());
                return;
            }
            repository.activateSubscription(order);
        }
    }

    private OrderRecord requireOrder(UUID orderId, String accessToken, boolean lock) {
        OrderRecord order = repository.findOrder(orderId, lock).orElseThrow(CheckoutNotFoundException::new);
        if (accessToken == null || accessToken.isBlank()
            || !MessageDigest.isEqual(
                order.accessTokenHash().getBytes(StandardCharsets.US_ASCII),
                hashToken(accessToken).getBytes(StandardCharsets.US_ASCII)
            )) {
            throw new CheckoutAccessDeniedException();
        }
        return order;
    }

    private PaymentView toView(OrderRecord order, PaymentRecord payment) {
        return new PaymentView(
            payment.id(), order.id(), order.reference(), payment.method().value(),
            payment.status().value(), payment.amountSatang(), payment.currency(),
            payment.qrImageUrl() == null ? null : "/api/payments/" + payment.id() + "/qr",
            payment.authorizeUri(), payment.failureMessage(), payment.expiresAt()
        );
    }

    private String createAccessToken() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (java.security.NoSuchAlgorithmException impossible) {
            throw new IllegalStateException(impossible);
        }
    }
}
