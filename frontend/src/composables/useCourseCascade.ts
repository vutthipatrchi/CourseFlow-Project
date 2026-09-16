import { computed, ref, type Ref } from 'vue'
import type { CourseOption } from '@/types/course'

export function useCourseCascade(courses: Ref<CourseOption[]>) {
  const courseId = ref('')
  const lessonId = ref('')
  const subLessonId = ref('')

  const selectedCourse = computed(
    () => courses.value.find((course) => course.id === courseId.value) ?? null,
  )
  const availableLessons = computed(() => selectedCourse.value?.lessons ?? [])
  const selectedLesson = computed(
    () => availableLessons.value.find((lesson) => lesson.id === lessonId.value) ?? null,
  )
  const availableSubLessons = computed(() => selectedLesson.value?.subLessons ?? [])
  const selectedSubLesson = computed(
    () => availableSubLessons.value.find((subLesson) => subLesson.id === subLessonId.value) ?? null,
  )

  // Bound to the <select>'s native `change` event (not a `watch`) so that
  // programmatically hydrating existing values in `setByNames` below doesn't
  // also wipe out the very values it just set.
  function handleCourseChange() {
    lessonId.value = ''
    subLessonId.value = ''
  }

  function handleLessonChange() {
    subLessonId.value = ''
  }

  function setByNames(courseName: string, lessonName: string, subLessonName: string) {
    const course = courses.value.find((candidate) => candidate.name === courseName)
    courseId.value = course?.id ?? ''
    const lesson = course?.lessons.find((candidate) => candidate.name === lessonName)
    lessonId.value = lesson?.id ?? ''
    const subLesson = lesson?.subLessons.find((candidate) => candidate.name === subLessonName)
    subLessonId.value = subLesson?.id ?? ''
  }

  return {
    courseId,
    lessonId,
    subLessonId,
    selectedCourse,
    selectedLesson,
    selectedSubLesson,
    availableLessons,
    availableSubLessons,
    handleCourseChange,
    handleLessonChange,
    setByNames,
  }
}
