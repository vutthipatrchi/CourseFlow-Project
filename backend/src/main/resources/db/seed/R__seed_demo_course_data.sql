-- Demo data for local development only. Loaded via spring.flyway.locations in
-- application-local.properties; never applies to standalone or production.
-- Courses and lessons come from V3__create_course_tables.sql; this adds as many
-- sub-lessons as each lesson's sub_lessons count.

INSERT INTO courseflow.sub_lessons (lesson_id, name, position)
SELECT l.id, 'Sub-lesson ' || s.position, s.position
FROM courseflow.course_lessons l
CROSS JOIN LATERAL generate_series(1, l.sub_lessons) AS s(position)
ON CONFLICT (lesson_id, position) DO NOTHING;

-- Named demo sub-lessons for the first lesson of Service Design Essentials.
UPDATE courseflow.sub_lessons sl
SET
    name = seed.name,
    video_url = seed.video_url,
    updated_at = now()
FROM (
    VALUES
        (1, 'Welcome to the Course', 'https://example.com/videos/welcome.mp4'),
        (2, 'Course Overview', 'https://example.com/videos/overview.mp4'),
        (3, 'Getting to Know You', 'https://example.com/videos/getting-to-know-you.mp4'),
        (4, 'What is Service Design ?', 'https://example.com/videos/what-is-service-design.mp4')
) AS seed(position, name, video_url)
JOIN courseflow.course_lessons cl ON cl.id = sl.lesson_id AND sl.position = seed.position
JOIN courseflow.courses c ON c.id = cl.course_id
WHERE c.name = 'Service Design Essentials'
  AND cl.position = 1;
