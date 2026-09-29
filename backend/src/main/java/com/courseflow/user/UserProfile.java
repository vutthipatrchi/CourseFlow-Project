package com.courseflow.user;

import java.time.LocalDate;

public record UserProfile(
    String name,
    LocalDate dateOfBirth,
    String educationalBackground,
    String email
) {
    static final UserProfile EMPTY = new UserProfile(null, null, null, null);
}
