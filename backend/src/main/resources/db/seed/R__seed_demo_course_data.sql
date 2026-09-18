-- Demo data for local development only. Loaded via spring.flyway.locations in application-local.properties; never applies to standalone or production.
-- Courses and lessons come from V3__create_course_tables.sql; this adds as many sub-lessons as each lesson's sub_lessons count.

INSERT INTO courseflow.sub_lessons (lesson_id, name, position)
SELECT l.id, 'Sub-lesson ' || s.position, s.position
FROM courseflow.course_lessons l
CROSS JOIN LATERAL generate_series(1, l.sub_lessons) AS s(position)
ON CONFLICT (lesson_id, position) DO NOTHING;
