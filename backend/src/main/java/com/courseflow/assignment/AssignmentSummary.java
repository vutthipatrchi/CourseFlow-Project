package com.courseflow.assignment;

import java.time.OffsetDateTime;

public record AssignmentSummary(
    Long id,
    String description,
    Integer durationDays,
    String status,
    String courseName,
    String lessonName,
    String subLessonName,
    OffsetDateTime createdAt
) {
}
