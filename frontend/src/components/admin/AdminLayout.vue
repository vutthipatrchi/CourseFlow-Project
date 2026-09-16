<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-blue-600">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <span class="text-lg font-semibold text-white">CourseFlow Admin</span>
        <nav>
          <RouterLink
            :to="{ name: 'admin-assignments' }"
            class="text-sm font-medium text-white hover:text-blue-100"
          >
            Assignments
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="mx-auto max-w-6xl px-6 py-8">
      <slot />
    </main>
  </div>
</template>
