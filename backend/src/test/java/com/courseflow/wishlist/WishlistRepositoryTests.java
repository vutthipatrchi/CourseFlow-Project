package com.courseflow.wishlist;

import static org.assertj.core.api.Assertions.*;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

// Only run against an explicitly supplied disposable PostgreSQL database.
@SpringBootTest(properties = {"spring.config.location=classpath:application-local.properties",
    "spring.flyway.locations=classpath:db/migration"})
@ActiveProfiles("local")
@Transactional
@EnabledIfSystemProperty(named = "courseflow.test.wishlist", matches = "true")
class WishlistRepositoryTests {
    @MockitoBean private JwtDecoder decoder;
    @Autowired private WishlistRepository repository;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void persistsWithoutAProfileAndIsolatesUsersAndDuplicateAdds() {
        long courseId = jdbc.queryForObject("SELECT MIN(id) FROM courseflow.courses", Long.class);
        String alice = "alice-" + UUID.randomUUID();
        String bob = "bob-" + UUID.randomUUID();
        repository.add(alice, courseId);
        repository.add(alice, courseId);
        assertThat(repository.findAll(alice)).extracting(WishlistCourse::id).containsExactly(courseId);
        assertThat(repository.findAll(bob)).isEmpty();
        repository.remove(bob, courseId);
        assertThat(repository.findAll(alice)).hasSize(1);
        repository.add(bob, courseId);
        repository.remove(alice, courseId);
        repository.remove(alice, courseId);
        assertThat(repository.findAll(alice)).isEmpty();
        assertThat(repository.findAll(bob)).extracting(WishlistCourse::id).containsExactly(courseId);
    }

    @Test
    void rejectsMissingCoursesAndCascadesDeletedCourses() {
        long courseId = jdbc.queryForObject("INSERT INTO courseflow.courses(name,price) VALUES ('Wishlist test', 10) RETURNING id", Long.class);
        String subject = "cascade-" + UUID.randomUUID();
        repository.add(subject, courseId);
        jdbc.update("DELETE FROM courseflow.courses WHERE id = ?", courseId);
        assertThat(repository.findAll(subject)).isEmpty();
        assertThatThrownBy(() -> repository.add(subject, courseId))
            .isInstanceOf(com.courseflow.common.web.ResourceNotFoundException.class);
    }
}
