-- Group existing demo readings so each course lesson has multiple sub-lessons.
-- Rebuilds course_lessons / sub_lessons to match; progress rows cascade-delete.

CREATE TEMP TABLE lesson_regroup (
    course_title TEXT NOT NULL,
    lesson_name TEXT NOT NULL,
    lesson_order INT NOT NULL,
    sub_lesson_name TEXT NOT NULL,
    sub_lesson_order INT NOT NULL,
    reading_title TEXT NOT NULL
);

INSERT INTO lesson_regroup (
    course_title, lesson_name, lesson_order, sub_lesson_name, sub_lesson_order, reading_title
) VALUES
-- Service Design Essentials (9 → 3 lessons)
('Service Design Essentials', 'Introduction to Service Design', 1, 'Introduction to Service Design', 1, 'Introduction to Service Design'),
('Service Design Essentials', 'Introduction to Service Design', 1, 'Course Overview', 2, 'Course Overview'),
('Service Design Essentials', 'Introduction to Service Design', 1, 'Getting to Know You', 3, 'Getting to Know You'),
('Service Design Essentials', 'Introduction to Service Design', 1, 'What is Service Design ?', 4, 'What is Service Design ?'),
('Service Design Essentials', 'Research and Framing', 2, 'Service Design Principles', 1, 'Service Design Principles'),
('Service Design Essentials', 'Research and Framing', 2, 'User Research and Journey Mapping', 2, 'User Research and Journey Mapping'),
('Service Design Essentials', 'Research and Framing', 2, 'Framing and Prioritizing Opportunities', 3, 'Framing and Prioritizing Opportunities'),
('Service Design Essentials', 'Prototyping and Improvement', 3, 'Service Prototyping', 1, 'Service Prototyping'),
('Service Design Essentials', 'Prototyping and Improvement', 3, 'Service Blueprint and Improvement', 2, 'Service Blueprint and Improvement'),

-- Design Thinking Fundamentals (8 → 4 lessons)
('Design Thinking Fundamentals', 'Discover', 1, 'Understanding Design Thinking', 1, 'Understanding Design Thinking'),
('Design Thinking Fundamentals', 'Discover', 1, 'Empathy and Observation', 2, 'Empathy and Observation'),
('Design Thinking Fundamentals', 'Define and Ideate', 2, 'Defining the Problem', 1, 'Defining the Problem'),
('Design Thinking Fundamentals', 'Define and Ideate', 2, 'Generating Ideas', 2, 'Generating Ideas'),
('Design Thinking Fundamentals', 'Prototype', 3, 'Choosing Experiments', 1, 'Choosing Experiments'),
('Design Thinking Fundamentals', 'Prototype', 3, 'Building Low-Cost Prototypes', 2, 'Building Low-Cost Prototypes'),
('Design Thinking Fundamentals', 'Test and Share', 4, 'Testing and Iteration', 1, 'Testing and Iteration'),
('Design Thinking Fundamentals', 'Test and Share', 4, 'Presenting a Design Story', 2, 'Presenting a Design Story'),

-- UX Research Methods (7 → 3 lessons)
('UX Research Methods', 'Plan the Study', 1, 'Research Questions and Planning', 1, 'Research Questions and Planning'),
('UX Research Methods', 'Plan the Study', 1, 'Recruiting Participants', 2, 'Recruiting Participants'),
('UX Research Methods', 'Collect Evidence', 2, 'Interview Techniques', 1, 'Interview Techniques'),
('UX Research Methods', 'Collect Evidence', 2, 'Contextual Observation', 2, 'Contextual Observation'),
('UX Research Methods', 'Collect Evidence', 2, 'Survey Design', 3, 'Survey Design'),
('UX Research Methods', 'Synthesize and Report', 3, 'Synthesis and Themes', 1, 'Synthesis and Themes'),
('UX Research Methods', 'Synthesize and Report', 3, 'Research Reporting', 2, 'Research Reporting'),

-- Product Strategy (9 → 3 lessons)
('Product Strategy', 'Foundations', 1, 'Product Vision', 1, 'Product Vision'),
('Product Strategy', 'Foundations', 1, 'Customer Segments', 2, 'Customer Segments'),
('Product Strategy', 'Foundations', 1, 'Problem and Opportunity', 3, 'Problem and Opportunity'),
('Product Strategy', 'Value and Positioning', 2, 'Value Proposition', 1, 'Value Proposition'),
('Product Strategy', 'Value and Positioning', 2, 'Positioning and Alternatives', 2, 'Positioning and Alternatives'),
('Product Strategy', 'Value and Positioning', 2, 'Outcomes and Metrics', 3, 'Outcomes and Metrics'),
('Product Strategy', 'Delivery', 3, 'Prioritization', 1, 'Prioritization'),
('Product Strategy', 'Delivery', 3, 'Roadmaps and Dependencies', 2, 'Roadmaps and Dependencies'),
('Product Strategy', 'Delivery', 3, 'Strategy Review', 3, 'Strategy Review'),

-- Digital Marketing Basics (6 → 3 lessons)
('Digital Marketing Basics', 'Audience and Journey', 1, 'Audience and Marketing Goals', 1, 'Audience and Marketing Goals'),
('Digital Marketing Basics', 'Audience and Journey', 1, 'Customer Journey and Channels', 2, 'Customer Journey and Channels'),
('Digital Marketing Basics', 'Content and Search', 2, 'Content Planning', 1, 'Content Planning'),
('Digital Marketing Basics', 'Content and Search', 2, 'Search Intent and Useful Pages', 2, 'Search Intent and Useful Pages'),
('Digital Marketing Basics', 'Measure and Improve', 3, 'Campaign Measurement', 1, 'Campaign Measurement'),
('Digital Marketing Basics', 'Measure and Improve', 3, 'Experiment and Improve', 2, 'Experiment and Improve'),

-- Data Analytics Foundations (10 → 3 lessons)
('Data Analytics Foundations', 'Data Basics', 1, 'Questions Before Data', 1, 'Questions Before Data'),
('Data Analytics Foundations', 'Data Basics', 1, 'Tables and Data Types', 2, 'Tables and Data Types'),
('Data Analytics Foundations', 'Data Basics', 1, 'Cleaning Data', 3, 'Cleaning Data'),
('Data Analytics Foundations', 'Analyze', 2, 'Descriptive Statistics', 1, 'Descriptive Statistics'),
('Data Analytics Foundations', 'Analyze', 2, 'Filtering and Aggregation', 2, 'Filtering and Aggregation'),
('Data Analytics Foundations', 'Analyze', 2, 'Joining Tables', 3, 'Joining Tables'),
('Data Analytics Foundations', 'Communicate Insights', 3, 'Exploring Patterns', 1, 'Exploring Patterns'),
('Data Analytics Foundations', 'Communicate Insights', 3, 'Choosing Charts', 2, 'Choosing Charts'),
('Data Analytics Foundations', 'Communicate Insights', 3, 'Correlation and Experiments', 3, 'Correlation and Experiments'),
('Data Analytics Foundations', 'Communicate Insights', 3, 'Communicating Findings', 4, 'Communicating Findings'),

-- Leadership Essentials (5 → 2 lessons)
('Leadership Essentials', 'Working with People', 1, 'Shared Goals and Expectations', 1, 'Shared Goals and Expectations'),
('Leadership Essentials', 'Working with People', 1, 'Listening and Clear Communication', 2, 'Listening and Clear Communication'),
('Leadership Essentials', 'Working with People', 1, 'Feedback and Coaching', 3, 'Feedback and Coaching'),
('Leadership Essentials', 'Ownership and Conflict', 2, 'Delegation and Ownership', 1, 'Delegation and Ownership'),
('Leadership Essentials', 'Ownership and Conflict', 2, 'Conflict and Team Reflection', 2, 'Conflict and Team Reflection'),

-- Agile Project Management (8 → 3 lessons)
('Agile Project Management', 'Plan the Work', 1, 'Iterative Delivery', 1, 'Iterative Delivery'),
('Agile Project Management', 'Plan the Work', 1, 'Backlog and User Stories', 2, 'Backlog and User Stories'),
('Agile Project Management', 'Plan the Work', 1, 'Priorities and Dependencies', 3, 'Priorities and Dependencies'),
('Agile Project Management', 'Run the Cycle', 2, 'Estimation and Capacity', 1, 'Estimation and Capacity'),
('Agile Project Management', 'Run the Cycle', 2, 'Planning a Work Cycle', 2, 'Planning a Work Cycle'),
('Agile Project Management', 'Run the Cycle', 2, 'Visualizing Work and Blockers', 3, 'Visualizing Work and Blockers'),
('Agile Project Management', 'Review and Release', 3, 'Review and Retrospective', 1, 'Review and Retrospective'),
('Agile Project Management', 'Review and Release', 3, 'Quality and Release Readiness', 2, 'Quality and Release Readiness'),

-- Software Developer (6 → 2 lessons)
('Software Developer', 'Programming Fundamentals', 1, 'Introduction to Programming', 1, 'Introduction to Programming'),
('Software Developer', 'Programming Fundamentals', 1, 'Development Tools', 2, 'Development Tools'),
('Software Developer', 'Programming Fundamentals', 1, 'Variables and Data Types', 3, 'Variables and Data Types'),
('Software Developer', 'Build with Code', 2, 'Control Flow', 1, 'Control Flow'),
('Software Developer', 'Build with Code', 2, 'Functions and Modules', 2, 'Functions and Modules'),
('Software Developer', 'Build with Code', 2, 'Build a Project', 3, 'Build a Project'),

-- UX/UI Design Beginner (6 → 2 lessons)
('UX/UI Design Beginner', 'Design Foundations', 1, 'Design Foundations', 1, 'Design Foundations'),
('UX/UI Design Beginner', 'Design Foundations', 1, 'User Research', 2, 'User Research'),
('UX/UI Design Beginner', 'Design Foundations', 1, 'Wireframing', 3, 'Wireframing'),
('UX/UI Design Beginner', 'Prototype and Test', 2, 'Visual Design', 1, 'Visual Design'),
('UX/UI Design Beginner', 'Prototype and Test', 2, 'Interactive Prototypes', 2, 'Interactive Prototypes'),
('UX/UI Design Beginner', 'Prototype and Test', 2, 'Usability Testing', 3, 'Usability Testing');

-- Avoid PK collisions while renaming demo rows.
UPDATE courseflow.demo_lesson_content
SET lesson_name = lesson_name || E'\u0001',
    sub_lesson_name = sub_lesson_name || E'\u0001';

UPDATE courseflow.demo_lesson_content AS demo
SET lesson_name = regroup.lesson_name,
    sub_lesson_name = regroup.sub_lesson_name,
    lesson_order = regroup.lesson_order,
    sub_lesson_order = regroup.sub_lesson_order
FROM lesson_regroup AS regroup
WHERE demo.course_title = regroup.course_title
  AND demo.title = regroup.reading_title;

-- Rebuild curriculum rows for regrouped courses (cascades sub_lessons, assignments, progress).
DELETE FROM courseflow.course_lessons AS lesson
USING courseflow.courses AS course
WHERE lesson.course_id = course.id
  AND course.name IN (SELECT DISTINCT course_title FROM lesson_regroup);

INSERT INTO courseflow.course_lessons (course_id, name, position, sub_lessons)
SELECT course.id, regroup.lesson_name, regroup.lesson_order, COUNT(*)::INT
FROM lesson_regroup AS regroup
JOIN courseflow.courses AS course ON course.name = regroup.course_title
GROUP BY course.id, regroup.lesson_name, regroup.lesson_order
ORDER BY course.id, regroup.lesson_order;

INSERT INTO courseflow.sub_lessons (lesson_id, name, position)
SELECT lesson.id, regroup.sub_lesson_name, regroup.sub_lesson_order
FROM lesson_regroup AS regroup
JOIN courseflow.courses AS course ON course.name = regroup.course_title
JOIN courseflow.course_lessons AS lesson
  ON lesson.course_id = course.id
 AND lesson.position = regroup.lesson_order
ORDER BY course.id, regroup.lesson_order, regroup.sub_lesson_order;

DROP TABLE lesson_regroup;
