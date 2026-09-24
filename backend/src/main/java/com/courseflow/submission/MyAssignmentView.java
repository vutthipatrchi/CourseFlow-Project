package com.courseflow.submission;

import java.time.OffsetDateTime;

public record MyAssignmentView(
    Long id,
    String description,
    Long courseId,
    String courseName,
    String lessonName,
    Long subLessonId,
    String subLessonName,
    Integer durationDays,
    OffsetDateTime dueAt,
    String status,
    String answer,
    OffsetDateTime submittedAt
) {
}
