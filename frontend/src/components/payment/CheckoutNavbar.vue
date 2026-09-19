<script setup lang="ts">
import { RouterLink } from 'vue-router'
import logo from '@/assets/landing/logo.svg'
</script>

<template>
  <header class="h-[88px] w-full bg-white shadow-[2px_2px_12px_rgba(64,50,133,0.12)]">
    <nav
      class="mx-auto flex h-full max-w-[1120px] items-center justify-between px-4 sm:px-6 xl:px-0"
    >
      <RouterLink to="/" aria-label="CourseFlow home">
        <img :src="logo" alt="CourseFlow" class="h-4 w-auto" />
      </RouterLink>

      <div class="flex items-center gap-6 sm:gap-12">
        <RouterLink
          to="/"
          class="text-sm font-medium text-darkblue-500 hover:text-blue-600 sm:text-base"
        >
          Our Courses
        </RouterLink>
        <button
          type="button"
          class="flex items-center gap-3 text-sm text-gray-700"
          aria-label="Open account menu"
        >
          <span
            class="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-sm font-semibold text-blue-600"
            aria-hidden="true"
            >MM</span
          >
          <span class="hidden sm:inline">Max Mayfield</span>
          <span class="hidden text-gray-600 sm:inline" aria-hidden="true">▾</span>
        </button>
      </div>
    </nav>
  </header>
</template>
