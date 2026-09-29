package com.courseflow.promocode;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record PromoCode(
    Long id,
    String code,
    BigDecimal minimumPurchase,
    String discountType,
    BigDecimal discountValue,
    List<Long> courseIds,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
