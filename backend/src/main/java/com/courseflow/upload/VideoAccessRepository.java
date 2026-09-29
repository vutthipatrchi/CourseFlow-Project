package com.courseflow.upload;

import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!standalone")
public class VideoAccessRepository {
    private final JdbcTemplate jdbc;

    public VideoAccessRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public boolean hasActiveSubscription(String subject, String filename) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
            SELECT EXISTS (
                SELECT 1
                  FROM courseflow.sub_lessons sl
                  JOIN courseflow.course_lessons l ON l.id = sl.lesson_id
                  JOIN courseflow.subscriptions s ON s.course_id = l.course_id
                  JOIN courseflow.orders o ON o.id = s.order_id
                 WHERE sl.video_url = ?
                   AND o.customer_subject = ?
                   AND s.status = 'active'
            )
            """, Boolean.class, "/api/uploads/videos/" + filename, subject));
    }
}
