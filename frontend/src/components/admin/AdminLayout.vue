<script setup lang="ts">
import { useClerk } from '@clerk/vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import courseIcon from '@/assets/admin/course.svg'
import assignmentIcon from '@/assets/admin/assignment.svg'
import promoCodeIcon from '@/assets/admin/promo-code.svg'
import logoutIcon from '@/assets/admin/logout.svg'
import logo from '@/assets/landing/logo.svg'

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
        <img :src="logo" alt="CourseFlow" style="width: 174px; height: 19px" />
        <span class="text-center text-base text-[#646D89]">Admin Panel Control</span>
      </div>

      <nav class="flex flex-1 flex-col">
        <RouterLink
          :to="{ name: 'admin-courses' }"
          class="flex h-14 items-center gap-4 px-6 text-base font-medium text-[#424C6B] hover:bg-[#F1F2F6]"
        >
          <img :src="courseIcon" alt="" class="h-6 w-6 flex-none" />
          <span>Courses</span>
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
          <span>Assignments</span>
        </RouterLink>

        <div
          class="flex h-14 items-center gap-4 px-6 text-base font-medium text-[#424C6B] hover:bg-[#F1F2F6]"
        >
          <img :src="promoCodeIcon" alt="" class="h-6 w-6 flex-none" />
          <span>Promo code</span>
        </div>
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
        <h1 class="flex-1 text-2xl leading-[1.25] font-medium tracking-[-0.02em] text-[#2A2E3F]">
          {{ title }}
        </h1>
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
