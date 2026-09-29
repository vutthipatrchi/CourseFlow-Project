package com.courseflow.course;

import jakarta.validation.constraints.NotBlank;

public record SubLessonWriteRequest(
        Long id,
        @NotBlank String name,
        @NotBlank String videoUrl
) {}
