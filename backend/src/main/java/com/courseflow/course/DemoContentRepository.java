package com.courseflow.course;

import java.util.ArrayList;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!standalone")
public class DemoContentRepository {
    private static final RowMapper<DemoContentRow> MAPPER = (rs, rowNum) -> new DemoContentRow(
        rs.getString("lesson_name"), rs.getString("sub_lesson_name"), rs.getString("title"),
        new DemoReading(rs.getString("title"), rs.getString("objective"),
            paragraphs(rs),
            rs.getString("example"), rs.getString("exercise"), rs.getString("solution")));

    private final JdbcTemplate jdbc;

    public DemoContentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static List<String> paragraphs(java.sql.ResultSet rs) throws java.sql.SQLException {
        List<String> paragraphs = new ArrayList<>();
        paragraphs.add(rs.getString("paragraph_one"));
        paragraphs.add(rs.getString("paragraph_two"));
        String third = rs.getString("paragraph_three");
        String fourth = rs.getString("paragraph_four");
        if (third != null && !third.isBlank()) paragraphs.add(third);
        if (fourth != null && !fourth.isBlank()) paragraphs.add(fourth);
        return paragraphs;
    }

    public List<DemoContentRow> listByTitle(String courseTitle) {
        return jdbc.query("""
            SELECT lesson_name, sub_lesson_name, title, objective,
                   paragraph_one, paragraph_two, paragraph_three, paragraph_four,
                   example, exercise, solution
              FROM courseflow.demo_lesson_content
             WHERE course_title = ?
             ORDER BY lesson_order, sub_lesson_order
            """, MAPPER, courseTitle);
    }

    public List<DemoContentRow> listByCourseId(Long courseId) {
        return jdbc.query("""
            SELECT d.lesson_name, d.sub_lesson_name, d.title, d.objective,
                   d.paragraph_one, d.paragraph_two, d.paragraph_three, d.paragraph_four,
                   d.example, d.exercise, d.solution
              FROM courseflow.demo_lesson_content d
              JOIN courseflow.courses c ON c.name = d.course_title
             WHERE c.id = ?
             ORDER BY d.lesson_order, d.sub_lesson_order
            """, MAPPER, courseId);
    }

    public record DemoContentRow(String lessonName, String subLessonName, String title, DemoReading reading) {
        public DemoContentRow withoutReading() {
            return new DemoContentRow(lessonName, subLessonName, title, null);
        }
    }

    public record DemoReading(String title, String objective, List<String> paragraphs,
                              String example, String exercise, String solution) {}
}
