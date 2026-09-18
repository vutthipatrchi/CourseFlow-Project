import type { Course } from '@/types/course'

export const courses: Course[] = Array.from({ length: 12 }, (_, index) => ({
  id: `course-${index + 1}`,
  category: 'Course',
  title: 'Service Design Essentials',
  description: 'Lorem ipsum dolor sit amet, conse ctetur adipiscing elit.',
  imageUrl: '',
  lessonCount: 6,
  hourCount: 6,
}))
