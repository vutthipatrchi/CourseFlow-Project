package com.courseflow.submission;

import java.time.OffsetDateTime;

record MyAssignmentRow(
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
    String answer,
    OffsetDateTime submittedAt
) {
}
