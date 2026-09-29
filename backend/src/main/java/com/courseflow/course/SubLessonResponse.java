package com.courseflow.course;

public record SubLessonResponse(
        Long id,
        String name,
        String videoUrl,
        int position
) {}
