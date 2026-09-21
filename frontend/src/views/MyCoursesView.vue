<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CheckoutNavbar from '@/components/payment/CheckoutNavbar.vue'
import CheckoutFooter from '@/components/payment/CheckoutFooter.vue'
import { getSubscriptions, type SubscriptionView } from '@/api/payments'
const courses = ref<SubscriptionView[]>([])
const loading = ref(true)
const error = ref('')
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
    <main class="mx-auto w-full max-w-5xl flex-1 px-6 py-16">
      <h1 class="text-3xl font-medium text-gray-900">My courses</h1>
      <p v-if="loading" role="status" class="mt-8">Loading your courses…</p>
      <div v-else-if="error" class="mt-8">
        <p role="alert" class="text-red-700">{{ error }}</p>
        <button class="mt-4 text-blue-600 underline" @click="load">Try again</button>
      </div>
      <p v-else-if="!courses.length" class="mt-8 text-gray-600">
        Your purchased courses will appear here after payment is confirmed.
      </p>
      <ul v-else class="mt-8 grid gap-6 sm:grid-cols-2">
        <li
          v-for="course in courses"
          :key="course.id"
          class="rounded-xl border border-gray-200 p-6"
        >
          <span class="text-sm font-medium text-green-700">Enrolled</span>
          <h2 class="mt-2 text-xl font-medium">{{ course.courseTitle }}</h2>
          <p class="mt-4 text-sm text-gray-600">Reference no. {{ course.reference }}</p>
          <p class="mt-1 text-sm text-gray-600">
            Purchased {{ new Date(course.activatedAt).toLocaleDateString() }}
          </p>
        </li>
      </ul>
      <RouterLink to="/" class="mt-10 inline-block font-semibold text-blue-600"
        >Back to home</RouterLink
      >
    </main>
    <CheckoutFooter />
  </div>
</template>
