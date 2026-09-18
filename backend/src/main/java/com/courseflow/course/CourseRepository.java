package com.courseflow.course;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

@Repository
@Profile("!standalone")
public class CourseRepository {
    private static final String COURSE_SELECT = """
        SELECT c.id, c.name, c.price, c.learning_time, c.category, c.has_promo,
               c.promo_code, c.minimum_purchase, c.discount, c.discount_type,
               c.summary, c.description, c.image_name, c.video_name, c.resource_name,
               c.accent, c.created_at, c.updated_at,
               (SELECT COUNT(*) FROM courseflow.course_lessons l WHERE l.course_id = c.id) AS lessons
        FROM courseflow.courses c
        """;

    private final NamedParameterJdbcTemplate jdbc;
    private final RowMapper<CourseRow> courseRowMapper = this::mapCourseRow;

    public CourseRepository(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Course> findAll() {
        return jdbc.query(COURSE_SELECT + " ORDER BY c.created_at DESC, c.id DESC", Map.of(), courseRowMapper)
            .stream()
            .map(this::loadCourse)
            .toList();
    }

    public Optional<Course> findById(long id) {
        return jdbc.query(COURSE_SELECT + " WHERE c.id = :id", Map.of("id", id), courseRowMapper)
            .stream()
            .findFirst()
            .map(this::loadCourse);
    }

    @Transactional
    public Course create(CourseRequest request) {
        var keyHolder = new GeneratedKeyHolder();
        jdbc.update("""
            INSERT INTO courseflow.courses (
                name, price, learning_time, category, has_promo, promo_code,
                minimum_purchase, discount, discount_type, summary, description,
                image_name, video_name, resource_name, accent
            ) VALUES (
                :name, :price, :learningTime, :category, :hasPromo, :promoCode,
                :minimumPurchase, :discount, :discountType, :summary, :description,
                :imageName, :videoName, :resourceName, :accent
            )
            """, parameters(request), keyHolder, new String[] {"id"});

        var id = keyHolder.getKey().longValue();
        replaceLessons(id, request.lessonItems());
        return findById(id).orElseThrow(() -> new CourseNotFoundException(id));
    }

    @Transactional
    public Course update(long id, CourseRequest request) {
        var params = parameters(request);
        params.addValue("id", id);
        var updated = jdbc.update("""
            UPDATE courseflow.courses
               SET name = :name,
                   price = :price,
                   learning_time = :learningTime,
                   category = :category,
                   has_promo = :hasPromo,
                   promo_code = :promoCode,
                   minimum_purchase = :minimumPurchase,
                   discount = :discount,
                   discount_type = :discountType,
                   summary = :summary,
                   description = :description,
                   image_name = :imageName,
                   video_name = :videoName,
                   resource_name = :resourceName,
                   accent = :accent,
                   updated_at = CURRENT_TIMESTAMP
             WHERE id = :id
            """, params);
        if (updated == 0) throw new CourseNotFoundException(id);

        replaceLessons(id, request.lessonItems());
        return findById(id).orElseThrow(() -> new CourseNotFoundException(id));
    }

    @Transactional
    public void delete(long id) {
        if (jdbc.update("DELETE FROM courseflow.courses WHERE id = :id", Map.of("id", id)) == 0) {
            throw new CourseNotFoundException(id);
        }
    }

    private void replaceLessons(long courseId, List<CourseRequest.LessonRequest> lessons) {
        jdbc.update("DELETE FROM courseflow.course_lessons WHERE course_id = :courseId", Map.of("courseId", courseId));
        if (lessons == null) return;

        for (int index = 0; index < lessons.size(); index++) {
            var lesson = lessons.get(index);
            jdbc.update("""
                INSERT INTO courseflow.course_lessons (course_id, name, position, sub_lessons)
                VALUES (:courseId, :name, :position, :subLessons)
                """, Map.of(
                    "courseId", courseId,
                    "name", lesson.name(),
                    "position", index + 1,
                    "subLessons", lesson.subLessons()
                ));
        }
    }

    private Course loadCourse(CourseRow row) {
        var lessons = jdbc.query("""
            SELECT id, name, sub_lessons
              FROM courseflow.course_lessons
             WHERE course_id = :courseId
             ORDER BY position
            """, Map.of("courseId", row.id()), (resultSet, rowNumber) -> new CourseLesson(
                resultSet.getLong("id"),
                resultSet.getString("name"),
                resultSet.getInt("sub_lessons")
            ));

        return new Course(
            row.id(), row.name(), row.lessons(), row.price(), row.createdAt(), row.updatedAt(),
            row.accent(), row.category(), row.learningTime(), row.hasPromo(), row.promoCode(),
            row.minimumPurchase(), row.discount(), row.discountType(), row.summary(), row.description(),
            row.imageName(), row.videoName(), row.resourceName(), lessons
        );
    }

    private CourseRow mapCourseRow(ResultSet resultSet, int rowNumber) throws SQLException {
        return new CourseRow(
            resultSet.getLong("id"),
            resultSet.getString("name"),
            resultSet.getInt("lessons"),
            resultSet.getBigDecimal("price"),
            resultSet.getObject("created_at", OffsetDateTime.class),
            resultSet.getObject("updated_at", OffsetDateTime.class),
            resultSet.getString("accent"),
            resultSet.getString("category"),
            resultSet.getObject("learning_time", Integer.class),
            resultSet.getBoolean("has_promo"),
            resultSet.getString("promo_code"),
            resultSet.getBigDecimal("minimum_purchase"),
            resultSet.getBigDecimal("discount"),
            resultSet.getString("discount_type"),
            resultSet.getString("summary"),
            resultSet.getString("description"),
            resultSet.getString("image_name"),
            resultSet.getString("video_name"),
            resultSet.getString("resource_name")
        );
    }

    private MapSqlParameterSource parameters(CourseRequest request) {
        return new MapSqlParameterSource()
            .addValue("name", request.name().trim())
            .addValue("price", request.price())
            .addValue("learningTime", request.learningTime())
            .addValue("category", blankToNull(request.category()))
            .addValue("hasPromo", request.hasPromo())
            .addValue("promoCode", request.hasPromo() ? blankToNull(request.promoCode()) : null)
            .addValue("minimumPurchase", request.hasPromo() ? request.minimumPurchase() : null)
            .addValue("discount", request.hasPromo() ? request.discount() : null)
            .addValue("discountType", request.hasPromo() ? request.discountType() : null)
            .addValue("summary", blankToNull(request.summary()))
            .addValue("description", blankToNull(request.description()))
            .addValue("imageName", blankToNull(request.imageName()))
            .addValue("videoName", blankToNull(request.videoName()))
            .addValue("resourceName", blankToNull(request.resourceName()))
            .addValue("accent", request.accent() == null || request.accent().isBlank() ? "#dce8fb" : request.accent());
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record CourseRow(
        long id,
        String name,
        int lessons,
        BigDecimal price,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt,
        String accent,
        String category,
        Integer learningTime,
        boolean hasPromo,
        String promoCode,
        BigDecimal minimumPurchase,
        BigDecimal discount,
        String discountType,
        String summary,
        String description,
        String imageName,
        String videoName,
        String resourceName
    ) {
    }
}
