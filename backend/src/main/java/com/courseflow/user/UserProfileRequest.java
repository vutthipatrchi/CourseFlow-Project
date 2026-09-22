package com.courseflow.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;

public record UserProfileRequest(
    @NotBlank String name,
    LocalDate dateOfBirth,
    String educationalBackground,
    @NotBlank @Email String email
) {
}
