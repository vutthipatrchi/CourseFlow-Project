<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal.vue'
import { fetchCourseCatalog } from '@/services/courses'
import { deleteAssignment, fetchAssignmentById, updateAssignment } from '@/services/assignments'
import { useCourseCascade } from '@/composables/useCourseCascade'
import type { CourseOption } from '@/types/course'
import type { Assignment } from '@/types/assignment'

const route = useRoute()
const router = useRouter()
const assignmentId = route.params.id as string

const courses = ref<CourseOption[]>([])
const assignment = ref<Assignment | null>(null)
const isLoading = ref(true)
const isDeleteModalOpen = ref(false)
const assignmentDetail = ref('')
const submitted = ref(false)

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
  setByNames,
} = useCourseCascade(courses)

onMounted(async () => {
  const [catalog, found] = await Promise.all([
    fetchCourseCatalog(),
    fetchAssignmentById(assignmentId),
  ])
  courses.value = catalog

  if (!found) {
    router.replace('/admin/assignments')
    return
  }

  assignment.value = found
  setByNames(found.course, found.lesson, found.subLesson)
  assignmentDetail.value = found.detail
  isLoading.value = false
})

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

function handleSave() {
  submitted.value = true
  if (!isValid.value || !selectedCourse.value || !selectedLesson.value || !selectedSubLesson.value)
    return

  updateAssignment(assignmentId, {
    detail: assignmentDetail.value.trim(),
    course: selectedCourse.value.name,
    lesson: selectedLesson.value.name,
    subLesson: selectedSubLesson.value.name,
  })
  router.push('/admin/assignments')
}

function confirmDelete() {
  deleteAssignment(assignmentId)
  isDeleteModalOpen.value = false
  router.push('/admin/assignments')
}
</script>

<template>
  <AdminLayout>
    <div v-if="isLoading" class="py-8 text-center text-gray-500">Loading assignment…</div>

    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="text-gray-500 hover:text-gray-700"
            aria-label="Back to Assignments"
            @click="handleCancel"
          >
            <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true">
              <path
                d="M15 18L9 12L15 6"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div>
            <p class="text-xs text-gray-500">Assignment</p>
            <h1 class="text-lg font-bold text-gray-900">{{ assignment?.detail }}</h1>
          </div>
        </div>
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
            @click="handleSave"
          >
            Save
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
            <label class="block text-sm font-medium text-gray-700" for="sub-lesson"
              >Sub-lesson</label
            >
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
          <label class="block text-sm font-medium text-gray-700" for="assignment"
            >Assignment *</label
          >
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

      <div class="mt-4 text-right">
        <button
          type="button"
          class="text-sm font-bold text-blue-600 hover:text-blue-800"
          @click="isDeleteModalOpen = true"
        >
          Delete Assignment
        </button>
      </div>

      <DeleteConfirmationModal
        :open="isDeleteModalOpen"
        @cancel="isDeleteModalOpen = false"
        @confirm="confirmDelete"
      />
    </template>
  </AdminLayout>
</template>
