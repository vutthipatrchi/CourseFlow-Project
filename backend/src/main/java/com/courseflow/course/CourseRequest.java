package com.courseflow.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public record CourseRequest(
    @NotBlank String name,
    @NotNull @DecimalMin("0.0") BigDecimal price,
    @Min(1) Integer learningTime,
    String category,
    boolean hasPromo,
    String promoCode,
    @DecimalMin("0.0") BigDecimal minimumPurchase,
    @DecimalMin("0.0") BigDecimal discount,
    String discountType,
    String summary,
    String description,
    String imageName,
    String videoName,
    String resourceName,
    String accent,
    @NotEmpty(message = "Course must have at least one lesson") List<@Valid LessonRequest> lessonItems
) {
    public record LessonRequest(Long id, @NotBlank String name, @Min(0) int subLessons) {
    }

    @AssertTrue(message = "Promo code, minimum purchase, discount, and discount type are required when promo is enabled")
    public boolean isPromoConfigurationValid() {
        if (!hasPromo) return true;
        return promoCode != null && !promoCode.isBlank()
            && minimumPurchase != null
            && discount != null
            && ("percentage".equals(discountType) || "fixed".equals(discountType));
    }

    @AssertTrue(message = "Percentage discount must not exceed 100")
    public boolean isPercentageDiscountValid() {
        return !"percentage".equals(discountType)
            || discount == null
            || discount.compareTo(BigDecimal.valueOf(100)) <= 0;
    }
}
