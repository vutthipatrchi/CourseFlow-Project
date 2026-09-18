import { ref } from 'vue'

export type CourseLesson = { id: number; name: string; subLessons: number }

export type Course = {
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
  lessonItems?: CourseLesson[]
}

export type CoursePayload = Omit<
  Course,
  'id' | 'lessons' | 'createdAt' | 'updatedAt' | 'lessonItems'
> & {
  lessonItems: Array<Omit<CourseLesson, 'id'>>
}

const API_URL = '/api/admin/courses'

export const courses = ref<Course[]>([])
export const coursesLoading = ref(false)
export const coursesError = ref('')
let coursesLoaded = false

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: init?.body ? { 'Content-Type': 'application/json', ...init.headers } : init?.headers,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { detail?: string; message?: string }
      message = body.detail || body.message || message
    } catch {
      // Keep the HTTP fallback when the backend did not return JSON.
    }
    throw new Error(message)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

export async function loadCourses(force = false) {
  if (coursesLoaded && !force) return courses.value

  coursesLoading.value = true
  coursesError.value = ''
  try {
    courses.value = await request<Course[]>(API_URL)
    coursesLoaded = true
    return courses.value
  } catch (error) {
    coursesError.value = error instanceof Error ? error.message : 'Unable to load courses'
    throw error
  } finally {
    coursesLoading.value = false
  }
}

export async function getCourse(id: number) {
  const cached = courses.value.find((course) => course.id === id)
  if (cached?.lessonItems) return cached

  const course = await request<Course>(`${API_URL}/${id}`)
  const index = courses.value.findIndex((item) => item.id === id)
  if (index >= 0) courses.value[index] = course
  else courses.value.push(course)
  return course
}

export async function addCourse(course: CoursePayload) {
  const created = await request<Course>(API_URL, {
    method: 'POST',
    body: JSON.stringify(course),
  })
  courses.value.unshift(created)
  coursesLoaded = true
  return created
}

export async function updateCourse(id: number, updates: CoursePayload) {
  const updated = await request<Course>(`${API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
  const index = courses.value.findIndex((course) => course.id === id)
  if (index >= 0) courses.value[index] = updated
  else courses.value.push(updated)
  return updated
}

export async function removeCourse(id: number) {
  await request<void>(`${API_URL}/${id}`, { method: 'DELETE' })
  courses.value = courses.value.filter((course) => course.id !== id)
}

// Deterministic fixtures are retained only for isolated component tests.
const testCourses: Course[] = [
  ['Service Design Essentials', 6, 3559, '12/02/2022 10:30PM', '#dce8fb'],
  ['Design Thinking Fundamentals', 8, 2990, '18/03/2022 09:15AM', '#fce4cf'],
  ['UX Research Methods', 7, 3190, '07/05/2022 01:20PM', '#d9f0e3'],
  ['Product Strategy', 9, 3990, '21/06/2022 03:30PM', '#ede0f3'],
  ['Digital Marketing Basics', 6, 2550, '04/07/2022 08:45AM', '#fff0bd'],
  ['Data Analytics Foundations', 10, 4590, '16/08/2022 12:00PM', '#d9ebef'],
  ['Leadership Essentials', 5, 2790, '02/09/2022 10:30AM', '#fde1e1'],
  ['Agile Project Management', 8, 3590, '14/10/2022 09:00AM', '#e2e4fa'],
].map(([name, lessons, price, createdAt, accent], index) => ({
  id: index + 1,
  name: name as string,
  lessons: lessons as number,
  price: price as number,
  createdAt: createdAt as string,
  updatedAt: createdAt as string,
  accent: accent as string,
  lessonItems: Array.from({ length: lessons as number }, (_, lessonIndex) => ({
    id: lessonIndex + 1,
    name: lessonIndex === 0 ? 'Introduction' : `Lesson ${lessonIndex + 1}`,
    subLessons: 1,
  })),
}))

export function resetCourses() {
  courses.value = testCourses.map((course) => ({
    ...course,
    lessonItems: course.lessonItems?.map((lesson) => ({ ...lesson })),
  }))
  coursesLoaded = true
  coursesLoading.value = false
  coursesError.value = ''
}
