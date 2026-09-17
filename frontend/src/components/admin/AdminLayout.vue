<script setup lang="ts">
import { useClerk } from '@clerk/vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

defineProps<{
  title: string
}>()

const route = useRoute()
const router = useRouter()
const isActive = (name: string) => route.name === name

const clerk = useClerk()
async function logOut() {
  await clerk.value?.signOut()
  router.push({ name: 'home' })
}
</script>

<template>
  <div class="flex min-h-screen bg-white">
    <aside class="flex w-[240px] flex-none flex-col gap-10 border-r border-[#D6D9E4] bg-white">
      <div class="flex flex-col items-center gap-6 px-6 pt-10 pb-6">
        <span
          class="bg-gradient-to-r from-[#95BEFF] to-[#0040E6] bg-clip-text text-lg font-extrabold text-transparent"
        >
          CourseFlow
        </span>
        <span class="text-center text-base text-[#646D89]">Admin Panel Control</span>
      </div>

      <nav class="flex flex-1 flex-col">
        <div
          class="flex h-14 cursor-default items-center gap-4 px-6 text-base font-medium text-[#424C6B]"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            class="h-6 w-6 flex-none stroke-current"
            stroke-width="1.5"
          >
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </svg>
          <span>Course</span>
        </div>

        <RouterLink
          :to="{ name: 'admin-assignments' }"
          class="flex h-14 items-center gap-4 px-6 text-base font-medium"
          :class="
            isActive('admin-assignments') || isActive('admin-assignment-create')
              ? 'bg-[#F1F2F6] text-[#424C6B]'
              : 'text-[#424C6B] hover:bg-[#F1F2F6]'
          "
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            class="h-6 w-6 flex-none stroke-current"
            stroke-width="1.5"
          >
            <path d="M7 3.5h7.5L19 8v12.5a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
            <path d="M14 3.5V8h5" />
            <path d="M8.5 13h7M8.5 16.5h7M8.5 9.5h3" />
          </svg>
          <span>Assignment</span>
        </RouterLink>

        <div
          class="flex h-14 cursor-default items-center gap-4 px-6 text-base font-medium text-[#424C6B]"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6 flex-none stroke-current">
            <path
              d="M20 12.5 12.5 20a1 1 0 0 1-1.4 0l-7.1-7.1a1 1 0 0 1-.3-.7V5.5A1.5 1.5 0 0 1 5.1 4h6.7a1 1 0 0 1 .7.3l7.5 7.5a1 1 0 0 1 0 1.4Z"
              stroke-width="1"
            />
            <path d="M8 8.5h.01" stroke-width="1.5" />
          </svg>
          <span>Promo code</span>
        </div>
      </nav>

      <button
        type="button"
        class="mb-6 flex h-14 items-center gap-4 px-6 text-left text-base font-bold text-[#424C6B] hover:bg-[#F1F2F6]"
        @click="logOut"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          class="h-6 w-6 flex-none stroke-current"
          stroke-width="1"
        >
          <path d="M9 21H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
        <span>Log out</span>
      </button>
    </aside>

    <div class="flex flex-1 flex-col">
      <header
        class="flex h-[92px] flex-none items-center gap-4 border-b border-[#D6D9E4] bg-white px-10 py-4"
      >
        <h1 class="flex-1 text-2xl font-medium tracking-[-0.02em] text-[#2A2E3F]">{{ title }}</h1>
        <div class="flex items-center gap-4">
          <slot name="actions" />
        </div>
      </header>

      <main class="flex-1 bg-[#F6F7FC] px-10 py-12">
        <slot />
      </main>
    </div>
  </div>
</template>
