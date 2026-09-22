<script setup lang="ts">
import { useClerk } from '@clerk/vue'
import { RouterLink, useRoute, useRouter, type RouteLocationRaw } from 'vue-router'
import courseIcon from '@/assets/admin/course.svg'
import assignmentIcon from '@/assets/admin/assignment.svg'
import promoCodeIcon from '@/assets/admin/promo-code.svg'
import logoutIcon from '@/assets/admin/logout.svg'
import logo from '@/assets/admin/courseflow-sidebar-logo.svg'

defineProps<{
  title: string
  breadcrumb?: string
  backTo?: RouteLocationRaw
}>()

const route = useRoute()
const router = useRouter()
const isActive = (name: string) => route.name === name
const isCourseActive = () =>
  String(route.name ?? '').startsWith('admin-lesson') ||
  String(route.name ?? '').startsWith('admin-course')

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
        <img :src="logo" alt="CourseFlow" style="width: 174px; height: 19px" />
        <span class="text-center text-base text-[#646D89]">Admin Panel Control</span>
      </div>

      <nav class="flex flex-1 flex-col">
        <RouterLink
          :to="{ name: 'admin-courses' }"
          class="flex h-14 items-center gap-4 px-6 text-base font-medium"
          :class="
            isCourseActive() ? 'bg-[#F1F2F6] text-[#424C6B]' : 'text-[#424C6B] hover:bg-[#F1F2F6]'
          "
        >
          <img :src="courseIcon" alt="" class="h-6 w-6 flex-none" />
          <span>Course</span>
        </RouterLink>

        <RouterLink
          :to="{ name: 'admin-assignments' }"
          class="flex h-14 items-center gap-4 px-6 text-base font-medium"
          :class="
            isActive('admin-assignments') ||
            isActive('admin-assignment-create') ||
            isActive('admin-assignment-edit')
              ? 'bg-[#F1F2F6] text-[#424C6B]'
              : 'text-[#424C6B] hover:bg-[#F1F2F6]'
          "
        >
          <img :src="assignmentIcon" alt="" class="h-6 w-6 flex-none" />
          <span>Assignment</span>
        </RouterLink>

        <RouterLink
          :to="{ name: 'admin-promo-codes' }"
          class="flex h-14 items-center gap-4 px-6 text-base font-medium"
          :class="
            isActive('admin-promo-codes') ||
            isActive('admin-promo-code-create') ||
            isActive('admin-promo-code-edit')
              ? 'bg-[#F1F2F6] text-[#424C6B]'
              : 'text-[#424C6B] hover:bg-[#F1F2F6]'
          "
        >
          <img :src="promoCodeIcon" alt="" class="h-6 w-6 flex-none" />
          <span>Promo code</span>
        </RouterLink>
      </nav>

      <button
        type="button"
        class="mb-6 flex h-14 items-center gap-4 px-6 text-left text-base font-bold text-[#424C6B] hover:bg-[#F1F2F6]"
        @click="logOut"
      >
        <img :src="logoutIcon" alt="" class="h-6 w-6 flex-none" />
        <span>Log out</span>
      </button>
    </aside>

    <div class="flex flex-1 flex-col">
      <header
        class="flex h-[92px] flex-none items-center gap-4 border-b border-[#D6D9E4] bg-white px-10 py-4"
      >
        <RouterLink
          v-if="backTo"
          :to="backTo"
          class="flex h-10 w-10 flex-none items-center justify-center rounded-lg text-[#2A2E3F] hover:bg-[#F1F2F6]"
          aria-label="Back to course"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            class="h-6 w-6 fill-none stroke-current"
            stroke-width="1.5"
          >
            <path d="m15 5-7 7 7 7" />
          </svg>
        </RouterLink>
        <div class="flex min-w-0 flex-1 flex-col gap-1">
          <p v-if="breadcrumb" class="truncate text-sm text-[#9AA1B9]">{{ breadcrumb }}</p>
          <h1
            class="truncate text-2xl leading-[1.25] font-medium tracking-[-0.02em] text-[#2A2E3F]"
          >
            {{ title }}
          </h1>
        </div>
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
