package com.courseflow.payment;

import java.time.Instant;
import java.util.List;
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
    static PaymentStatus from(String value) {
        for (var status : values()) if (status.value.equals(value)) return status;
        throw new IllegalArgumentException("Unknown payment status: " + value);
    }
}

record CoursePrice(Long id, String title, long subtotalSatang, long defaultDiscountSatang) {}
record OrderRecord(
    UUID id, String reference, Long courseId, String courseTitle, String customerSubject,
    String promotionCode, long subtotalSatang, long discountSatang, long totalSatang,
    String currency, OrderStatus status, Instant expiresAt
) {}
record PaymentRecord(
    UUID id, UUID orderId, String providerChargeId, UUID idempotencyKey,
    PaymentMethod method, long amountSatang, String currency, PaymentStatus status,
    String qrImageUrl, String authorizeUrl, String failureMessage, Instant expiresAt, Instant createdAt
) {}
record ProviderCharge(
    String id, PaymentStatus status, long amountSatang, String currency,
    String qrImageUrl, String authorizeUrl, String failureMessage, UUID orderId, UUID paymentId
) {}
record OrderCreated(
    UUID orderId, Long courseId, String reference, String courseTitle, String promotionCode,
    long subtotalSatang, long discountSatang, long totalSatang,
    String currency, Instant expiresAt, PaymentView payment
) {}
record PaymentView(
    UUID paymentId, UUID orderId, Long courseId, String reference, String method,
    String status, long amountSatang, String currency, String qrUrl, String authorizeUrl,
    String failureMessage, Instant expiresAt
) {}
record SubscriptionView(
    UUID id, Long courseId, String courseTitle, String reference, Instant activatedAt,
    int completedLessons, int totalLessons, int progressPercent, String status
) {}
record CourseProgressView(
    Long courseId, int completedLessons, int totalLessons, int progressPercent, String status,
    List<CourseSubLessonProgressView> subLessons
) {}
record CourseSubLessonProgressView(
    Long id, String title, String videoUrl, int lessonPosition, String lessonTitle,
    int subLessonPosition, boolean completed
) {}
record DownloadedQr(byte[] bytes, String contentType) {}
