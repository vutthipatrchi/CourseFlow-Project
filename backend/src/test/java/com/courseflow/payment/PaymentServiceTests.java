package com.courseflow.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

class PaymentServiceTests {
    private static final Instant NOW = Instant.parse("2026-09-19T05:00:00Z");

    private PaymentRepository repository;
    private PaymentGateway gateway;
    private PaymentService service;

    @BeforeEach
    void setUp() {
        repository = mock(PaymentRepository.class);
        gateway = mock(PaymentGateway.class);
        service = new PaymentService(
            repository,
            gateway,
            Clock.fixed(NOW, ZoneOffset.UTC),
            new SecureRandom(),
            "http://localhost:5173"
        );
    }

    @Test
    void createsCheckoutFromServerSidePricesAndStoresOnlyTheTokenHash() {
        CoursePrice course = new CoursePrice(
            1L, "Service Design Essentials Course", 355_900, 20_000
        );
        when(repository.findCourse(1L)).thenReturn(Optional.of(course));
        when(repository.findPromotionDiscount(1L, "COURSE200")).thenReturn(20_000L);

        OrderCreated result = service.createOrder(1L, "COURSE200");

        ArgumentCaptor<OrderRecord> saved = ArgumentCaptor.forClass(OrderRecord.class);
        verify(repository).insertOrder(saved.capture());
        assertThat(result.totalSatang()).isEqualTo(335_900);
        assertThat(result.expiresAt()).isEqualTo(NOW.plusSeconds(30 * 60));
        assertThat(saved.getValue().totalSatang()).isEqualTo(335_900);
        assertThat(saved.getValue().accessTokenHash()).hasSize(64).isNotEqualTo(result.accessToken());
    }

    @Test
    void createsPromptPayUsingTheAuthoritativeOrderAmount() {
        Checkout checkout = createCheckout();
        UUID idempotencyKey = UUID.randomUUID();
        when(gateway.enabled()).thenReturn(true);
        when(repository.findOrder(checkout.created().orderId(), true))
            .thenReturn(Optional.of(checkout.saved()));
        when(repository.findPaymentByIdempotency(checkout.created().orderId(), idempotencyKey))
            .thenReturn(Optional.empty());
        when(repository.findActivePayment(checkout.created().orderId())).thenReturn(Optional.empty());
        ProviderCharge providerCharge = new ProviderCharge(
            "chrg_test_123", PaymentStatus.PENDING, 335_900, "thb",
            "https://api.omise.co/charges/chrg_test_123/documents/doc_test/downloads/qr.png",
            null, null
        );
        when(gateway.createPromptPayCharge(
            eq(checkout.created().orderId()), any(UUID.class), eq(checkout.saved().reference()),
            eq(335_900L), eq("thb"), eq(checkout.saved().expiresAt())
        )).thenReturn(providerCharge);
        when(repository.findPayment(any(UUID.class))).thenAnswer(invocation -> Optional.of(
            new PaymentRecord(
                invocation.getArgument(0), checkout.created().orderId(), providerCharge.id(),
                idempotencyKey, PaymentMethod.PROMPTPAY, 335_900, "thb",
                PaymentStatus.PENDING, providerCharge.qrImageUrl(), null, null,
                checkout.saved().expiresAt()
            )
        ));

        PaymentView result = service.createPromptPayPayment(
            checkout.created().orderId(), checkout.created().accessToken(), idempotencyKey
        );

        assertThat(result.amountSatang()).isEqualTo(335_900);
        assertThat(result.status()).isEqualTo("pending");
        assertThat(result.qrUrl()).isEqualTo("/api/payments/" + result.paymentId() + "/qr");
        verify(repository, never()).activateSubscription(any());
    }

    @Test
    void activatesTheSubscriptionOnlyAfterProviderReportsSuccess() {
        Checkout checkout = createCheckout();
        UUID paymentId = UUID.randomUUID();
        PaymentRecord pending = new PaymentRecord(
            paymentId, checkout.created().orderId(), "chrg_test_456", UUID.randomUUID(),
            PaymentMethod.CARD, 335_900, "thb", PaymentStatus.PENDING,
            null, null, null, checkout.saved().expiresAt()
        );
        PaymentRecord successful = new PaymentRecord(
            paymentId, checkout.created().orderId(), "chrg_test_456", pending.idempotencyKey(),
            PaymentMethod.CARD, 335_900, "thb", PaymentStatus.SUCCESSFUL,
            null, null, null, checkout.saved().expiresAt()
        );
        ProviderCharge providerCharge = new ProviderCharge(
            "chrg_test_456", PaymentStatus.SUCCESSFUL, 335_900, "thb",
            null, null, null
        );
        when(repository.findPayment(paymentId)).thenReturn(
            Optional.of(pending), Optional.of(successful), Optional.of(successful)
        );
        when(repository.findOrder(checkout.created().orderId(), false))
            .thenReturn(Optional.of(checkout.saved()));
        when(gateway.retrieveCharge("chrg_test_456")).thenReturn(providerCharge);

        PaymentView result = service.getPayment(paymentId, checkout.created().accessToken());

        assertThat(result.status()).isEqualTo("successful");
        verify(repository).activateSubscription(checkout.saved());
    }

    private Checkout createCheckout() {
        CoursePrice course = new CoursePrice(
            1L, "Service Design Essentials Course", 355_900, 20_000
        );
        when(repository.findCourse(1L)).thenReturn(Optional.of(course));
        when(repository.findPromotionDiscount(1L, null)).thenReturn(0L);
        OrderCreated created = service.createOrder(1L, null);
        ArgumentCaptor<OrderRecord> saved = ArgumentCaptor.forClass(OrderRecord.class);
        verify(repository).insertOrder(saved.capture());
        return new Checkout(created, saved.getValue());
    }

    private record Checkout(OrderCreated created, OrderRecord saved) {}
}
