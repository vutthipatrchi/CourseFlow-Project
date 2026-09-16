package com.courseflow.course;

import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!standalone")
public class SubLessonOptionRepository {

    private final JdbcClient jdbcClient;

    public SubLessonOptionRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public List<SubLessonOption> findAll() {
        return jdbcClient
            .sql("""
                SELECT sl.id AS sub_lesson_id, sl.name AS sub_lesson_name,
                       l.name AS lesson_name, c.name AS course_name
                FROM courseflow.sub_lessons sl
                JOIN courseflow.lessons l ON l.id = sl.lesson_id
                JOIN courseflow.courses c ON c.id = l.course_id
                ORDER BY c.name, l.position, sl.position
                """)
            .query((rs, rowNum) -> new SubLessonOption(
                rs.getLong("sub_lesson_id"),
                rs.getString("sub_lesson_name"),
                rs.getString("lesson_name"),
                rs.getString("course_name")
            ))
            .list();
    }
}
