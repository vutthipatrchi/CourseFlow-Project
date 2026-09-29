package com.courseflow.course;

import java.util.List;

public record LessonDetailResponse(
        Long id,
        Long courseId,
        String name,
        int position,
        List<SubLessonResponse> subLessons
) {}
