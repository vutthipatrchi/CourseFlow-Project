package com.courseflow.assignment;

import java.time.OffsetDateTime;

public record AssignmentResponse(
    Long id,
    Long subLessonId,
    String description,
    Integer durationDays,
    String status,
    OffsetDateTime createdAt
) {
}
