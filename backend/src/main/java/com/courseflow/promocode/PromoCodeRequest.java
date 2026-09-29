package com.courseflow.promocode;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.util.List;

public record PromoCodeRequest(
    @NotBlank @Pattern(regexp = "^[A-Za-z0-9]+$", message = "must contain only letters and numbers")
    String code,
    @NotNull @DecimalMin("0.0") BigDecimal minimumPurchase,
    @NotBlank String discountType,
    @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal discountValue,
    List<Long> courseIds
) {
    /** Empty/null courseIds means "All courses". */
    public List<Long> courseIdsOrEmpty() {
        return courseIds == null ? List.of() : courseIds;
    }

    @AssertTrue(message = "Discount type must be 'fixed' or 'percent'")
    public boolean isDiscountTypeValid() {
        return "fixed".equals(discountType) || "percent".equals(discountType);
    }

    @AssertTrue(message = "Percent discount cannot exceed 100")
    public boolean isPercentWithinRange() {
        return !"percent".equals(discountType)
            || discountValue == null
            || discountValue.compareTo(BigDecimal.valueOf(100)) <= 0;
    }

    @AssertTrue(message = "Discount amount cannot exceed the minimum purchase amount")
    public boolean isFixedDiscountWithinMinimumPurchase() {
        return !"fixed".equals(discountType)
            || discountValue == null
            || minimumPurchase == null
            || discountValue.compareTo(minimumPurchase) <= 0;
    }
}
