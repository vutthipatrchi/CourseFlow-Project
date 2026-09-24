package com.courseflow.submission;

import java.time.OffsetDateTime;

public record MyAssignmentView(
    Long id,
    String description,
    Long courseId,
    String courseName,
    String lessonName,
    int lessonPosition,
    Long subLessonId,
    String subLessonName,
    int subLessonPosition,
    Integer durationDays,
    OffsetDateTime dueAt,
    String status,
    String answer,
    OffsetDateTime submittedAt
) {
}
