package com.courseflow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.authorization.AuthorizationDecision;
import java.util.Map;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/catalog/courses", "/api/catalog/courses/*").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/catalog/demo-content").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/catalog/demo-video").permitAll()
                .requestMatchers(HttpMethod.HEAD, "/api/catalog/demo-video").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/uploads/videos/*").permitAll()
                .requestMatchers(HttpMethod.HEAD, "/api/uploads/videos/*").permitAll()
                .requestMatchers(
                    "/api/health",
                    "/api/payments/config",
                    "/api/webhooks/opn"
                ).permitAll()
                .requestMatchers("/api/admin/**").access((authentication, context) -> {
                    if (!(authentication.get() instanceof JwtAuthenticationToken token)) {
                        return new AuthorizationDecision(false);
                    }
                    Object metadata = token.getToken().getClaim("metadata");
                    return new AuthorizationDecision(metadata instanceof Map<?, ?> claims
                        && "admin".equals(claims.get("role")));
                })
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt -> {})
            );

        return http.build();
    }
}
