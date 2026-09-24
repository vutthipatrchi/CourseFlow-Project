package com.courseflow.submission;

import java.time.OffsetDateTime;

record MyAssignmentRow(
    Long id,
    String description,
    Long courseId,
    String courseName,
    String lessonName,
    Long subLessonId,
    String subLessonName,
    Integer durationDays,
    OffsetDateTime dueAt,
    String answer,
    OffsetDateTime submittedAt
) {
}
