package com.courseflow.course;

public record LessonSummaryResponse(
        Long id,
        String name,
        int position,
        int subLessonCount
) {}
