package com.courseflow.config;

import java.util.Map;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor;

public final class AdminJwt {
    private AdminJwt() {}

    public static JwtRequestPostProcessor jwt() {
        return org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors
            .jwt().jwt(token -> token.claim("metadata", Map.of("role", "admin")));
    }
}
