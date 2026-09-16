export type AssignmentStatus = 'draft' | 'published'

export interface SubLessonOption {
  subLessonId: number
  subLessonName: string
  lessonName: string
  courseName: string
}

export interface Assignment {
  id: number
  description: string
  durationDays: number
  status: AssignmentStatus
  courseName: string
  lessonName: string
  subLessonName: string
  createdAt: string
}

export interface CreateAssignmentPayload {
  subLessonId: number
  description: string
  durationDays: number
  status?: AssignmentStatus
}
