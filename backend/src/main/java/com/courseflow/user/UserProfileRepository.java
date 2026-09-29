package com.courseflow.user;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Profile("!standalone")
public class UserProfileRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public UserProfileRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<UserProfile> findByClerkUserId(String clerkUserId) {
        return jdbc.query("""
            SELECT name, date_of_birth, educational_background, email
              FROM courseflow.users
             WHERE clerk_user_id = :clerkUserId
            """, Map.of("clerkUserId", clerkUserId), (resultSet, rowNumber) -> new UserProfile(
                resultSet.getString("name"),
                resultSet.getObject("date_of_birth", LocalDate.class),
                resultSet.getString("educational_background"),
                resultSet.getString("email")
            ))
            .stream()
            .findFirst();
    }

    /**
     * Upserts by clerk_user_id: no row is created until the user's first save, since
     * we only learn their email (a NOT NULL column) from this request, not at sign-in.
     */
    @Transactional
    public UserProfile save(String clerkUserId, UserProfileRequest request) {
        var params = new MapSqlParameterSource()
            .addValue("clerkUserId", clerkUserId)
            .addValue("name", request.name().trim())
            .addValue("dateOfBirth", request.dateOfBirth())
            .addValue("educationalBackground", blankToNull(request.educationalBackground()))
            .addValue("email", request.email().trim());

        jdbc.update("""
            INSERT INTO courseflow.users (clerk_user_id, email, name, date_of_birth, educational_background)
            VALUES (:clerkUserId, :email, :name, :dateOfBirth, :educationalBackground)
            ON CONFLICT (clerk_user_id) DO UPDATE
               SET name = EXCLUDED.name,
                   date_of_birth = EXCLUDED.date_of_birth,
                   educational_background = EXCLUDED.educational_background,
                   email = EXCLUDED.email
            """, params);

        return findByClerkUserId(clerkUserId).orElseThrow();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
