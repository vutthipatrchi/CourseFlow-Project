import type { AssignmentStatus } from '@/types/course'

export interface MyAssignment {
  id: number
  description: string
  courseId: number
  courseName: string
  lessonName: string
  subLessonId: number
  subLessonName: string
  durationDays: number | null
  dueAt: string | null
  status: AssignmentStatus
  answer: string | null
  submittedAt: string | null
}
