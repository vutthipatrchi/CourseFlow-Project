-- Align older demo rows with the Software Developer / UX-UI naming style:
-- lesson_name and sub_lesson_name use the readable title instead of "Lesson N"
-- / "Sub-lesson 1". Also rename matching course_lessons and sub_lessons so the
-- enrolled player can still match readings by name.

UPDATE courseflow.demo_lesson_content
SET lesson_name = title,
    sub_lesson_name = title
WHERE lesson_name LIKE 'Lesson %'
   OR sub_lesson_name LIKE 'Sub-lesson %'
   OR sub_lesson_name IN (
        'Welcome to the Course',
        'Course Overview',
        'Getting to Know You',
        'What is Service Design ?'
      );

UPDATE courseflow.course_lessons AS lesson
SET name = demo.title
FROM courseflow.courses AS course
JOIN courseflow.demo_lesson_content AS demo
  ON demo.course_title = course.name
WHERE lesson.course_id = course.id
  AND demo.lesson_order = lesson.position
  AND demo.sub_lesson_order = 1
  AND lesson.name LIKE 'Lesson %';

UPDATE courseflow.sub_lessons AS sub
SET name = demo.title
FROM courseflow.course_lessons AS lesson
JOIN courseflow.courses AS course ON course.id = lesson.course_id
JOIN courseflow.demo_lesson_content AS demo
  ON demo.course_title = course.name
 AND demo.lesson_order = lesson.position
WHERE sub.lesson_id = lesson.id
  AND demo.sub_lesson_order = sub.position
  AND (
    sub.name LIKE 'Sub-lesson %'
    OR sub.name IN (
      'Welcome to the Course',
      'Course Overview',
      'Getting to Know You',
      'What is Service Design ?'
    )
  );
