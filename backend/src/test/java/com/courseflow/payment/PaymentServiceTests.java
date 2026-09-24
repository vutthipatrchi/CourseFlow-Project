package com.courseflow.payment;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionTemplate;

class PaymentServiceTests {
    private static final Instant NOW = Instant.parse("2026-09-20T05:00:00Z");
    private PaymentRepository repository;
    private PaymentGateway gateway;
    private PlatformTransactionManager manager;
    private PaymentService service;
    private Map<UUID, PaymentRecord> payments;
    private OrderRecord order;
    private AtomicBoolean inTransaction;

    @BeforeEach
    void setUp() {
        repository = mock(PaymentRepository.class);
        gateway = mock(PaymentGateway.class);
        manager = mock(PlatformTransactionManager.class);
        inTransaction = new AtomicBoolean();
        when(manager.getTransaction(any())).thenAnswer(call -> { inTransaction.set(true); return new SimpleTransactionStatus(); });
        doAnswer(call -> { inTransaction.set(false); return null; }).when(manager).commit(any());
        service = new PaymentService(repository, gateway, Clock.fixed(NOW, ZoneOffset.UTC), new TransactionTemplate(manager));
        order = new OrderRecord(UUID.randomUUID(), "CFTEST", 1L, "Test course", "user_buyer", "",
            355900, 0, 355900, "thb", OrderStatus.PENDING_PAYMENT, NOW.plusSeconds(1800));
        payments = new HashMap<>();
        when(gateway.enabled()).thenReturn(true);
        when(repository.findOrder(eq(order.id()), anyBoolean())).thenAnswer(call -> Optional.of(order));
        when(repository.findPayment(any())).thenAnswer(call -> Optional.ofNullable(payments.get(call.getArgument(0))));
        when(repository.findActivePayment(order.id())).thenAnswer(call -> payments.values().stream()
            .filter(p -> !Set.of(PaymentStatus.FAILED, PaymentStatus.EXPIRED).contains(p.status())).findFirst());
        when(repository.findPaymentByIdempotency(eq(order.id()), any())).thenAnswer(call ->
            payments.values().stream().filter(p -> p.idempotencyKey().equals(call.getArgument(1))).findFirst());
        doAnswer(call -> { PaymentRecord p = call.getArgument(0); payments.put(p.id(), p); return null; })
            .when(repository).insertPayment(any());
        doAnswer(call -> {
            UUID id = call.getArgument(0);
            ProviderCharge charge = call.getArgument(1);
            PaymentRecord old = payments.get(id);
            payments.put(id, new PaymentRecord(id, old.orderId(), charge.id(), old.idempotencyKey(), old.method(),
                old.amountSatang(), old.currency(), charge.status(), charge.qrImageUrl(), charge.authorizeUrl(),
                charge.failureMessage(), old.expiresAt(), old.createdAt()));
            return null;
        }).when(repository).updatePaymentFromProvider(any(), any());
        doAnswer(call -> { changeStatus(call.getArgument(0), PaymentStatus.REVIEW); return null; })
            .when(repository).markPaymentReview(any(), anyString());
        doAnswer(call -> { changeStatus(call.getArgument(0), PaymentStatus.FAILED); return null; })
            .when(repository).markPaymentFailed(any(), anyString());
        when(repository.reserveWebhookEvent(anyString(), anyString())).thenReturn(true);
    }

    @Test
    void springCanConstructTheService() {
        try (var context = new AnnotationConfigApplicationContext()) {
            context.registerBean(PaymentRepository.class, () -> repository);
            context.registerBean(PaymentGateway.class, () -> gateway);
            context.registerBean(PlatformTransactionManager.class, () -> manager);
            context.register(PaymentService.class);
            context.refresh();
            assertThat(context.getBean(PaymentService.class)).isNotNull();
        }
    }

    @Test
    void quoteUsesServerPricesAndVerifiedOwner() {
        when(repository.findCourse(1L)).thenReturn(Optional.of(new CoursePrice(1L, "Course", 355900, 0)));
        when(repository.findPromotionDiscount(1L, "COURSE200")).thenReturn(20000L);
        var quote = service.createOrder("user_buyer", 1L, "course200");
        assertThat(quote.totalSatang()).isEqualTo(335900);
        assertThat(quote.promotionCode()).isEqualTo("COURSE200");
        verify(repository).insertOrder(argThat(o -> o.customerSubject().equals("user_buyer") && o.totalSatang() == 335900));
    }

    @Test
    void reloadReusesTheExistingOrderAndDoesNotRepriceIt() {
        when(repository.findOpenOrder("user_buyer", 1L)).thenReturn(Optional.of(order));
        assertThat(service.createOrder("user_buyer", 1L, "").orderId()).isEqualTo(order.id());
        verify(repository, never()).insertOrder(any());
        verify(repository, never()).findCourse(any());
    }

    @Test
    void commitsAttemptBeforeCallingProviderAndUsesAuthoritativeAmount() {
        when(gateway.createPromptPayCharge(any(), any(), anyString(), anyLong(), anyString(), any())).thenAnswer(call -> {
            assertThat(inTransaction).isFalse();
            assertThat(payments).containsKey(call.getArgument(1));
            assertThat((Long) call.getArgument(3)).isEqualTo(355900);
            return charge(call.getArgument(1), PaymentStatus.PENDING, 355900);
        });
        var result = service.createPromptPayPayment(order.id(), "user_buyer", UUID.randomUUID());
        assertThat(result.status()).isEqualTo("pending");
        verify(repository, never()).activateSubscription(any());
    }

    @Test
    void aTimeoutIsRecoverableAndCannotCauseAnotherChargeEvenWithANewKey() {
        when(gateway.createPromptPayCharge(any(), any(), anyString(), anyLong(), anyString(), any()))
            .thenThrow(new PaymentProviderException("timeout"));
        var first = service.createPromptPayPayment(order.id(), "user_buyer", UUID.randomUUID());
        var retry = service.createPromptPayPayment(order.id(), "user_buyer", UUID.randomUUID());
        assertThat(first.status()).isEqualTo("review");
        assertThat(retry.paymentId()).isEqualTo(first.paymentId());
        verify(gateway, times(1)).createPromptPayCharge(any(), any(), anyString(), anyLong(), anyString(), any());
        when(repository.findOpenOrder("user_buyer", 1L)).thenReturn(Optional.of(order));
        assertThat(service.createOrder("user_buyer", 1L, "DIFFERENT").payment().paymentId()).isEqualTo(first.paymentId());
        verify(repository, never()).closeUnpaidOrder(any());
    }

    @Test
    void webhookRecoversATimedOutChargeByTrustedMetadata() {
        PaymentRecord payment = addPayment(PaymentStatus.REVIEW, null);
        when(gateway.retrieveCharge("chrg_test_123")).thenReturn(charge(payment.id(), PaymentStatus.SUCCESSFUL, 355900));
        service.handleWebhook("evnt_test_1", "charge.complete", "chrg_test_123");
        assertThat(payments.get(payment.id()).status()).isEqualTo(PaymentStatus.SUCCESSFUL);
        verify(repository).activateSubscription(order);
    }

    @Test
    void scheduledReconciliationFindsAnUnknownChargeWithoutSubmittingAnother() {
        PaymentRecord payment = addPayment(PaymentStatus.CREATING, null);
        when(repository.claimReconciliationBatch(NOW)).thenReturn(List.of(payment));
        when(gateway.findCharge(payment.id(), payment.createdAt()))
            .thenReturn(Optional.of(charge(payment.id(), PaymentStatus.SUCCESSFUL, 355900)));
        service.reconcileOutstanding();
        verify(repository).activateSubscription(order);
        verify(gateway, never()).createPromptPayCharge(any(), any(), anyString(), anyLong(), anyString(), any());
    }

    @Test
    void amountMismatchNeverGrantsAccess() {
        PaymentRecord payment = addPayment(PaymentStatus.PENDING, "chrg_test_123");
        when(gateway.retrieveCharge("chrg_test_123")).thenReturn(charge(payment.id(), PaymentStatus.SUCCESSFUL, 1));
        assertThat(service.getPayment(payment.id(), "user_buyer").status()).isEqualTo("review");
        verify(repository, never()).activateSubscription(any());
    }

    @Test
    void otherUsersCannotReadOrPayAnOrder() {
        PaymentRecord payment = addPayment(PaymentStatus.PENDING, "chrg_test_123");
        assertThatThrownBy(() -> service.getPayment(payment.id(), "user_attacker")).isInstanceOf(CheckoutNotFoundException.class);
        assertThatThrownBy(() -> service.createPromptPayPayment(order.id(), "user_attacker", UUID.randomUUID()))
            .isInstanceOf(CheckoutNotFoundException.class);
        verify(gateway, never()).retrieveCharge(any());
    }

    @Test
    void successfulPaymentCannotBeDowngradedByAStaleWebhook() {
        PaymentRecord payment = addPayment(PaymentStatus.SUCCESSFUL, "chrg_test_123");
        when(gateway.retrieveCharge("chrg_test_123")).thenReturn(charge(payment.id(), PaymentStatus.PENDING, 355900));
        service.handleWebhook("evnt_test_stale", "charge.create", "chrg_test_123");
        verify(repository, never()).updatePaymentFromProvider(any(), any());
        assertThat(payments.get(payment.id()).status()).isEqualTo(PaymentStatus.SUCCESSFUL);
    }

    @Test
    void retriesOfPaidOrdersReturnTheOriginalPayment() {
        PaymentRecord payment = addPayment(PaymentStatus.SUCCESSFUL, "chrg_test_123");
        order = new OrderRecord(order.id(), order.reference(), order.courseId(), order.courseTitle(), order.customerSubject(),
            "", 355900, 0, 355900, "thb", OrderStatus.PAID, NOW.minusSeconds(1));
        assertThat(service.createPromptPayPayment(order.id(), "user_buyer", payment.idempotencyKey()).paymentId()).isEqualTo(payment.id());
        verify(gateway, never()).createPromptPayCharge(any(), any(), anyString(), anyLong(), anyString(), any());
    }

    @Test
    void explicitProviderRejectionAllowsANewAttempt() {
        when(gateway.createPromptPayCharge(any(), any(), anyString(), anyLong(), anyString(), any()))
            .thenThrow(new PaymentProviderRejectedException(new RuntimeException("declined")));
        var first = service.createPromptPayPayment(order.id(), "user_buyer", UUID.randomUUID());
        var second = service.createPromptPayPayment(order.id(), "user_buyer", UUID.randomUUID());
        assertThat(first.status()).isEqualTo("failed");
        assertThat(second.paymentId()).isNotEqualTo(first.paymentId());
    }

    @Test
    void duplicateWebhookIsNotAppliedTwice() {
        PaymentRecord payment = addPayment(PaymentStatus.PENDING, "chrg_test_123");
        when(gateway.retrieveCharge("chrg_test_123")).thenReturn(charge(payment.id(), PaymentStatus.SUCCESSFUL, 355900));
        when(repository.reserveWebhookEvent("evnt_test_1", "charge.complete")).thenReturn(true, false);
        service.handleWebhook("evnt_test_1", "charge.complete", "chrg_test_123");
        service.handleWebhook("evnt_test_1", "charge.complete", "chrg_test_123");
        verify(repository, times(1)).activateSubscription(order);
    }

    @Test
    void lessonCompletionUsesTheSignedInUsersSubscriptionAndReturnsUpdatedProgress() {
        var progress = new CourseProgressView(1L, 1, 6, 17, "in-progress", List.of());
        when(repository.findCourseProgress("user_buyer", 1L)).thenReturn(Optional.of(progress));

        assertThat(service.completeSubLesson("user_buyer", 1L, 2, 1)).isEqualTo(progress);

        verify(repository).completeSubLesson("user_buyer", 1L, 2, 1);
        verify(repository).findCourseProgress("user_buyer", 1L);
    }

    private PaymentRecord addPayment(PaymentStatus status, String chargeId) {
        PaymentRecord payment = new PaymentRecord(UUID.randomUUID(), order.id(), chargeId, UUID.randomUUID(),
            PaymentMethod.PROMPTPAY, 355900, "thb", status, null, null, null, order.expiresAt(), NOW);
        payments.put(payment.id(), payment);
        return payment;
    }

    private ProviderCharge charge(UUID paymentId, PaymentStatus status, long amount) {
        return new ProviderCharge("chrg_test_123", status, amount, "thb", null, null, null, order.id(), paymentId);
    }

    private void changeStatus(UUID id, PaymentStatus status) {
        PaymentRecord old = payments.get(id);
        payments.put(id, new PaymentRecord(id, old.orderId(), old.providerChargeId(), old.idempotencyKey(), old.method(),
            old.amountSatang(), old.currency(), status, old.qrImageUrl(), old.authorizeUrl(), null, old.expiresAt(), old.createdAt()));
    }
}
