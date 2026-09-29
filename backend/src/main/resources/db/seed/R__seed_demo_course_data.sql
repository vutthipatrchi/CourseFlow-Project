-- Demo data for local development only. Loaded via spring.flyway.locations in
-- application-local.properties; never applies to standalone or production.
-- Curriculum rows come from versioned migrations; this only attaches demo videos
-- to the named Service Design introduction sub-lessons.

UPDATE courseflow.sub_lessons sl
SET
    video_url = seed.video_url,
    updated_at = now()
FROM (
    VALUES
        (1, 'Introduction to Service Design', 'https://example.com/videos/welcome.mp4'),
        (2, 'Course Overview', 'https://example.com/videos/overview.mp4'),
        (3, 'Getting to Know You', 'https://example.com/videos/getting-to-know-you.mp4'),
        (4, 'What is Service Design ?', 'https://example.com/videos/what-is-service-design.mp4')
) AS seed(position, name, video_url)
JOIN courseflow.course_lessons cl ON cl.position = 1
JOIN courseflow.courses c ON c.id = cl.course_id AND c.name = 'Service Design Essentials'
WHERE sl.lesson_id = cl.id
  AND sl.position = seed.position
  AND sl.name = seed.name;
