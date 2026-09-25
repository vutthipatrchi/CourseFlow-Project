import type { AssignmentStatus } from '@/types/course'

export interface MyAssignment {
  id: number
  description: string
  courseId: number
  courseName: string
  lessonName: string
  lessonPosition: number
  subLessonId: number
  subLessonName: string
  subLessonPosition: number
  durationDays: number | null
  status: AssignmentStatus
  answer: string | null
  submittedAt: string | null
}
