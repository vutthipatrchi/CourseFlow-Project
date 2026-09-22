import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  createCourse,
  deleteCourse,
  getCourse as fetchCourse,
  listCourses,
  updateCourse as saveCourse,
} from '@/api/courses'
import { toApiError } from '@/api/client'
import type { AdminCourse, AdminCoursePayload } from '@/types/course'

export const useCourseStore = defineStore('courses', () => {
  const courses = ref<AdminCourse[]>([])
  const loading = ref(false)
  const error = ref('')
  const loaded = ref(false)

  async function load(force = false) {
    if (loaded.value && !force) return courses.value

    loading.value = true
    error.value = ''
    try {
      courses.value = await listCourses()
      loaded.value = true
      return courses.value
    } catch (cause) {
      error.value = toApiError(cause).message
      throw cause
    } finally {
      loading.value = false
    }
  }

  async function find(id: number, force = false) {
    const cached = courses.value.find((course) => course.id === id)
    if (!force && cached?.lessonItems) return cached

    const course = await fetchCourse(id)
    replace(course)
    return course
  }

  async function add(payload: AdminCoursePayload) {
    const created = await createCourse(payload)
    courses.value.unshift(created)
    loaded.value = true
    return created
  }

  async function update(id: number, payload: AdminCoursePayload) {
    const updated = await saveCourse(id, payload)
    replace(updated)
    return updated
  }

  async function remove(id: number) {
    await deleteCourse(id)
    courses.value = courses.value.filter((course) => course.id !== id)
  }

  function replace(course: AdminCourse) {
    const index = courses.value.findIndex((item) => item.id === course.id)
    if (index >= 0) courses.value[index] = course
    else courses.value.push(course)
  }

  return { courses, loading, error, loaded, load, find, add, update, remove }
})
