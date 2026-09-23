export type SubLessonProgress = 'not-started' | 'in-progress' | 'completed'

export type AssignmentStatus = 'pending' | 'submitted'

export type Assignment = {
  id: string
  question: string
  status: AssignmentStatus
  answer?: string
  deadlineLabel: string
}

export type SubLesson = {
  id: string
  title: string
  description: string
  videoUrl: string
  progress: SubLessonProgress
  assignment?: Assignment
}

export type Module = {
  id: string
  title: string
  subLessons: SubLesson[]
}

export type Course = {
  id: string
  category: string
  title: string
  description: string
  longDescription: string
  imageUrl: string
  lessonCount: number
  hourCount: number
  price: number
  modules: Module[]
}

export type AdminCourseLesson = { id: number; name: string; subLessons: number }

export type AdminCourse = {
  id: number
  name: string
  lessons: number
  price: number
  createdAt: string
  updatedAt: string
  accent: string
  category?: string | null
  learningTime?: number | null
  hasPromo?: boolean
  promoCode?: string | null
  minimumPurchase?: number | null
  discount?: number | null
  discountType?: 'percentage' | 'fixed' | null
  summary?: string | null
  description?: string | null
  imageName?: string | null
  videoName?: string | null
  resourceName?: string | null
  lessonItems?: AdminCourseLesson[]
}

export type AdminCoursePayload = Omit<
  AdminCourse,
  'id' | 'lessons' | 'createdAt' | 'updatedAt' | 'lessonItems'
> & {
  lessonItems: Array<Omit<AdminCourseLesson, 'id'>>
}
