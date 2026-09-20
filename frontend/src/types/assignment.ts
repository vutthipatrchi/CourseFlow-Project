export interface SubLessonOption {
  subLessonId: number
  subLessonName: string
  lessonName: string
  courseName: string
}

export interface Assignment {
  id: number
  description: string
  courseName: string
  lessonName: string
  subLessonName: string
  createdAt: string
}

export interface CreateAssignmentPayload {
  subLessonId: number
  description: string
}

export interface AssignmentDetail {
  id: number
  subLessonId: number
  description: string
  createdAt: string
}
