package com.courseflow.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record CreateLessonRequest(
        @NotBlank String name,
        @NotEmpty List<@Valid SubLessonWriteRequest> subLessons
) {}
