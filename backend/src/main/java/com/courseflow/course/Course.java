package com.courseflow.course;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record Course(
    long id,
    String name,
    int lessons,
    BigDecimal price,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    String accent,
    String category,
    Integer learningTime,
    boolean hasPromo,
    String promoCode,
    BigDecimal minimumPurchase,
    BigDecimal discount,
    String discountType,
    String summary,
    String description,
    String imageName,
    String videoName,
    String resourceName,
    List<CourseLesson> lessonItems
) {
}
