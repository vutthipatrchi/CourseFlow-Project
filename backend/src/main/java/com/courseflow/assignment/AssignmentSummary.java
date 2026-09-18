package com.courseflow.assignment;

import java.time.OffsetDateTime;

public record AssignmentSummary(
    Long id,
    String description,
    String courseName,
    String lessonName,
    String subLessonName,
    OffsetDateTime createdAt
) {
}
