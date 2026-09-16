export interface SubLessonOption {
  id: string
  name: string
}

export interface LessonOption {
  id: string
  name: string
  subLessons: SubLessonOption[]
}

export interface CourseOption {
  id: string
  name: string
  lessons: LessonOption[]
}
