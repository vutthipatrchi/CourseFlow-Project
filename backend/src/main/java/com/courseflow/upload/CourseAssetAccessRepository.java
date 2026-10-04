package com.courseflow.upload;

import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@Profile("!standalone")
public class CourseAssetAccessRepository {
    private final JdbcTemplate jdbc;
    public CourseAssetAccessRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public boolean canDownloadResource(String subject, String filename) {
        return Boolean.TRUE.equals(jdbc.queryForObject("""
            SELECT EXISTS (
                SELECT 1 FROM courseflow.courses c
                JOIN courseflow.subscriptions s ON s.course_id = c.id
                JOIN courseflow.orders o ON o.id = s.order_id
                WHERE c.resource_name = ? AND o.customer_subject = ? AND s.status = 'active'
            )
            """, Boolean.class, "/api/uploads/course-resources/" + filename, subject));
    }
}
