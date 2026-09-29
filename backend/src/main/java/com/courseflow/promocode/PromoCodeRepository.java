package com.courseflow.promocode;

import com.courseflow.common.web.ResourceNotFoundException;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Profile("!standalone")
public class PromoCodeRepository {
    private static final String SELECT = """
        SELECT id, code, minimum_purchase, discount_type, discount_value, created_at, updated_at
        FROM courseflow.promo_codes
        """;

    private final NamedParameterJdbcTemplate jdbc;
    private final RowMapper<PromoCodeRow> rowMapper = this::mapRow;

    public PromoCodeRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<PromoCode> findAll() {
        return jdbc.query(SELECT + " ORDER BY created_at DESC, id DESC", Map.of(), rowMapper)
            .stream()
            .map(this::loadPromoCode)
            .toList();
    }

    public Optional<PromoCode> findById(long id) {
        return jdbc.query(SELECT + " WHERE id = :id", Map.of("id", id), rowMapper)
            .stream()
            .findFirst()
            .map(this::loadPromoCode);
    }

    public boolean isCodeTaken(String code, Long excludeId) {
        Map<String, Object> params = new HashMap<>();
        params.put("code", code.toUpperCase());
        params.put("excludeId", excludeId);
        Boolean exists = jdbc.queryForObject("""
            SELECT EXISTS(
                SELECT 1 FROM courseflow.promo_codes
                 WHERE UPPER(code) = :code
                   AND (CAST(:excludeId AS BIGINT) IS NULL OR id <> CAST(:excludeId AS BIGINT))
            )
            """, params, Boolean.class);
        return Boolean.TRUE.equals(exists);
    }

    @Transactional
    public PromoCode create(PromoCodeRequest request) {
        var keyHolder = new GeneratedKeyHolder();
        jdbc.update("""
            INSERT INTO courseflow.promo_codes (code, minimum_purchase, discount_type, discount_value)
            VALUES (:code, :minimumPurchase, :discountType, :discountValue)
            """, parameters(request), keyHolder, new String[] {"id"});

        long id = keyHolder.getKey().longValue();
        replaceCourses(id, request.courseIdsOrEmpty());
        return findById(id).orElseThrow(() -> new ResourceNotFoundException("Promo code " + id + " not found"));
    }

    @Transactional
    public Optional<PromoCode> update(long id, PromoCodeRequest request) {
        var params = parameters(request);
        params.addValue("id", id);
        int updated = jdbc.update("""
            UPDATE courseflow.promo_codes
               SET code = :code,
                   minimum_purchase = :minimumPurchase,
                   discount_type = :discountType,
                   discount_value = :discountValue,
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = :id
            """, params);
        if (updated == 0) return Optional.empty();

        replaceCourses(id, request.courseIdsOrEmpty());
        return findById(id);
    }

    public boolean delete(long id) {
        return jdbc.update("DELETE FROM courseflow.promo_codes WHERE id = :id", Map.of("id", id)) > 0;
    }

    private void replaceCourses(long promoCodeId, List<Long> courseIds) {
        jdbc.update("DELETE FROM courseflow.promo_code_courses WHERE promo_code_id = :promoCodeId",
            Map.of("promoCodeId", promoCodeId));
        for (Long courseId : courseIds) {
            jdbc.update("""
                INSERT INTO courseflow.promo_code_courses (promo_code_id, course_id)
                VALUES (:promoCodeId, :courseId)
                """, Map.of("promoCodeId", promoCodeId, "courseId", courseId));
        }
    }

    private PromoCode loadPromoCode(PromoCodeRow row) {
        List<Long> courseIds = jdbc.query("""
            SELECT course_id FROM courseflow.promo_code_courses
             WHERE promo_code_id = :promoCodeId
             ORDER BY course_id
            """, Map.of("promoCodeId", row.id()), (rs, rowNum) -> rs.getLong("course_id"));

        return new PromoCode(
            row.id(), row.code(), row.minimumPurchase(), row.discountType(), row.discountValue(),
            courseIds, row.createdAt(), row.updatedAt()
        );
    }

    private PromoCodeRow mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new PromoCodeRow(
            rs.getLong("id"),
            rs.getString("code"),
            rs.getBigDecimal("minimum_purchase"),
            rs.getString("discount_type"),
            rs.getBigDecimal("discount_value"),
            rs.getObject("created_at", OffsetDateTime.class),
            rs.getObject("updated_at", OffsetDateTime.class)
        );
    }

    private MapSqlParameterSource parameters(PromoCodeRequest request) {
        return new MapSqlParameterSource()
            .addValue("code", request.code().trim())
            .addValue("minimumPurchase", request.minimumPurchase())
            .addValue("discountType", request.discountType())
            .addValue("discountValue", request.discountValue());
    }

    private record PromoCodeRow(
        long id,
        String code,
        BigDecimal minimumPurchase,
        String discountType,
        BigDecimal discountValue,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
    ) {
    }
}
