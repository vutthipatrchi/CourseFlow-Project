<script setup lang="ts">
import { useRoute } from 'vue-router'

interface NavItem {
  label: string
  to: string
}

const route = useRoute()

const navItems: NavItem[] = [
  { label: 'Courses', to: '/admin/courses' },
  { label: 'Assignments', to: '/admin/assignments' },
  { label: 'Promo code', to: '/admin/promo-code' },
]

function isActive(to: string): boolean {
  return route.path.startsWith(to)
}
</script>

<template>
  <aside class="flex h-screen w-20 flex-col border-r border-gray-200 bg-white py-6 lg:w-64">
    <div class="px-3 lg:px-6">
      <span
        class="hidden bg-gradient-to-r from-utility-inner1 to-utility-inner2 bg-clip-text text-xl font-extrabold text-transparent lg:inline"
      >
        CourseFlow
      </span>
      <span
        class="mx-auto block h-6 w-6 rounded bg-gradient-to-r from-utility-inner1 to-utility-inner2 lg:hidden"
        aria-hidden="true"
      />
      <p class="mt-1 hidden text-xs text-gray-500 lg:block">Admin Panel Control</p>
    </div>

    <nav class="mt-8 flex flex-1 flex-col gap-1 px-3 lg:px-4">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:justify-start"
        :class="isActive(item.to) ? 'bg-gray-100 text-gray-900' : ''"
      >
        <svg
          v-if="item.label === 'Courses'"
          viewBox="0 0 24 24"
          fill="none"
          class="h-5 w-5 shrink-0"
          aria-hidden="true"
        >
          <path
            d="M4 5.5C4 4.67 4.67 4 5.5 4H11V20H5.5C4.67 20 4 19.33 4 18.5V5.5Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <path
            d="M20 5.5C20 4.67 19.33 4 18.5 4H13V20H18.5C19.33 20 20 19.33 20 18.5V5.5Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-else-if="item.label === 'Assignments'"
          viewBox="0 0 24 24"
          fill="none"
          class="h-5 w-5 shrink-0"
          aria-hidden="true"
        >
          <rect
            x="6"
            y="4"
            width="12"
            height="17"
            rx="1.5"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M9 4V3.5C9 2.67 9.67 2 10.5 2H13.5C14.33 2 15 2.67 15 3.5V4"
            stroke="currentColor"
            stroke-width="1.5"
          />
          <path
            d="M9 11H15M9 15H15"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0" aria-hidden="true">
          <path
            d="M20.59 13.41L12 22l-9-9V4a1 1 0 0 1 1-1h9l7.59 7.59a2 2 0 0 1 0 2.82Z"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linejoin="round"
          />
          <circle cx="7.5" cy="7.5" r="1.25" stroke="currentColor" stroke-width="1.5" />
        </svg>
        <span class="hidden lg:inline">{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="px-3 lg:px-4">
      <button
        type="button"
        class="flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 lg:justify-start"
      >
        <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5 shrink-0" aria-hidden="true">
          <path
            d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M16 17L21 12L16 7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M21 12H9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <span class="hidden lg:inline">Log out</span>
      </button>
    </div>
  </aside>
</template>
