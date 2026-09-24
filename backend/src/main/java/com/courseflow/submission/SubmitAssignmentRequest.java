package com.courseflow.submission;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitAssignmentRequest(
    @NotBlank @Size(max = 4000) String answer
) {
}
