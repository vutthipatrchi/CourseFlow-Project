package com.courseflow.course;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

// Uses the local PostgreSQL test target, never the app's optional .env.properties file.
@SpringBootTest(properties = {
    "spring.config.location=classpath:application-local.properties",
    "spring.flyway.locations=classpath:db/migration",
    "spring.flyway.validate-on-migrate=true",
    "spring.flyway.out-of-order=false"
})
@ActiveProfiles("local")
@EnabledIfSystemProperty(named = "spring.profiles.active", matches = "local")
@Transactional
class LessonOrderingRepositoryTests {
    @Autowired private CourseRepository courses;
    @Autowired private LessonService lessons;
    @Autowired private JdbcTemplate jdbc;
    @MockitoBean private JwtDecoder decoder;

    private Course course;
    private long first;
    private long second;
    private long third;
    private List<SubLessonResponse> subLessons;
    private long assignmentId;
    private UUID subscriptionId;

    @BeforeEach
    void createCourseWithStudentWork() {
        course = courses.create(request(List.of(item(null, "First"), item(null, "Second"), item(null, "Third"))));
        first = course.lessonItems().get(0).id();
        second = course.lessonItems().get(1).id();
        third = course.lessonItems().get(2).id();
        subLessons = lessons.update(second, new UpdateLessonRequest("Second", List.of(
            sub(null, "One"), sub(null, "Two"), sub(null, "Three")))).subLessons();
        long retainedSubLesson = subLessons.get(1).id();
        assignmentId = jdbc.queryForObject("""
            INSERT INTO courseflow.assignments (sub_lesson_id, description)
            VALUES (?, 'Assignment to preserve') RETURNING id
            """, Long.class, retainedSubLesson);
        jdbc.update("""
            INSERT INTO courseflow.assignment_submissions (assignment_id, student_subject, answer)
            VALUES (?, 'ordering-test-student', 'Saved answer')
            """, assignmentId);
        UUID orderId = UUID.randomUUID();
        subscriptionId = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO courseflow.orders
                (id, reference, course_id, course_title, customer_subject, subtotal_satang,
                 total_satang, status, expires_at)
            VALUES (?, ?, ?, 'Ordering test', 'ordering-test-student', 10000, 10000, 'paid', NOW())
            """, orderId, orderId.toString().replace("-", "").substring(0, 24), course.id());
        jdbc.update("""
            INSERT INTO courseflow.subscriptions (id, order_id, course_id, status, activated_at)
            VALUES (?, ?, ?, 'active', NOW())
            """, subscriptionId, orderId, course.id());
        jdbc.update("""
            INSERT INTO courseflow.subscription_lesson_progress (subscription_id, sub_lesson_id)
            VALUES (?, ?)
            """, subscriptionId, retainedSubLesson);
    }

    @Test
    void reordersLessonsWithoutReplacingIdsOrStudentWork() {
        var updated = courses.update(course.id(), request(List.of(
            item(third, "Third"), item(first, "First"), item(second, "Second"))));
        assertThat(updated.lessonItems()).extracting(CourseLesson::id).containsExactly(third, first, second);
        assertLessonPositions(3);
        assertStudentWorkPreserved();
    }

    @Test
    void removesFirstLessonAndInsertsAnotherBeforeRetainedLessons() {
        var updated = courses.update(course.id(), request(List.of(
            item(null, "Inserted"), item(second, "Second"), item(third, "Third"))));
        assertThat(updated.lessonItems()).extracting(CourseLesson::name).containsExactly("Inserted", "Second", "Third");
        assertThat(updated.lessonItems().get(1).id()).isEqualTo(second);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM courseflow.course_lessons WHERE id = ?", Integer.class, first)).isZero();
        assertLessonPositions(3);
        assertStudentWorkPreserved();
    }

    @Test
    void growsTheLessonListBeyondItsPreviousPositionRange() {
        var updated = courses.update(course.id(), request(List.of(
            item(null, "New 1"), item(null, "New 2"), item(null, "New 3"), item(null, "New 4"),
            item(third, "Third"), item(second, "Second"), item(first, "First"))));
        assertThat(updated.lessonItems()).hasSize(7);
        assertLessonPositions(7);
        assertStudentWorkPreserved();
    }

    @Test
    void reordersSubLessonsWithoutLosingAnswersOrProgress() {
        var updated = lessons.update(second, new UpdateLessonRequest("Second", List.of(
            existingSub(2), existingSub(0), existingSub(1))));
        assertThat(updated.subLessons()).extracting(SubLessonResponse::id)
            .containsExactly(subLessons.get(2).id(), subLessons.get(0).id(), subLessons.get(1).id());
        assertThat(updated.subLessons()).extracting(SubLessonResponse::position).containsExactly(1, 2, 3);
        assertStudentWorkPreserved();
    }

    @Test
    void removesFirstSubLessonAndInsertsAnotherAtItsPosition() {
        var updated = lessons.update(second, new UpdateLessonRequest("Second", List.of(
            sub(null, "Inserted"), existingSub(2), existingSub(1))));
        assertThat(updated.subLessons()).extracting(SubLessonResponse::name).containsExactly("Inserted", "Three", "Two");
        assertThat(updated.subLessons()).extracting(SubLessonResponse::position).containsExactly(1, 2, 3);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM courseflow.sub_lessons WHERE id = ?",
            Integer.class, subLessons.get(0).id())).isZero();
        assertStudentWorkPreserved();
    }

    @Test
    void growsSubLessonsBeyondTheirPreviousPositionRange() {
        var updated = lessons.update(second, new UpdateLessonRequest("Second", List.of(
            sub(null, "New 1"), sub(null, "New 2"), sub(null, "New 3"), sub(null, "New 4"),
            existingSub(2), existingSub(1), existingSub(0))));
        assertThat(updated.subLessons()).extracting(SubLessonResponse::position).containsExactly(1, 2, 3, 4, 5, 6, 7);
        assertThat(courses.findById(course.id()).orElseThrow().lessonItems().get(1).subLessons()).isEqualTo(7);
        assertStudentWorkPreserved();
    }

    @Test
    void rejectsRepeatedLessonIdsInsteadOfSavingAnIncompleteOrder() {
        assertThatThrownBy(() -> courses.update(course.id(), request(List.of(item(second, "Second"), item(second, "Duplicate")))))
            .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("must not be repeated");
    }

    @Test
    void rejectsRepeatedSubLessonIdsInsteadOfSavingAnIncompleteOrder() {
        assertThatThrownBy(() -> lessons.update(second, new UpdateLessonRequest("Second", List.of(existingSub(1), existingSub(1)))))
            .isInstanceOf(IllegalArgumentException.class).hasMessageContaining("must not be repeated");
    }

    private void assertLessonPositions(int count) {
        assertThat(jdbc.queryForList("SELECT position FROM courseflow.course_lessons WHERE course_id = ? ORDER BY position",
            Integer.class, course.id())).containsExactlyElementsOf(java.util.stream.IntStream.rangeClosed(1, count).boxed().toList());
    }

    private void assertStudentWorkPreserved() {
        assertThat(jdbc.queryForObject("SELECT sub_lesson_id FROM courseflow.assignments WHERE id = ?", Long.class, assignmentId))
            .isEqualTo(subLessons.get(1).id());
        assertThat(jdbc.queryForObject("SELECT answer FROM courseflow.assignment_submissions WHERE assignment_id = ?",
            String.class, assignmentId)).isEqualTo("Saved answer");
        assertThat(jdbc.queryForObject("SELECT sub_lesson_id FROM courseflow.subscription_lesson_progress WHERE subscription_id = ?",
            Long.class, subscriptionId)).isEqualTo(subLessons.get(1).id());
        assertThat(jdbc.queryForObject("SELECT video_url FROM courseflow.sub_lessons WHERE id = ?",
            String.class, subLessons.get(1).id())).isEqualTo("https://example.test/Two.mp4");
    }

    private SubLessonWriteRequest existingSub(int index) {
        var row = subLessons.get(index);
        return new SubLessonWriteRequest(row.id(), row.name(), row.videoUrl());
    }

    private static SubLessonWriteRequest sub(Long id, String name) {
        return new SubLessonWriteRequest(id, name, "https://example.test/" + name + ".mp4");
    }

    private static CourseRequest.LessonRequest item(Long id, String name) {
        return new CourseRequest.LessonRequest(id, name, 0);
    }

    private static CourseRequest request(List<CourseRequest.LessonRequest> items) {
        return new CourseRequest("Ordering test", BigDecimal.valueOf(100), 1, null, false,
            null, null, null, null, null, null, null, null, null, "#dce8fb", items);
    }
}
