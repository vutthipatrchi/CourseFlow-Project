package com.courseflow.payment;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!standalone")
class PaymentRepository {
    private final JdbcTemplate jdbc;

    PaymentRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    Optional<CoursePrice> findCourse(Long courseId) {
        return queryOne(
            """
            SELECT id, name,
                   ROUND(price * 100)::BIGINT AS price_satang,
                   CASE
                     WHEN has_promo = TRUE
                      AND discount IS NOT NULL
                      AND discount_type IS NOT NULL
                      AND (minimum_purchase IS NULL OR price >= minimum_purchase)
                     THEN CASE
                       WHEN discount_type = 'fixed' THEN ROUND(discount * 100)::BIGINT
                       WHEN discount_type = 'percentage' THEN ROUND(price * discount)::BIGINT
                       ELSE 0
                     END
                     ELSE 0
                   END AS default_discount_satang
            FROM courseflow.courses WHERE id = ?
            """,
            (rs, row) -> new CoursePrice(
                rs.getLong("id"), rs.getString("name"),
                rs.getLong("price_satang"), rs.getLong("default_discount_satang")
            ), courseId
        );
    }

    long findPromotionDiscount(Long courseId, String code) {
        if (code == null || code.isBlank()) return 0;
        return queryOne(
            """
            SELECT CASE
                     WHEN discount_type = 'fixed' THEN ROUND(discount * 100)::BIGINT
                     WHEN discount_type = 'percentage' THEN ROUND(price * discount)::BIGINT
                     ELSE 0
                   END AS discount_satang
            FROM courseflow.courses
            WHERE id = ? AND has_promo = TRUE AND UPPER(promo_code) = UPPER(?)
              AND discount IS NOT NULL
              AND (minimum_purchase IS NULL OR price >= minimum_purchase)
            """,
            (rs, row) -> rs.getLong("discount_satang"), courseId, code
        ).orElse(0L);
    }

    void insertOrder(OrderRecord order) {
        jdbc.update(
            """
            INSERT INTO courseflow.orders
              (id, reference, course_id, access_token_hash, subtotal_satang,
               discount_satang, total_satang, currency, status, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            order.id(), order.reference(), order.courseId(), order.accessTokenHash(),
            order.subtotalSatang(), order.discountSatang(), order.totalSatang(),
            order.currency(), order.status().value(), Timestamp.from(order.expiresAt())
        );
    }

    Optional<OrderRecord> findOrder(UUID orderId, boolean lock) {
        String suffix = lock ? " FOR UPDATE" : "";
        return queryOne(
            """
            SELECT o.id, o.reference, o.course_id, c.name, o.access_token_hash,
                   o.subtotal_satang, o.discount_satang, o.total_satang,
                   o.currency, o.status, o.expires_at
            FROM courseflow.orders o
            JOIN courseflow.courses c ON c.id = o.course_id
            WHERE o.id = ?
            """ + suffix,
            this::mapOrder, orderId
        );
    }

    void markOrderExpired(UUID orderId) {
        jdbc.update(
            """
            UPDATE courseflow.orders SET status = 'expired', updated_at = NOW()
            WHERE id = ? AND status = 'pending_payment'
            """, orderId
        );
    }

    void markOrderForReview(UUID orderId) {
        jdbc.update(
            """
            UPDATE courseflow.orders SET status = 'payment_review', updated_at = NOW()
            WHERE id = ? AND status <> 'paid'
            """, orderId
        );
    }

    void insertPayment(PaymentRecord payment) {
        jdbc.update(
            """
            INSERT INTO courseflow.payments
              (id, order_id, idempotency_key, method, amount_satang, currency,
               status, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            payment.id(), payment.orderId(), payment.idempotencyKey(), payment.method().value(),
            payment.amountSatang(), payment.currency(), payment.status().value(),
            Timestamp.from(payment.expiresAt())
        );
    }

    Optional<PaymentRecord> findPayment(UUID paymentId) {
        return queryOne(
            "SELECT * FROM courseflow.payments WHERE id = ?",
            this::mapPayment, paymentId
        );
    }

    Optional<PaymentRecord> findPaymentByIdempotency(UUID orderId, UUID idempotencyKey) {
        return queryOne(
            "SELECT * FROM courseflow.payments WHERE order_id = ? AND idempotency_key = ?",
            this::mapPayment, orderId, idempotencyKey
        );
    }

    Optional<PaymentRecord> findActivePayment(UUID orderId) {
        List<PaymentRecord> results = jdbc.query(
            """
            SELECT * FROM courseflow.payments
            WHERE order_id = ? AND status IN ('creating', 'pending', 'review')
            ORDER BY created_at DESC LIMIT 1
            """, this::mapPayment, orderId
        );
        return results.stream().findFirst();
    }

    Optional<PaymentRecord> findPaymentByChargeId(String chargeId, boolean lock) {
        return queryOne(
            "SELECT * FROM courseflow.payments WHERE provider_charge_id = ?" + (lock ? " FOR UPDATE" : ""),
            this::mapPayment, chargeId
        );
    }

    void updatePaymentFromProvider(UUID paymentId, ProviderCharge charge) {
        jdbc.update(
            """
            UPDATE courseflow.payments
            SET provider_charge_id = ?, status = ?, qr_image_url = ?,
                failure_message = ?, updated_at = NOW()
            WHERE id = ?
            """,
            charge.id(), charge.status().value(), charge.qrImageUrl(),
            charge.failureMessage(), paymentId
        );
    }

    void markPaymentReview(UUID paymentId, String reason) {
        jdbc.update(
            """
            UPDATE courseflow.payments SET status = 'review', failure_message = ?, updated_at = NOW()
            WHERE id = ?
            """, reason, paymentId
        );
    }

    void activateSubscription(OrderRecord order) {
        jdbc.update(
            """
            UPDATE courseflow.orders SET status = 'paid', updated_at = NOW()
            WHERE id = ? AND status IN ('pending_payment', 'expired', 'payment_review')
            """, order.id()
        );
        jdbc.update(
            """
            INSERT INTO courseflow.subscriptions
              (id, order_id, course_id, status, activated_at)
            VALUES (?, ?, ?, 'active', NOW())
            ON CONFLICT (order_id) DO NOTHING
            """, UUID.randomUUID(), order.id(), order.courseId()
        );
    }

    boolean reserveWebhookEvent(String eventId, String eventKey) {
        return jdbc.update(
            """
            INSERT INTO courseflow.webhook_events (event_id, event_key)
            VALUES (?, ?) ON CONFLICT (event_id) DO NOTHING
            """, eventId, eventKey
        ) == 1;
    }

    void completeWebhookEvent(String eventId) {
        jdbc.update(
            "UPDATE courseflow.webhook_events SET processed_at = NOW() WHERE event_id = ?",
            eventId
        );
    }

    private OrderRecord mapOrder(ResultSet rs, int row) throws SQLException {
        return new OrderRecord(
            rs.getObject("id", UUID.class), rs.getString("reference"),
            rs.getLong("course_id"), rs.getString("name"),
            rs.getString("access_token_hash"), rs.getLong("subtotal_satang"),
            rs.getLong("discount_satang"), rs.getLong("total_satang"),
            rs.getString("currency"), OrderStatus.from(rs.getString("status")),
            rs.getTimestamp("expires_at").toInstant()
        );
    }

    private PaymentRecord mapPayment(ResultSet rs, int row) throws SQLException {
        return new PaymentRecord(
            rs.getObject("id", UUID.class), rs.getObject("order_id", UUID.class),
            rs.getString("provider_charge_id"), rs.getObject("idempotency_key", UUID.class),
            PaymentMethod.valueOf(rs.getString("method").toUpperCase()),
            rs.getLong("amount_satang"), rs.getString("currency"),
            PaymentStatus.from(rs.getString("status")), rs.getString("qr_image_url"),
            rs.getString("failure_message"), rs.getTimestamp("expires_at").toInstant()
        );
    }

    private <T> Optional<T> queryOne(String sql, RowMapper<T> mapper, Object... args) {
        try {
            return Optional.ofNullable(jdbc.queryForObject(sql, mapper, args));
        } catch (EmptyResultDataAccessException error) {
            return Optional.empty();
        }
    }
}
