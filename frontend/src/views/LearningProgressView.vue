<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppFooter from '@/components/landing/AppFooter.vue'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import { getCheckoutCourse } from '@/api/payments'
import { catalogCourseId } from '@/lib/catalogCourses'
import { getCourseAccess, learningPathForSubscription } from '@/lib/courseAccess'
import { useToast } from '@/composables/useToast'

const route = useRoute()
const router = useRouter()
const { error: notifyError } = useToast()

const accessLoading = ref(true)
const accessDenied = ref(false)
const accessError = ref('')
const paymentCourseId = ref<number | null>(null)
const courseTitle = ref('')
const courseRouteId = ref('')
let accessRequest = 0

async function verifyAccess() {
  const request = ++accessRequest
  const id = catalogCourseId(route.params.courseId)
  accessLoading.value = true
  accessDenied.value = false
  accessError.value = ''
  paymentCourseId.value = null
  courseTitle.value = ''
  courseRouteId.value = typeof route.params.courseId === 'string' ? route.params.courseId : ''
  if (!id) {
    accessDenied.value = true
    accessError.value = 'Course not found.'
    notifyError(accessError.value)
    accessLoading.value = false
    return
  }
  try {
    const catalogCourse = await getCheckoutCourse(id)
    if (request !== accessRequest) return
    courseTitle.value = catalogCourse.name
    paymentCourseId.value = catalogCourse.id
    const access = await getCourseAccess(catalogCourse.name)
    if (request !== accessRequest) return
    if (access.enrolled && access.subscriptionCourseId) {
      await router.replace(learningPathForSubscription(access.subscriptionCourseId))
      return
    }
    accessDenied.value = true
    accessError.value = 'Purchase this course to start learning.'
    notifyError(accessError.value)
  } catch (error) {
    if (request !== accessRequest) return
    accessDenied.value = true
    accessError.value = error instanceof Error ? error.message : 'Unable to verify course access'
    notifyError(accessError.value)
  } finally {
    if (request === accessRequest) accessLoading.value = false
  }
}

watch(
  () => route.params.courseId,
  () => {
    void verifyAccess()
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="accessLoading" class="flex min-h-screen flex-col bg-white">
    <AppNavbar />
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <p role="status" class="text-[#646D89]">Checking course access…</p>
    </main>
    <AppFooter />
  </div>

  <div v-else class="flex min-h-screen flex-col bg-white">
    <AppNavbar />
    <main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <p role="alert" class="rounded-lg bg-red-50 p-4 text-sm text-red-700">
        {{ accessError || 'You do not have access to this course.' }}
      </p>
      <div class="mt-4 flex flex-wrap gap-4">
        <RouterLink
          v-if="courseRouteId"
          :to="`/courses/${courseRouteId}`"
          class="inline-block font-semibold text-blue-600"
        >
          Back to course detail
        </RouterLink>
        <RouterLink
          v-if="paymentCourseId"
          :to="{ name: 'payment', query: { courseId: paymentCourseId } }"
          class="inline-block font-semibold text-blue-600"
        >
          Subscribe this course
        </RouterLink>
        <RouterLink to="/my-courses" class="inline-block font-semibold text-blue-600">
          Back to My Courses
        </RouterLink>
      </div>
      <p v-if="courseTitle" class="mt-6 text-sm text-[#646D89]">{{ courseTitle }}</p>
    </main>
    <AppFooter />
  </div>
</template>
