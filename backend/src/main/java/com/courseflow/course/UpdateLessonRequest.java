package com.courseflow.course;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record UpdateLessonRequest(
        @NotBlank String name,
        @NotNull List<@Valid SubLessonWriteRequest> subLessons
) {}
