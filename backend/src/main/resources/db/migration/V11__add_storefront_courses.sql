-- Match the courses shown in the public course browser to checkout products.
INSERT INTO courseflow.courses (name, price, accent, category, summary)
SELECT seed.name, seed.price, seed.accent, 'Course', seed.summary
FROM (VALUES
    ('Software Developer', 3559.00, '#dce8fb',
     'Build a solid foundation in programming and modern software development.'),
    ('UX/UI Design Beginner', 3559.00, '#fce4cf',
     'Get started designing intuitive, user-friendly digital products from scratch.')
) AS seed(name, price, accent, summary)
WHERE NOT EXISTS (SELECT 1 FROM courseflow.courses c WHERE c.name = seed.name);

INSERT INTO courseflow.course_lessons (course_id, name, position, sub_lessons)
SELECT c.id, seed.lesson_name, seed.position, 1
FROM (VALUES
    ('Software Developer', 1, 'Introduction to Programming'),
    ('Software Developer', 2, 'Development Tools'),
    ('Software Developer', 3, 'Variables and Data Types'),
    ('Software Developer', 4, 'Control Flow'),
    ('Software Developer', 5, 'Functions and Modules'),
    ('Software Developer', 6, 'Build a Project'),
    ('UX/UI Design Beginner', 1, 'Design Foundations'),
    ('UX/UI Design Beginner', 2, 'User Research'),
    ('UX/UI Design Beginner', 3, 'Wireframing'),
    ('UX/UI Design Beginner', 4, 'Visual Design'),
    ('UX/UI Design Beginner', 5, 'Interactive Prototypes'),
    ('UX/UI Design Beginner', 6, 'Usability Testing')
) AS seed(course_name, position, lesson_name)
JOIN courseflow.courses c ON c.name = seed.course_name
WHERE NOT EXISTS (
    SELECT 1 FROM courseflow.course_lessons l
    WHERE l.course_id = c.id AND l.position = seed.position
);

INSERT INTO courseflow.sub_lessons (lesson_id, name, position)
SELECT l.id, l.name, 1
FROM courseflow.course_lessons l
JOIN courseflow.courses c ON c.id = l.course_id
WHERE c.name IN ('Software Developer', 'UX/UI Design Beginner')
ON CONFLICT (lesson_id, position) DO NOTHING;
