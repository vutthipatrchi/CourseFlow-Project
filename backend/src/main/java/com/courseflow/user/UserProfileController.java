package com.courseflow.user;

import jakarta.validation.Valid;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/profile")
@Profile("!standalone")
public class UserProfileController {
    private final UserProfileRepository profiles;

    public UserProfileController(UserProfileRepository profiles) {
        this.profiles = profiles;
    }

    @GetMapping
    public UserProfile get(@AuthenticationPrincipal Jwt jwt) {
        return profiles.findByClerkUserId(jwt.getSubject()).orElse(UserProfile.EMPTY);
    }

    @PatchMapping
    public UserProfile update(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UserProfileRequest request) {
        return profiles.save(jwt.getSubject(), request);
    }
}
