import type { AdminCourse } from '@/types/course'

const courseRows: Array<[string, number, number, string, string]> = [
  ['Service Design Essentials', 6, 3559, '12/02/2022 10:30PM', '#dce8fb'],
  ['Design Thinking Fundamentals', 8, 2990, '18/03/2022 09:15AM', '#fce4cf'],
  ['UX Research Methods', 7, 3190, '07/05/2022 01:20PM', '#d9f0e3'],
  ['Product Strategy', 9, 3990, '21/06/2022 03:30PM', '#ede0f3'],
  ['Digital Marketing Basics', 6, 2550, '04/07/2022 08:45AM', '#fff0bd'],
  ['Data Analytics Foundations', 10, 4590, '16/08/2022 12:00PM', '#d9ebef'],
  ['Leadership Essentials', 5, 2790, '02/09/2022 10:30AM', '#fde1e1'],
  ['Agile Project Management', 8, 3590, '14/10/2022 09:00AM', '#e2e4fa'],
]

export function makeCourseFixtures(): AdminCourse[] {
  return courseRows.map(([name, lessons, price, createdAt, accent], index) => ({
    id: index + 1,
    name,
    lessons,
    price,
    createdAt,
    updatedAt: createdAt,
    accent,
    lessonItems: Array.from({ length: lessons }, (_, lessonIndex) => ({
      id: lessonIndex + 1,
      name: lessonIndex === 0 ? 'Introduction' : `Lesson ${lessonIndex + 1}`,
      subLessons: 1,
    })),
  }))
}
