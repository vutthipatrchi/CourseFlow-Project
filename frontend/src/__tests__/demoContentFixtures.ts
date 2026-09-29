import type { DemoContentRow } from '@/api/demoContent'

function row(
  lessonName: string,
  subLessonName: string,
  title: string,
  detail = title,
): DemoContentRow {
  return {
    lessonName,
    subLessonName,
    title,
    reading: {
      title,
      objective: `Learn ${title}`,
      paragraphs: [`${detail}: input, process, output.`, 'Try 60, 75 and 90. Use the Terminal.'],
      example: `Example for ${title}`,
      exercise: `Practice ${title}`,
      solution: `Suggested answer for ${title}`,
    },
  }
}

export function demoContentFixtures(courseTitle: string): DemoContentRow[] {
  switch (courseTitle) {
    case 'Software Developer':
      return [
        row(
          'Introduction to Programming',
          'Introduction to Programming',
          'Introduction to Programming',
        ),
        row('Development Tools', 'Development Tools', 'Development Tools'),
      ]
    case 'UX/UI Design Beginner':
      return [row('Design Foundations', 'Design Foundations', 'Design Foundations')]
    case 'Service Design Essentials':
      return [
        row(
          'Introduction to Service Design',
          'Introduction to Service Design',
          'Introduction to Service Design',
        ),
        row('Course Overview', 'Course Overview', 'Course Overview'),
        row('Getting to Know You', 'Getting to Know You', 'Getting to Know You'),
        row('What is Service Design ?', 'What is Service Design ?', 'What is Service Design ?'),
      ]
    case 'Design Thinking Fundamentals':
      return [
        row('Empathy and Observation', 'Empathy and Observation', 'Empathy and Observation'),
        row('Problem Framing', 'Problem Framing', 'Problem Framing'),
      ]
    default:
      return []
  }
}
