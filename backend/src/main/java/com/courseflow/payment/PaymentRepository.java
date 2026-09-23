package com.courseflow.payment;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
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

    void lockCheckout(String subject, Long courseId) {
        // Serialize creation across tabs and instances, including when there is no order yet.
        jdbc.queryForObject("SELECT pg_advisory_xact_lock(hashtextextended(?, 0))",
            (rs, row) -> 0, subject + ":" + courseId);
    }

    Optional<CoursePrice> findCourse(Long courseId) {
        return queryOne("""
            SELECT id, name, ROUND(price * 100)::BIGINT AS price_satang,
              CASE WHEN has_promo = TRUE AND (promo_code IS NULL OR TRIM(promo_code) = '')
                AND discount IS NOT NULL AND (minimum_purchase IS NULL OR price >= minimum_purchase)
              THEN CASE WHEN discount_type = 'fixed' THEN ROUND(discount * 100)::BIGINT
                        WHEN discount_type = 'percentage' THEN ROUND(price * discount)::BIGINT ELSE 0 END
              ELSE 0 END AS default_discount_satang
            FROM courseflow.courses WHERE id = ?
            """, (rs, row) -> new CoursePrice(rs.getLong("id"), rs.getString("name"),
                rs.getLong("price_satang"), rs.getLong("default_discount_satang")), courseId);
    }

    long findPromotionDiscount(Long courseId, String code) {
        if (code == null || code.isBlank()) return 0;

        var managedPromotion = queryOne("""
            SELECT CASE
                     WHEN c.price < p.minimum_purchase THEN 0
                     WHEN EXISTS (
                       SELECT 1 FROM courseflow.promo_code_courses assigned
                       WHERE assigned.promo_code_id = p.id
                     ) AND NOT EXISTS (
                       SELECT 1 FROM courseflow.promo_code_courses assigned
                       WHERE assigned.promo_code_id = p.id AND assigned.course_id = c.id
                     ) THEN 0
                     WHEN p.discount_type = 'fixed' THEN ROUND(p.discount_value * 100)::BIGINT
                     WHEN p.discount_type = 'percent' THEN ROUND(c.price * p.discount_value)::BIGINT
                     ELSE 0
                   END
            FROM courseflow.promo_codes p
            JOIN courseflow.courses c ON c.id = ?
            WHERE UPPER(p.code) = UPPER(?)
            """, (rs, row) -> rs.getLong(1), courseId, code);
        if (managedPromotion.isPresent()) return managedPromotion.get();

        // Keep course-level promotions working while the legacy course fields are phased out.
        return queryOne("""
            SELECT CASE WHEN discount_type = 'fixed' THEN ROUND(discount * 100)::BIGINT
                        WHEN discount_type = 'percentage' THEN ROUND(price * discount)::BIGINT ELSE 0 END
            FROM courseflow.courses WHERE id = ? AND has_promo = TRUE AND UPPER(promo_code) = UPPER(?)
              AND discount IS NOT NULL AND (minimum_purchase IS NULL OR price >= minimum_purchase)
            """, (rs, row) -> rs.getLong(1), courseId, code).orElse(0L);
    }

    Optional<OrderRecord> findOpenOrder(String subject, Long courseId) {
        return queryOne("""
            SELECT * FROM courseflow.orders WHERE customer_subject = ? AND course_id = ?
              AND status IN ('pending_payment', 'payment_review', 'paid') FOR UPDATE
            """, this::mapOrder, subject, courseId);
    }

    void insertOrder(OrderRecord order) {
        jdbc.update("""
            INSERT INTO courseflow.orders
              (id, reference, course_id, course_title, customer_subject, promotion_code,
               subtotal_satang, discount_satang, total_satang, currency, status, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, order.id(), order.reference(), order.courseId(), order.courseTitle(), order.customerSubject(),
            order.promotionCode(), order.subtotalSatang(), order.discountSatang(), order.totalSatang(),
            order.currency(), order.status().value(), Timestamp.from(order.expiresAt()));
    }

    Optional<OrderRecord> findOrder(UUID id, boolean lock) {
        return queryOne("SELECT * FROM courseflow.orders WHERE id = ?" + (lock ? " FOR UPDATE" : ""),
            this::mapOrder, id);
    }

    void closeUnpaidOrder(UUID id) {
        jdbc.update("UPDATE courseflow.orders SET status = 'cancelled', updated_at = NOW() WHERE id = ? AND status = 'pending_payment'", id);
    }

    void markOrderForReview(UUID id) {
        jdbc.update("UPDATE courseflow.orders SET status = 'payment_review', updated_at = NOW() WHERE id = ? AND status <> 'paid'", id);
    }

    void restorePendingOrder(UUID id) {
        jdbc.update("UPDATE courseflow.orders SET status = 'pending_payment', updated_at = NOW() WHERE id = ? AND status = 'payment_review'", id);
    }

    void insertPayment(PaymentRecord payment) {
        jdbc.update("""
            INSERT INTO courseflow.payments
              (id, order_id, idempotency_key, method, amount_satang, currency, status, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, payment.id(), payment.orderId(), payment.idempotencyKey(), payment.method().value(),
            payment.amountSatang(), payment.currency(), payment.status().value(),
            Timestamp.from(payment.expiresAt()), Timestamp.from(payment.createdAt()));
    }

    Optional<PaymentRecord> findPayment(UUID id) {
        return queryOne("SELECT * FROM courseflow.payments WHERE id = ?", this::mapPayment, id);
    }

    Optional<PaymentRecord> findPaymentByIdempotency(UUID orderId, UUID key) {
        return queryOne("SELECT * FROM courseflow.payments WHERE order_id = ? AND idempotency_key = ?", this::mapPayment, orderId, key);
    }

    Optional<PaymentRecord> findActivePayment(UUID orderId) {
        return jdbc.query("""
            SELECT * FROM courseflow.payments WHERE order_id = ?
              AND status IN ('creating', 'pending', 'review', 'successful') ORDER BY created_at DESC LIMIT 1
            """, this::mapPayment, orderId).stream().findFirst();
    }

    Optional<PaymentRecord> findPaymentByChargeId(String chargeId) {
        return queryOne("SELECT * FROM courseflow.payments WHERE provider_charge_id = ?", this::mapPayment, chargeId);
    }

    void updatePaymentFromProvider(UUID id, ProviderCharge charge) {
        jdbc.update("""
            UPDATE courseflow.payments SET provider_charge_id = ?, status = ?, qr_image_url = ?,
              authorize_url = ?, failure_message = ?, updated_at = NOW(), last_checked_at = NOW() WHERE id = ?
            """, charge.id(), charge.status().value(), charge.qrImageUrl(), charge.authorizeUrl(), charge.failureMessage(), id);
    }

    void markPaymentReview(UUID id, String reason) {
        jdbc.update("UPDATE courseflow.payments SET status = 'review', failure_message = ?, updated_at = NOW() WHERE id = ? AND status <> 'successful'", reason, id);
    }

    void markPaymentFailed(UUID id, String reason) {
        jdbc.update("UPDATE courseflow.payments SET status = 'failed', failure_message = ?, updated_at = NOW() WHERE id = ? AND status = 'creating'", reason, id);
    }

    void activateSubscription(OrderRecord order) {
        if (order.customerSubject() == null) throw new CheckoutConflictException("Legacy checkout has no verified owner");
        jdbc.update("UPDATE courseflow.orders SET status = 'paid', updated_at = NOW() WHERE id = ?", order.id());
        jdbc.update("""
            INSERT INTO courseflow.subscriptions (id, order_id, course_id, status, activated_at)
            VALUES (?, ?, ?, 'active', NOW()) ON CONFLICT (order_id) DO NOTHING
            """, UUID.randomUUID(), order.id(), order.courseId());
    }

    List<SubscriptionView> findSubscriptions(String subject) {
        return jdbc.query("""
            SELECT s.id, s.course_id, o.course_title, o.reference, s.activated_at,
                   COUNT(DISTINCT sl.id)::int AS total_lessons,
                   COUNT(DISTINCT progress.sub_lesson_id)::int AS completed_lessons
            FROM courseflow.subscriptions s JOIN courseflow.orders o ON o.id = s.order_id
            LEFT JOIN courseflow.course_lessons lesson ON lesson.course_id = s.course_id
            LEFT JOIN courseflow.sub_lessons sl ON sl.lesson_id = lesson.id
            LEFT JOIN courseflow.subscription_lesson_progress progress
                   ON progress.subscription_id = s.id AND progress.sub_lesson_id = sl.id
            WHERE o.customer_subject = ? AND s.status = 'active'
            GROUP BY s.id, s.course_id, o.course_title, o.reference, s.activated_at
            ORDER BY s.activated_at DESC
            """, (rs, row) -> mapSubscription(rs), subject);
    }

    Optional<CourseProgressView> findCourseProgress(String subject, Long courseId) {
        var subscription = queryOne("""
            SELECT s.id, s.course_id, o.course_title, o.reference, s.activated_at,
                   COUNT(DISTINCT sl.id)::int AS total_lessons,
                   COUNT(DISTINCT progress.sub_lesson_id)::int AS completed_lessons
            FROM courseflow.subscriptions s JOIN courseflow.orders o ON o.id = s.order_id
            LEFT JOIN courseflow.course_lessons lesson ON lesson.course_id = s.course_id
            LEFT JOIN courseflow.sub_lessons sl ON sl.lesson_id = lesson.id
            LEFT JOIN courseflow.subscription_lesson_progress progress
                   ON progress.subscription_id = s.id AND progress.sub_lesson_id = sl.id
            WHERE o.customer_subject = ? AND s.course_id = ? AND s.status = 'active'
            GROUP BY s.id, s.course_id, o.course_title, o.reference, s.activated_at
            """, (rs, row) -> mapSubscription(rs), subject, courseId);
        if (subscription.isEmpty()) return Optional.empty();

        List<CourseSubLessonProgressView> subLessons = jdbc.query("""
            SELECT sl.id, sl.name, sl.video_url, lesson.position AS lesson_position,
                   lesson.name AS lesson_name, sl.position AS sub_lesson_position,
                   (progress.sub_lesson_id IS NOT NULL) AS completed
            FROM courseflow.subscriptions s
            JOIN courseflow.orders o ON o.id = s.order_id
            JOIN courseflow.course_lessons lesson ON lesson.course_id = s.course_id
            JOIN courseflow.sub_lessons sl ON sl.lesson_id = lesson.id
            LEFT JOIN courseflow.subscription_lesson_progress progress
                   ON progress.subscription_id = s.id AND progress.sub_lesson_id = sl.id
            WHERE o.customer_subject = ? AND s.course_id = ? AND s.status = 'active'
            ORDER BY lesson.position, sl.position
            """, (rs, row) -> new CourseSubLessonProgressView(rs.getLong("id"),
                rs.getString("name"), rs.getString("video_url"), rs.getInt("lesson_position"),
                rs.getString("lesson_name"), rs.getInt("sub_lesson_position"),
                rs.getBoolean("completed")), subject, courseId);
        SubscriptionView view = subscription.get();
        return Optional.of(new CourseProgressView(view.courseId(), view.completedLessons(),
            view.totalLessons(), view.progressPercent(), view.status(), subLessons));
    }

    void completeSubLesson(String subject, Long courseId, int lessonPosition, int subLessonPosition) {
        int updated = jdbc.update("""
            INSERT INTO courseflow.subscription_lesson_progress
                (subscription_id, sub_lesson_id, completed_at)
            SELECT s.id, sl.id, NOW()
            FROM courseflow.subscriptions s
            JOIN courseflow.orders o ON o.id = s.order_id
            JOIN courseflow.course_lessons lesson ON lesson.course_id = s.course_id
            JOIN courseflow.sub_lessons sl ON sl.lesson_id = lesson.id
            WHERE o.customer_subject = ? AND s.course_id = ? AND s.status = 'active'
              AND lesson.position = ? AND sl.position = ?
            ON CONFLICT (subscription_id, sub_lesson_id)
            DO UPDATE SET completed_at = EXCLUDED.completed_at
            """, subject, courseId, lessonPosition, subLessonPosition);
        if (updated == 0) throw new com.courseflow.common.web.ResourceNotFoundException(
            "Active course or sub-lesson not found");
    }

    private SubscriptionView mapSubscription(ResultSet rs) throws SQLException {
        int total = rs.getInt("total_lessons");
        int completed = rs.getInt("completed_lessons");
        int percent = total == 0 ? 0 : Math.min(100, (int) Math.round(completed * 100.0 / total));
        String status = total > 0 && completed >= total ? "completed" : "in-progress";
        return new SubscriptionView(rs.getObject("id", UUID.class), rs.getLong("course_id"),
            rs.getString("course_title"), rs.getString("reference"),
            rs.getTimestamp("activated_at").toInstant(), completed, total, percent, status);
    }

    List<PaymentRecord> claimReconciliationBatch(Instant now) {
        // A lease prevents app instances from scanning the same attempts every minute.
        return jdbc.query("""
            UPDATE courseflow.payments SET last_checked_at = ? WHERE id IN (
              SELECT id FROM courseflow.payments WHERE status IN ('creating', 'pending', 'review')
                AND created_at < ? AND (last_checked_at IS NULL OR last_checked_at < ?)
              ORDER BY last_checked_at NULLS FIRST, created_at LIMIT 20 FOR UPDATE SKIP LOCKED
            ) RETURNING *
            """, this::mapPayment, Timestamp.from(now), Timestamp.from(now.minusSeconds(60)),
            Timestamp.from(now.minusSeconds(300)));
    }

    boolean reserveWebhookEvent(String id, String key) {
        return jdbc.update("INSERT INTO courseflow.webhook_events (event_id, event_key) VALUES (?, ?) ON CONFLICT (event_id) DO NOTHING", id, key) == 1;
    }

    void completeWebhookEvent(String id) {
        jdbc.update("UPDATE courseflow.webhook_events SET processed_at = NOW() WHERE event_id = ?", id);
    }

    private OrderRecord mapOrder(ResultSet rs, int row) throws SQLException {
        return new OrderRecord(rs.getObject("id", UUID.class), rs.getString("reference"), rs.getLong("course_id"),
            rs.getString("course_title"), rs.getString("customer_subject"), rs.getString("promotion_code"),
            rs.getLong("subtotal_satang"), rs.getLong("discount_satang"), rs.getLong("total_satang"),
            rs.getString("currency"), OrderStatus.from(rs.getString("status")), rs.getTimestamp("expires_at").toInstant());
    }

    private PaymentRecord mapPayment(ResultSet rs, int row) throws SQLException {
        return new PaymentRecord(rs.getObject("id", UUID.class), rs.getObject("order_id", UUID.class),
            rs.getString("provider_charge_id"), rs.getObject("idempotency_key", UUID.class),
            PaymentMethod.valueOf(rs.getString("method").toUpperCase(java.util.Locale.ROOT)),
            rs.getLong("amount_satang"), rs.getString("currency"), PaymentStatus.from(rs.getString("status")),
            rs.getString("qr_image_url"), rs.getString("authorize_url"), rs.getString("failure_message"),
            rs.getTimestamp("expires_at").toInstant(), rs.getTimestamp("created_at").toInstant());
    }

    private <T> Optional<T> queryOne(String sql, RowMapper<T> mapper, Object... args) {
        try { return Optional.ofNullable(jdbc.queryForObject(sql, mapper, args)); }
        catch (EmptyResultDataAccessException error) { return Optional.empty(); }
    }
}
