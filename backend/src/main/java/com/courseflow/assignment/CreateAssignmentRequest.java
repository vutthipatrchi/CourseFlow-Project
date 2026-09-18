package com.courseflow.assignment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateAssignmentRequest(
    @NotNull Long subLessonId,
    @NotBlank @Size(max = 2000) String description
) {
}
