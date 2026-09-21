package com.courseflow.payment;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@Profile("!standalone")
@RequestMapping("/api")
class PaymentController {
    private final PaymentService payments;
    PaymentController(PaymentService payments) { this.payments = payments; }

    @GetMapping("/payments/config")
    Map<String, Object> config() {
        return Map.of("enabled", payments.providerEnabled(), "publicKey", payments.providerPublicKey());
    }

    @PostMapping("/orders")
    OrderCreated createOrder(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody CreateOrderRequest request) {
        return payments.createOrder(jwt.getSubject(), request.courseId(), request.promotionCode());
    }

    @PostMapping("/orders/{orderId}/payments/card")
    PaymentView card(@PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt,
        @RequestHeader("Idempotency-Key") UUID key, @Valid @RequestBody CardPaymentRequest request) {
        return payments.createCardPayment(orderId, jwt.getSubject(), key, request.cardToken());
    }

    @PostMapping("/orders/{orderId}/payments/promptpay")
    PaymentView promptPay(@PathVariable UUID orderId, @AuthenticationPrincipal Jwt jwt,
        @RequestHeader("Idempotency-Key") UUID key) {
        return payments.createPromptPayPayment(orderId, jwt.getSubject(), key);
    }

    @GetMapping("/payments/{paymentId}")
    ResponseEntity<PaymentView> status(@PathVariable UUID paymentId, @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(payments.getPayment(paymentId, jwt.getSubject()));
    }

    @GetMapping("/payments/{paymentId}/qr")
    ResponseEntity<byte[]> qr(@PathVariable UUID paymentId, @AuthenticationPrincipal Jwt jwt) {
        DownloadedQr qr = payments.downloadQr(paymentId, jwt.getSubject());
        String extension = qr.contentType().equals("image/svg+xml") ? "svg" : qr.contentType().equals("image/jpeg") ? "jpg" : "png";
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).contentType(MediaType.parseMediaType(qr.contentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=courseflow-qr-" + paymentId + "." + extension)
            .body(qr.bytes());
    }

    @GetMapping("/me/subscriptions")
    List<SubscriptionView> subscriptions(@AuthenticationPrincipal Jwt jwt) { return payments.subscriptions(jwt.getSubject()); }

    @PostMapping("/webhooks/opn")
    ResponseEntity<Void> webhook(@Valid @RequestBody WebhookRequest payload) {
        payments.handleWebhook(payload.id(), payload.key(), payload.data().id());
        return ResponseEntity.noContent().build();
    }

    record CreateOrderRequest(@NotNull @Positive Long courseId,
        @Pattern(regexp = "[A-Za-z0-9_-]{0,30}") String promotionCode) {}
    record CardPaymentRequest(@NotBlank @Pattern(regexp = "tokn_(test_)?[A-Za-z0-9]+") String cardToken) {}
    record WebhookRequest(@NotBlank @Pattern(regexp = "evnt_(test_)?[A-Za-z0-9]+") String id,
        @NotBlank @Size(max = 80) String key, @NotNull @Valid WebhookData data) {}
    record WebhookData(@NotBlank @Size(max = 80) String id) {}
}