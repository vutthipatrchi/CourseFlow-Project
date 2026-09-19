package com.courseflow.payment;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.util.Map;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
    OrderCreated createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return payments.createOrder(request.courseId(), request.promotionCode());
    }

    @PostMapping("/orders/{orderId}/payments/card")
    PaymentView card(
        @PathVariable UUID orderId,
        @RequestHeader(PaymentService.CHECKOUT_TOKEN_HEADER) String checkoutToken,
        @RequestHeader("Idempotency-Key") UUID idempotencyKey,
        @Valid @RequestBody CardPaymentRequest request
    ) {
        return payments.createCardPayment(orderId, checkoutToken, idempotencyKey, request.cardToken());
    }

    @PostMapping("/orders/{orderId}/payments/promptpay")
    PaymentView promptPay(
        @PathVariable UUID orderId,
        @RequestHeader(PaymentService.CHECKOUT_TOKEN_HEADER) String checkoutToken,
        @RequestHeader("Idempotency-Key") UUID idempotencyKey
    ) {
        return payments.createPromptPayPayment(orderId, checkoutToken, idempotencyKey);
    }

    @GetMapping("/payments/{paymentId}")
    PaymentView status(
        @PathVariable UUID paymentId,
        @RequestHeader(PaymentService.CHECKOUT_TOKEN_HEADER) String checkoutToken
    ) {
        return payments.getPayment(paymentId, checkoutToken);
    }

    @GetMapping("/payments/{paymentId}/qr")
    ResponseEntity<byte[]> qr(
        @PathVariable UUID paymentId,
        @RequestHeader(PaymentService.CHECKOUT_TOKEN_HEADER) String checkoutToken
    ) {
        DownloadedQr qr = payments.downloadQr(paymentId, checkoutToken);
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .contentType(MediaType.parseMediaType(qr.contentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=courseflow-qr-" + paymentId + ".png")
            .body(qr.bytes());
    }

    @PostMapping("/webhooks/opn")
    ResponseEntity<Void> webhook(@RequestBody JsonNode payload) {
        String eventId = requiredText(payload, "id");
        String eventKey = requiredText(payload, "key");
        String chargeId = requiredText(payload.path("data"), "id");
        payments.handleWebhook(eventId, eventKey, chargeId);
        return ResponseEntity.noContent().build();
    }

    private String requiredText(JsonNode node, String field) {
        String value = node.path(field).asText("");
        if (value.isBlank()) throw new IllegalArgumentException("Missing webhook field: " + field);
        return value;
    }

    record CreateOrderRequest(
        @NotNull @Positive Long courseId,
        @Pattern(regexp = "[A-Za-z0-9_-]{0,30}") String promotionCode
    ) {}

    record CardPaymentRequest(
        @NotBlank @Pattern(regexp = "tokn_(test_)?[A-Za-z0-9]+") String cardToken
    ) {}
}
