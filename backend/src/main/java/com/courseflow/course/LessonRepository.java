package com.courseflow.course;

import java.util.List;
import java.util.Optional;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!standalone")
public class LessonRepository {

    private final JdbcClient jdbcClient;

    public LessonRepository(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    public boolean courseExists(Long courseId) {
        Boolean exists = jdbcClient
                .sql("SELECT EXISTS(SELECT 1 FROM courseflow.courses WHERE id = :id)")
                .param("id", courseId)
                .query(Boolean.class)
                .single();
        return Boolean.TRUE.equals(exists);
    }

    public Optional<Long> findCourseId(Long lessonId) {
        return jdbcClient
                .sql("SELECT course_id FROM courseflow.course_lessons WHERE id = :id")
                .param("id", lessonId)
                .query(Long.class)
                .optional();
    }

    public List<LessonSummaryResponse> findSummariesByCourseId(Long courseId) {
        return jdbcClient
                .sql("""
                    SELECT cl.id, cl.name, cl.position,
                           COUNT(sl.id)::int AS sub_lesson_count
                    FROM courseflow.course_lessons cl
                    LEFT JOIN courseflow.sub_lessons sl ON sl.lesson_id = cl.id
                    WHERE cl.course_id = :courseId
                    GROUP BY cl.id, cl.name, cl.position
                    ORDER BY cl.position
                    """)
                .param("courseId", courseId)
                .query((rs, rowNum) -> new LessonSummaryResponse(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getInt("position"),
                        rs.getInt("sub_lesson_count")))
                .list();
    }

    public int nextLessonPosition(Long courseId) {
        Integer max = jdbcClient
                .sql("""
                    SELECT COALESCE(MAX(position), 0)
                    FROM courseflow.course_lessons
                    WHERE course_id = :courseId
                    """)
                .param("courseId", courseId)
                .query(Integer.class)
                .single();
        return max + 1;
    }

    public Long insertLesson(Long courseId, String name, int position) {
        return jdbcClient
                .sql("""
                    INSERT INTO courseflow.course_lessons (course_id, name, position, sub_lessons)
                    VALUES (:courseId, :name, :position, 0)
                    RETURNING id
                    """)
                .param("courseId", courseId)
                .param("name", name)
                .param("position", position)
                .query(Long.class)
                .single();
    }

    public void updateLessonName(Long lessonId, String name) {
        jdbcClient
                .sql("""
                    UPDATE courseflow.course_lessons
                    SET name = :name
                    WHERE id = :id
                    """)
                .param("name", name)
                .param("id", lessonId)
                .update();
    }

    public void deleteLesson(Long lessonId) {
        jdbcClient
                .sql("DELETE FROM courseflow.course_lessons WHERE id = :id")
                .param("id", lessonId)
                .update();
    }

    public Optional<LessonDetailResponse> findDetail(Long lessonId) {
        Optional<LessonRow> lesson = jdbcClient
                .sql("""
                    SELECT id, course_id, name, position
                    FROM courseflow.course_lessons
                    WHERE id = :id
                    """)
                .param("id", lessonId)
                .query((rs, rowNum) -> new LessonRow(
                        rs.getLong("id"),
                        rs.getLong("course_id"),
                        rs.getString("name"),
                        rs.getInt("position")))
                .optional();

        if (lesson.isEmpty()) {
            return Optional.empty();
        }

        List<SubLessonResponse> subLessons = findSubLessons(lessonId);
        LessonRow row = lesson.get();
        return Optional.of(new LessonDetailResponse(
                row.id(), row.courseId(), row.name(), row.position(), subLessons));
    }

    public List<SubLessonResponse> findSubLessons(Long lessonId) {
        return jdbcClient
                .sql("""
                    SELECT id, name, video_url, position
                    FROM courseflow.sub_lessons
                    WHERE lesson_id = :lessonId
                    ORDER BY position
                    """)
                .param("lessonId", lessonId)
                .query((rs, rowNum) -> new SubLessonResponse(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("video_url"),
                        rs.getInt("position")))
                .list();
    }

    public Long insertSubLesson(Long lessonId, String name, String videoUrl, int position) {
        return jdbcClient
                .sql("""
                    INSERT INTO courseflow.sub_lessons (lesson_id, name, video_url, position)
                    VALUES (:lessonId, :name, :videoUrl, :position)
                    RETURNING id
                    """)
                .param("lessonId", lessonId)
                .param("name", name)
                .param("videoUrl", videoUrl)
                .param("position", position)
                .query(Long.class)
                .single();
    }

    public void updateSubLesson(Long id, String name, String videoUrl, int position) {
        jdbcClient
                .sql("""
                    UPDATE courseflow.sub_lessons
                    SET name = :name, video_url = :videoUrl, position = :position, updated_at = now()
                    WHERE id = :id
                    """)
                .param("name", name)
                .param("videoUrl", videoUrl)
                .param("position", position)
                .param("id", id)
                .update();
    }

    public void deleteSubLessonsNotIn(Long lessonId, List<Long> keepIds) {
        if (keepIds == null || keepIds.isEmpty()) {
            jdbcClient
                    .sql("DELETE FROM courseflow.sub_lessons WHERE lesson_id = :lessonId")
                    .param("lessonId", lessonId)
                    .update();
            syncSubLessonCount(lessonId);
            return;
        }
        jdbcClient
                .sql("""
                    DELETE FROM courseflow.sub_lessons
                    WHERE lesson_id = :lessonId
                      AND id NOT IN (:keepIds)
                    """)
                .param("lessonId", lessonId)
                .param("keepIds", keepIds)
                .update();
        syncSubLessonCount(lessonId);
    }

    public void syncSubLessonCount(Long lessonId) {
        jdbcClient
                .sql("""
                    UPDATE courseflow.course_lessons
                    SET sub_lessons = (
                        SELECT COUNT(*)::int FROM courseflow.sub_lessons WHERE lesson_id = :lessonId
                    )
                    WHERE id = :lessonId
                    """)
                .param("lessonId", lessonId)
                .update();
    }

    public boolean subLessonBelongsToLesson(Long subLessonId, Long lessonId) {
        Boolean exists = jdbcClient
                .sql("""
                    SELECT EXISTS(
                      SELECT 1 FROM courseflow.sub_lessons
                      WHERE id = :id AND lesson_id = :lessonId
                    )
                    """)
                .param("id", subLessonId)
                .param("lessonId", lessonId)
                .query(Boolean.class)
                .single();
        return Boolean.TRUE.equals(exists);
    }

    private record LessonRow(Long id, Long courseId, String name, int position) {}
}
