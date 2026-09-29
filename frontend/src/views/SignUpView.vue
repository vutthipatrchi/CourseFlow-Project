<script setup lang="ts">
import { SignUp } from '@clerk/vue'
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const redirectUrl = computed(() => {
  const redirect = route.query.redirect
  return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')
    ? redirect
    : '/'
})
</script>

<template>
  <main class="flex min-h-screen flex-col items-center bg-blue-100 px-6 py-10">
    <RouterLink to="/" class="mb-8 text-sm font-semibold text-blue-700 hover:text-blue-900">
      ← Back to CourseFlow
    </RouterLink>
    <SignUp
      path="/sign-up"
      routing="path"
      sign-in-url="/sign-in"
      :fallback-redirect-url="redirectUrl"
    />
  </main>
</template>
