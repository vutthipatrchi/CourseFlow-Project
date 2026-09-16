-- Demo data for local development only. Loaded via spring.flyway.locations in application-local.properties; never applies to standalone or production.

INSERT INTO courseflow.courses (name)
VALUES ('Introduction to Web Development')
ON CONFLICT (name) DO NOTHING;

INSERT INTO courseflow.lessons (course_id, name, position)
SELECT c.id, 'HTML Basics', 1
FROM courseflow.courses c
WHERE c.name = 'Introduction to Web Development'
ON CONFLICT (course_id, position) DO NOTHING;

INSERT INTO courseflow.lessons (course_id, name, position)
SELECT c.id, 'CSS Fundamentals', 2
FROM courseflow.courses c
WHERE c.name = 'Introduction to Web Development'
ON CONFLICT (course_id, position) DO NOTHING;

INSERT INTO courseflow.sub_lessons (lesson_id, name, position)
SELECT l.id, 'Structuring a Page', 1
FROM courseflow.lessons l
JOIN courseflow.courses c ON c.id = l.course_id
WHERE c.name = 'Introduction to Web Development' AND l.name = 'HTML Basics'
ON CONFLICT (lesson_id, position) DO NOTHING;

INSERT INTO courseflow.sub_lessons (lesson_id, name, position)
SELECT l.id, 'Forms and Inputs', 2
FROM courseflow.lessons l
JOIN courseflow.courses c ON c.id = l.course_id
WHERE c.name = 'Introduction to Web Development' AND l.name = 'HTML Basics'
ON CONFLICT (lesson_id, position) DO NOTHING;

INSERT INTO courseflow.sub_lessons (lesson_id, name, position)
SELECT l.id, 'Box Model and Layout', 1
FROM courseflow.lessons l
JOIN courseflow.courses c ON c.id = l.course_id
WHERE c.name = 'Introduction to Web Development' AND l.name = 'CSS Fundamentals'
ON CONFLICT (lesson_id, position) DO NOTHING;
