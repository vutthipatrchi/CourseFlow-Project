package com.courseflow.wishlist;

import com.courseflow.common.web.ResourceNotFoundException;
import java.util.List;
import java.util.Map;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!standalone")
public class WishlistRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public WishlistRepository(NamedParameterJdbcTemplate jdbc) { this.jdbc = jdbc; }

    // กรองด้วยเจ้าของทุกครั้ง และ JOIN คอร์สเพื่อแสดงชื่อ/ราคา/รายละเอียดล่าสุด
    public List<WishlistCourse> findAll(String subject) {
        return jdbc.query("""
            SELECT c.id, c.name, c.price, c.category, c.summary, c.description,
                   c.learning_time, c.image_name, c.accent,
                   (SELECT COUNT(*) FROM courseflow.course_lessons l WHERE l.course_id = c.id) AS lessons
              FROM courseflow.wishlist_items w
              JOIN courseflow.courses c ON c.id = w.course_id
             WHERE w.customer_subject = :subject
             ORDER BY w.created_at DESC, w.course_id DESC
            """, Map.of("subject", subject), (rs, row) -> new WishlistCourse(
                rs.getLong("id"), rs.getString("name"), rs.getBigDecimal("price"),
                rs.getString("category"), rs.getString("summary"), rs.getString("description"),
                rs.getObject("learning_time", Integer.class), rs.getInt("lessons"),
                rs.getString("image_name"), rs.getString("accent")));
    }

    public void add(String subject, long courseId) {
        if (courseId <= 0) throw new IllegalArgumentException("Course ID must be positive");
        var params = Map.of("subject", (Object) subject, "courseId", courseId);
        // INSERT เฉพาะคอร์สที่มีอยู่; primary key (customer_subject, course_id) กันรายการซ้ำ
        // ON CONFLICT ทำให้การส่ง PUT ซ้ำปลอดภัยและไม่เปลี่ยนวันที่บันทึกเดิม
        int inserted = jdbc.update("""
            INSERT INTO courseflow.wishlist_items (customer_subject, course_id)
            SELECT :subject, id FROM courseflow.courses WHERE id = :courseId
            ON CONFLICT (customer_subject, course_id) DO NOTHING
            """, params);
        // 0 แถวอาจหมายถึงบันทึกไว้แล้วหรือไม่มีคอร์ส ต้องแยกสองกรณีนี้ก่อนคืน 404
        if (inserted == 0 && !Boolean.TRUE.equals(jdbc.queryForObject(
            "SELECT EXISTS (SELECT 1 FROM courseflow.courses WHERE id = :courseId)", params, Boolean.class))) {
            throw new ResourceNotFoundException("Course not found");
        }
    }

    // ลบได้เฉพาะรายการของผู้เรียก; ลบซ้ำหรือยังไม่เคยบันทึกถือว่าสำเร็จเหมือนกัน
    public void remove(String subject, long courseId) {
        jdbc.update("""
            DELETE FROM courseflow.wishlist_items
             WHERE customer_subject = :subject AND course_id = :courseId
            """, Map.of("subject", subject, "courseId", courseId));
    }
}
