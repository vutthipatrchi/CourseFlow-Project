<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import MyCoursesProfileCard from '@/components/course/MyCoursesProfileCard.vue'
import CheckoutNavbar from '@/components/payment/CheckoutNavbar.vue'
import CheckoutFooter from '@/components/payment/CheckoutFooter.vue'
import { getSubscriptions, type SubscriptionView } from '@/api/payments'

const courses = ref<SubscriptionView[]>([])
const loading = ref(true)
const error = ref('')
const activeFilter = ref<'all' | 'in-progress' | 'completed'>('all')
const inProgressCourses = computed(() =>
  courses.value.filter((course) => course.status === 'in-progress'),
)
const completedCourses = computed(() =>
  courses.value.filter((course) => course.status === 'completed'),
)
const filteredCourses = computed(() =>
  activeFilter.value === 'all'
    ? courses.value
    : courses.value.filter((course) => course.status === activeFilter.value),
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    courses.value = await getSubscriptions()
  } catch (failure) {
    error.value = failure instanceof Error ? failure.message : 'Unable to load your courses'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <CheckoutNavbar />
    <main class="mx-auto w-full max-w-6xl flex-1 px-6 py-16">
      <h1 class="text-center text-3xl font-medium text-gray-900">My Courses</h1>

      <div class="mt-12 grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <MyCoursesProfileCard
          name="Max Mayfield"
          :in-progress="inProgressCourses.length"
          :completed="completedCourses.length"
        />

        <section aria-label="Purchased courses">
          <p v-if="loading" role="status">Loading your courses…</p>
          <div v-else-if="error">
            <p role="alert" class="text-red-700">{{ error }}</p>
            <button class="mt-4 text-blue-600 underline" @click="load">Try again</button>
          </div>
          <p v-else-if="!courses.length" class="text-gray-600">
            Your purchased courses will appear here after payment is confirmed.
          </p>
          <template v-else>
            <div
              class="mb-8 flex flex-wrap gap-6 border-b border-gray-200"
              aria-label="Course status filters"
            >
              <button
                v-for="filter in [
                  { value: 'all', label: 'All Courses' },
                  { value: 'in-progress', label: 'Inprogress' },
                  { value: 'completed', label: 'Completed' },
                ] as const"
                :key="filter.value"
                type="button"
                class="border-b-2 px-1 pb-3 text-sm transition-colors"
                :class="
                  activeFilter === filter.value
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                "
                @click="activeFilter = filter.value"
              >
                {{ filter.label }}
              </button>
            </div>

            <p v-if="!filteredCourses.length" class="text-gray-600">
              No {{ activeFilter === 'completed' ? 'completed' : 'in-progress' }} courses yet.
            </p>
          </template>
          <ul v-if="filteredCourses.length" class="grid gap-6 sm:grid-cols-2">
            <li
              v-for="course in filteredCourses"
              :key="course.id"
              class="rounded-xl border border-gray-200 p-6"
            >
              <span
                class="text-sm font-medium"
                :class="course.status === 'completed' ? 'text-green-700' : 'text-blue-700'"
              >
                {{ course.status === 'completed' ? 'Completed' : 'In progress' }}
              </span>
              <h2 class="mt-2 text-xl font-medium">{{ course.courseTitle }}</h2>
              <p class="mt-3 text-sm text-gray-600">
                {{ course.completedLessons }}/{{ course.totalLessons }} lessons ·
                {{ course.progressPercent }}%
              </p>
              <p class="mt-4 text-sm text-gray-600">Reference no. {{ course.reference }}</p>
              <p class="mt-1 text-sm text-gray-600">
                Purchased {{ new Date(course.activatedAt).toLocaleDateString() }}
              </p>
            </li>
          </ul>
          <RouterLink to="/" class="mt-10 inline-block font-semibold text-blue-600">
            Back to home
          </RouterLink>
        </section>
      </div>
    </main>
    <CheckoutFooter />
  </div>
</template>
