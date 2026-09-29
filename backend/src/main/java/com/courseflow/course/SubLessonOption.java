package com.courseflow.course;

public record SubLessonOption(
    Long subLessonId,
    String subLessonName,
    String lessonName,
    String courseName
) {
}
