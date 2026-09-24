package com.courseflow.submission;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("local")
@EnabledIfSystemProperty(named = "spring.profiles.active", matches = "local")
@Transactional
class AssignmentSubmissionRepositoryTests {

    @Autowired
    private AssignmentSubmissionRepository repository;

    @Autowired
    private JdbcClient jdbc;

    private record Target(long courseId, long subLessonId) {
    }

    private Target anySubLesson() {
        return jdbc.sql("""
                SELECT c.id AS course_id, sl.id AS sub_lesson_id
                FROM courseflow.sub_lessons sl
                JOIN courseflow.course_lessons l ON l.id = sl.lesson_id
                JOIN courseflow.courses c ON c.id = l.course_id
                ORDER BY sl.id LIMIT 1
                """)
            .query((rs, row) -> new Target(rs.getLong("course_id"), rs.getLong("sub_lesson_id")))
            .single();
    }

    private long insertAssignment(long subLessonId, Integer durationDays, String createdAtSql) {
        return jdbc.sql("""
                INSERT INTO courseflow.assignments (sub_lesson_id, description, duration_days, created_at)
                VALUES (:subLessonId, 'Repository test question', :durationDays, %s)
                RETURNING id
                """.formatted(createdAtSql))
            .param("subLessonId", subLessonId)
            .param("durationDays", durationDays)
            .query(Long.class)
            .single();
    }

    private void subscribe(String subject, long courseId, String subscriptionStatus) {
        UUID orderId = UUID.randomUUID();
        jdbc.sql("""
                INSERT INTO courseflow.orders (id, reference, course_id, subtotal_satang, total_satang,
                                               status, expires_at, customer_subject, course_title)
                VALUES (:id, :reference, :courseId, 100000, 100000, 'paid', now() + interval '1 day',
                        :subject, 'Test course')
                """)
            .param("id", orderId)
            .param("reference", "T" + orderId.toString().substring(0, 12))
            .param("courseId", courseId)
            .param("subject", subject)
            .update();
        jdbc.sql("""
                INSERT INTO courseflow.subscriptions (id, order_id, course_id, status, activated_at)
                VALUES (:id, :orderId, :courseId, :status, now())
                """)
            .param("id", UUID.randomUUID())
            .param("orderId", orderId)
            .param("courseId", courseId)
            .param("status", subscriptionStatus)
            .update();
    }

    @Test
    void listsAssignmentsOfSubscribedCoursesWithDueDateAndNoAnswerYet() {
        String subject = "test-" + UUID.randomUUID();
        Target target = anySubLesson();
        long assignmentId = insertAssignment(target.subLessonId(), 3, "now()");
        subscribe(subject, target.courseId(), "active");

        var mine = repository.findMyAssignments(subject).stream()
            .filter(row -> row.id() == assignmentId).findFirst().orElseThrow();

        assertThat(mine.courseId()).isEqualTo(target.courseId());
        assertThat(mine.subLessonId()).isEqualTo(target.subLessonId());
        assertThat(mine.durationDays()).isEqualTo(3);
        assertThat(mine.dueAt()).isNotNull();
        assertThat(mine.answer()).isNull();
    }

    @Test
    void hidesAssignmentsFromOtherStudentsAndInactiveSubscriptions() {
        String subscriber = "test-" + UUID.randomUUID();
        String stranger = "test-" + UUID.randomUUID();
        String cancelled = "test-" + UUID.randomUUID();
        Target target = anySubLesson();
        long assignmentId = insertAssignment(target.subLessonId(), null, "now()");
        subscribe(subscriber, target.courseId(), "active");
        subscribe(cancelled, target.courseId(), "cancelled");

        assertThat(repository.isSubscribedToAssignment(assignmentId, subscriber)).isTrue();
        assertThat(repository.isSubscribedToAssignment(assignmentId, stranger)).isFalse();
        assertThat(repository.isSubscribedToAssignment(assignmentId, cancelled)).isFalse();
        assertThat(repository.findMyAssignments(stranger)).isEmpty();
        assertThat(repository.findMyAssignments(cancelled)).isEmpty();
        assertThat(repository.findMyAssignmentById(assignmentId, stranger)).isEmpty();
    }

    @Test
    void assignmentWithoutDurationHasNoDueDate() {
        String subject = "test-" + UUID.randomUUID();
        Target target = anySubLesson();
        long assignmentId = insertAssignment(target.subLessonId(), null, "now()");
        subscribe(subject, target.courseId(), "active");

        var mine = repository.findMyAssignmentById(assignmentId, subject).orElseThrow();

        assertThat(mine.durationDays()).isNull();
        assertThat(mine.dueAt()).isNull();
    }

    @Test
    void resubmittingOverwritesTheSameSubmission() {
        String subject = "test-" + UUID.randomUUID();
        Target target = anySubLesson();
        long assignmentId = insertAssignment(target.subLessonId(), 1, "now() - interval '5 days'");
        subscribe(subject, target.courseId(), "active");

        repository.upsertSubmission(assignmentId, subject, "first answer");
        repository.upsertSubmission(assignmentId, subject, "second answer");

        var mine = repository.findMyAssignmentById(assignmentId, subject).orElseThrow();
        assertThat(mine.answer()).isEqualTo("second answer");
        assertThat(mine.submittedAt()).isNotNull();
        Integer rows = jdbc.sql("""
                SELECT count(*) FROM courseflow.assignment_submissions
                WHERE assignment_id = :id AND student_subject = :subject
                """)
            .param("id", assignmentId).param("subject", subject)
            .query(Integer.class).single();
        assertThat(rows).isEqualTo(1);
    }
}
