package com.courseflow.payment;

import java.time.Instant;
import java.util.UUID;

enum OrderStatus {
    PENDING_PAYMENT("pending_payment"), PAID("paid"), EXPIRED("expired"),
    CANCELLED("cancelled"), PAYMENT_REVIEW("payment_review");

    private final String value;
    OrderStatus(String value) { this.value = value; }
    String value() { return value; }
    static OrderStatus from(String value) {
        for (var status : values()) if (status.value.equals(value)) return status;
        throw new IllegalArgumentException("Unknown order status: " + value);
    }
}

enum PaymentMethod {
    CARD("card"), PROMPTPAY("promptpay");
    private final String value;
    PaymentMethod(String value) { this.value = value; }
    String value() { return value; }
}

enum PaymentStatus {
    CREATING("creating"), PENDING("pending"), SUCCESSFUL("successful"),
    FAILED("failed"), EXPIRED("expired"), REVIEW("review");

    private final String value;
    PaymentStatus(String value) { this.value = value; }
    String value() { return value; }
    boolean terminal() { return this == SUCCESSFUL || this == FAILED || this == EXPIRED || this == REVIEW; }
    static PaymentStatus from(String value) {
        for (var status : values()) if (status.value.equals(value)) return status;
        throw new IllegalArgumentException("Unknown payment status: " + value);
    }
}

record CoursePrice(Long id, String title, long subtotalSatang, long defaultDiscountSatang) {}

record OrderRecord(
    UUID id, String reference, Long courseId, String courseTitle, String accessTokenHash,
    long subtotalSatang, long discountSatang, long totalSatang, String currency,
    OrderStatus status, Instant expiresAt
) {}

record PaymentRecord(
    UUID id, UUID orderId, String providerChargeId, UUID idempotencyKey,
    PaymentMethod method, long amountSatang, String currency, PaymentStatus status,
    String qrImageUrl, String failureMessage, Instant expiresAt
) {}

record ProviderCharge(
    String id, PaymentStatus status, long amountSatang, String currency,
    String qrImageUrl, String failureMessage
) {}

record OrderCreated(
    UUID orderId, String accessToken, String reference, String courseTitle,
    long subtotalSatang, long discountSatang, long totalSatang, String currency,
    Instant expiresAt
) {}

record PaymentView(
    UUID paymentId, UUID orderId, String reference, String method, String status,
    long amountSatang, String currency, String qrUrl, String failureMessage,
    Instant expiresAt
) {}

record DownloadedQr(byte[] bytes, String contentType) {}
