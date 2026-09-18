package com.courseflow.assignment;

import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!standalone")
public class AssignmentRepository {

    private final JdbcClient jdbcClient;

    public AssignmentRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public boolean subLessonExists(Long subLessonId) {
        Boolean exists = jdbcClient
            .sql("SELECT EXISTS(SELECT 1 FROM courseflow.sub_lessons WHERE id = :id)")
            .param("id", subLessonId)
            .query(Boolean.class)
            .single();
        return Boolean.TRUE.equals(exists);
    }

    public AssignmentResponse insert(CreateAssignmentRequest request) {
        return jdbcClient
            .sql("""
                INSERT INTO courseflow.assignments (sub_lesson_id, description)
                VALUES (:subLessonId, :description)
                RETURNING id, sub_lesson_id, description, created_at
                """)
            .param("subLessonId", request.subLessonId())
            .param("description", request.description())
            .query((rs, rowNum) -> new AssignmentResponse(
                rs.getLong("id"),
                rs.getLong("sub_lesson_id"),
                rs.getString("description"),
                rs.getObject("created_at", OffsetDateTime.class)
            ))
            .single();
    }

    public List<AssignmentSummary> findAllWithContext() {
        return jdbcClient
            .sql("""
                SELECT a.id, a.description, a.created_at,
                       c.name AS course_name, l.name AS lesson_name, sl.name AS sub_lesson_name
                FROM courseflow.assignments a
                JOIN courseflow.sub_lessons sl ON sl.id = a.sub_lesson_id
                JOIN courseflow.lessons l ON l.id = sl.lesson_id
                JOIN courseflow.courses c ON c.id = l.course_id
                ORDER BY a.created_at DESC
                """)
            .query((rs, rowNum) -> new AssignmentSummary(
                rs.getLong("id"),
                rs.getString("description"),
                rs.getString("course_name"),
                rs.getString("lesson_name"),
                rs.getString("sub_lesson_name"),
                rs.getObject("created_at", OffsetDateTime.class)
            ))
            .list();
    }
}
