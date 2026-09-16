<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import { fetchCourseCatalog } from '@/services/courses'
import { createAssignment } from '@/services/assignments'
import { useCourseCascade } from '@/composables/useCourseCascade'
import type { CourseOption } from '@/types/course'

const router = useRouter()

const courses = ref<CourseOption[]>([])
const assignmentDetail = ref('')
const submitted = ref(false)

onMounted(async () => {
  courses.value = await fetchCourseCatalog()
})

const {
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
} = useCourseCascade(courses)

const errors = computed(() => ({
  course: courseId.value ? '' : 'Please select a course.',
  lesson: lessonId.value ? '' : 'Please select a lesson.',
  subLesson: subLessonId.value ? '' : 'Please select a sub-lesson.',
  assignment: assignmentDetail.value.trim() ? '' : 'Please enter the assignment detail.',
}))

const isValid = computed(() => Object.values(errors.value).every((message) => !message))

function handleCancel() {
  router.push('/admin/assignments')
}

function handleCreate() {
  submitted.value = true
  if (!isValid.value || !selectedCourse.value || !selectedLesson.value || !selectedSubLesson.value)
    return

  createAssignment({
    detail: assignmentDetail.value.trim(),
    course: selectedCourse.value.name,
    lesson: selectedLesson.value.name,
    subLesson: selectedSubLesson.value.name,
  })
  router.push('/admin/assignments')
}
</script>

<template>
  <AdminLayout>
    <div class="flex items-center justify-between border-b border-gray-200 pb-4">
      <h1 class="text-2xl font-bold text-gray-900">Add Assignment</h1>
      <div class="flex gap-3">
        <button
          type="button"
          class="rounded-lg border-2 border-orange-500 bg-white px-5 py-2.5 text-sm font-semibold text-orange-500 hover:bg-orange-500 hover:text-white"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="button"
          class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          @click="handleCreate"
        >
          Create
        </button>
      </div>
    </div>

    <div class="mt-6 rounded-xl border border-gray-200 bg-white p-6">
      <div>
        <label class="block text-sm font-medium text-gray-700" for="course">Course</label>
        <select
          id="course"
          v-model="courseId"
          class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          @change="handleCourseChange"
        >
          <option value="" disabled>Select Course</option>
          <option v-for="course in courses" :key="course.id" :value="course.id">
            {{ course.name }}
          </option>
        </select>
        <p v-if="submitted && errors.course" class="mt-1 text-xs text-red-600">
          {{ errors.course }}
        </p>
      </div>

      <div class="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-gray-700" for="lesson">Lesson</label>
          <select
            id="lesson"
            v-model="lessonId"
            :disabled="!courseId"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            @change="handleLessonChange"
          >
            <option value="" disabled>Select Lesson</option>
            <option v-for="lesson in availableLessons" :key="lesson.id" :value="lesson.id">
              {{ lesson.name }}
            </option>
          </select>
          <p v-if="submitted && errors.lesson" class="mt-1 text-xs text-red-600">
            {{ errors.lesson }}
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700" for="sub-lesson">Sub-lesson</label>
          <select
            id="sub-lesson"
            v-model="subLessonId"
            :disabled="!lessonId"
            class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
          >
            <option value="" disabled>Select Sub-lesson</option>
            <option
              v-for="subLesson in availableSubLessons"
              :key="subLesson.id"
              :value="subLesson.id"
            >
              {{ subLesson.name }}
            </option>
          </select>
          <p v-if="submitted && errors.subLesson" class="mt-1 text-xs text-red-600">
            {{ errors.subLesson }}
          </p>
        </div>
      </div>

      <hr class="my-6 border-gray-200" />

      <h2 class="text-sm font-semibold text-gray-700">Assignment detail</h2>
      <div class="mt-3">
        <label class="block text-sm font-medium text-gray-700" for="assignment">Assignment *</label>
        <input
          id="assignment"
          v-model="assignmentDetail"
          type="text"
          class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <p v-if="submitted && errors.assignment" class="mt-1 text-xs text-red-600">
          {{ errors.assignment }}
        </p>
      </div>
    </div>
  </AdminLayout>
</template>
