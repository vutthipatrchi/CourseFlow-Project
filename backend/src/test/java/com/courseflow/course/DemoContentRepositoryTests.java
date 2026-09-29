package com.courseflow.course;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("local")
@EnabledIfSystemProperty(named = "spring.profiles.active", matches = "local")
class DemoContentRepositoryTests {
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DemoContentRepository repository;

    @Test
    void migrationProvidesAllReadingsGroupedUnderSharedLessons() {
        assertThat(jdbc.queryForObject(
            "SELECT COUNT(*) FROM courseflow.demo_lesson_content", Integer.class)).isEqualTo(118);
        assertThat(jdbc.queryForObject(
            "SELECT COUNT(DISTINCT course_title) FROM courseflow.demo_lesson_content", Integer.class))
            .isEqualTo(10);

        var readings = repository.listByTitle("Service Design Essentials");
        assertThat(readings).hasSize(9);
        assertThat(readings.stream()
                .filter(row -> row.lessonName().equals("Introduction to Service Design"))
                .map(DemoContentRepository.DemoContentRow::subLessonName))
            .containsExactly(
                "Introduction to Service Design",
                "Course Overview",
                "Getting to Know You",
                "What is Service Design ?");

        Integer maxSubs = jdbc.queryForObject("""
            SELECT MAX(sub_lessons)
              FROM courseflow.course_lessons lesson
              JOIN courseflow.courses course ON course.id = lesson.course_id
             WHERE course.name = 'Service Design Essentials'
            """, Integer.class);
        assertThat(maxSubs).isEqualTo(4);
    }
}
