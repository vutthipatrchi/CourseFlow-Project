package com.courseflow.submission;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!standalone")
public class AssignmentSubmissionRepository {

    // Only assignments whose course has an active subscription for this subject are visible;
    // this is the single point that keeps "my assignments" scoped to courses the student paid for.
    private static final String SELECT_MY_ASSIGNMENTS = """
        SELECT a.id, a.description, c.id AS course_id, c.name AS course_name,
               l.name AS lesson_name, l.position AS lesson_position,
               sl.id AS sub_lesson_id, sl.name AS sub_lesson_name, sl.position AS sub_lesson_position,
               a.duration_days,
               a.created_at + (a.duration_days * INTERVAL '1 day') AS due_at,
               sub.answer, sub.submitted_at
        FROM courseflow.assignments a
        JOIN courseflow.sub_lessons sl ON sl.id = a.sub_lesson_id
        JOIN courseflow.course_lessons l ON l.id = sl.lesson_id
        JOIN courseflow.courses c ON c.id = l.course_id
        JOIN courseflow.subscriptions s ON s.course_id = c.id AND s.status = 'active'
        JOIN courseflow.orders o ON o.id = s.order_id AND o.customer_subject = :subject
        LEFT JOIN courseflow.assignment_submissions sub
               ON sub.assignment_id = a.id AND sub.student_subject = :subject
        """;

    private final JdbcClient jdbcClient;

    public AssignmentSubmissionRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public List<MyAssignmentRow> findMyAssignments(String subject) {
        return jdbcClient
            .sql(SELECT_MY_ASSIGNMENTS + " ORDER BY a.created_at DESC")
            .param("subject", subject)
            .query(this::mapRow)
            .list();
    }

    public Optional<MyAssignmentRow> findMyAssignmentById(long assignmentId, String subject) {
        return jdbcClient
            .sql(SELECT_MY_ASSIGNMENTS + " AND a.id = :assignmentId")
            .param("subject", subject)
            .param("assignmentId", assignmentId)
            .query(this::mapRow)
            .optional();
    }

    public boolean isSubscribedToAssignment(long assignmentId, String subject) {
        Boolean exists = jdbcClient
            .sql("""
                SELECT EXISTS (
                    SELECT 1
                    FROM courseflow.assignments a
                    JOIN courseflow.sub_lessons sl ON sl.id = a.sub_lesson_id
                    JOIN courseflow.course_lessons l ON l.id = sl.lesson_id
                    JOIN courseflow.courses c ON c.id = l.course_id
                    JOIN courseflow.subscriptions s ON s.course_id = c.id AND s.status = 'active'
                    JOIN courseflow.orders o ON o.id = s.order_id AND o.customer_subject = :subject
                    WHERE a.id = :assignmentId
                )
                """)
            .param("assignmentId", assignmentId)
            .param("subject", subject)
            .query(Boolean.class)
            .single();
        return Boolean.TRUE.equals(exists);
    }

    public void upsertSubmission(long assignmentId, String subject, String answer) {
        jdbcClient
            .sql("""
                INSERT INTO courseflow.assignment_submissions (assignment_id, student_subject, answer)
                VALUES (:assignmentId, :subject, :answer)
                ON CONFLICT (assignment_id, student_subject)
                DO UPDATE SET answer = EXCLUDED.answer, updated_at = CURRENT_TIMESTAMP
                """)
            .param("assignmentId", assignmentId)
            .param("subject", subject)
            .param("answer", answer)
            .update();
    }

    private MyAssignmentRow mapRow(ResultSet rs, int rowNum) throws SQLException {
        return new MyAssignmentRow(
            rs.getLong("id"),
            rs.getString("description"),
            rs.getLong("course_id"),
            rs.getString("course_name"),
            rs.getString("lesson_name"),
            rs.getInt("lesson_position"),
            rs.getLong("sub_lesson_id"),
            rs.getString("sub_lesson_name"),
            rs.getInt("sub_lesson_position"),
            rs.getObject("duration_days", Integer.class),
            rs.getObject("due_at", OffsetDateTime.class),
            rs.getString("answer"),
            rs.getObject("submitted_at", OffsetDateTime.class)
        );
    }
}
