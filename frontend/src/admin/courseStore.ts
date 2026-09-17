import { ref } from 'vue'

export type Course = {
  id: number
  name: string
  lessons: number
  price: number
  createdAt: string
  updatedAt: string
  accent: string
  category?: string
  learningTime?: number | null
  hasPromo?: boolean
  promoCode?: string
  minimumPurchase?: number | null
  discount?: number | null
  discountType?: 'percentage' | 'fixed'
  summary?: string
  description?: string
  imageName?: string
  videoName?: string
  resourceName?: string
  lessonItems?: CourseLesson[]
}

export type CourseLesson = { id: number; name: string; subLessons: number }

const initialCourses: Course[] = [
  {
    id: 1,
    name: 'Service Design Essentials',
    lessons: 6,
    price: 3559,
    createdAt: '12/02/2022 10:30PM',
    updatedAt: '12/02/2022 10:30PM',
    accent: '#dce8fb',
  },
  {
    id: 2,
    name: 'Design Thinking Fundamentals',
    lessons: 8,
    price: 2990,
    createdAt: '18/03/2022 09:15AM',
    updatedAt: '22/03/2022 02:45PM',
    accent: '#fce4cf',
  },
  {
    id: 3,
    name: 'UX Research Methods',
    lessons: 7,
    price: 3190,
    createdAt: '07/05/2022 01:20PM',
    updatedAt: '10/05/2022 11:00AM',
    accent: '#d9f0e3',
  },
  {
    id: 4,
    name: 'Product Strategy',
    lessons: 9,
    price: 3990,
    createdAt: '21/06/2022 03:30PM',
    updatedAt: '25/06/2022 10:10AM',
    accent: '#ede0f3',
  },
  {
    id: 5,
    name: 'Digital Marketing Basics',
    lessons: 6,
    price: 2550,
    createdAt: '04/07/2022 08:45AM',
    updatedAt: '11/07/2022 04:00PM',
    accent: '#fff0bd',
  },
  {
    id: 6,
    name: 'Data Analytics Foundations',
    lessons: 10,
    price: 4590,
    createdAt: '16/08/2022 12:00PM',
    updatedAt: '20/08/2022 05:15PM',
    accent: '#d9ebef',
  },
  {
    id: 7,
    name: 'Leadership Essentials',
    lessons: 5,
    price: 2790,
    createdAt: '02/09/2022 10:30AM',
    updatedAt: '08/09/2022 01:25PM',
    accent: '#fde1e1',
  },
  {
    id: 8,
    name: 'Agile Project Management',
    lessons: 8,
    price: 3590,
    createdAt: '14/10/2022 09:00AM',
    updatedAt: '18/10/2022 03:40PM',
    accent: '#e2e4fa',
  },
]

export const courses = ref<Course[]>(initialCourses.map((course) => ({ ...course })))

export function addCourse(course: Omit<Course, 'id'>) {
  const nextId = courses.value.reduce((largest, item) => Math.max(largest, item.id), 0) + 1
  courses.value.unshift({ ...course, id: nextId })
}

export function updateCourse(id: number, updates: Partial<Omit<Course, 'id'>>) {
  const course = courses.value.find((item) => item.id === id)
  if (course) Object.assign(course, updates)
}

export function removeCourse(id: number) {
  courses.value = courses.value.filter((course) => course.id !== id)
}

export function resetCourses() {
  courses.value = initialCourses.map((course) => ({ ...course }))
}
