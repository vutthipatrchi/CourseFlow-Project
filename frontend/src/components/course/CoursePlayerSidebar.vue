<script setup lang="ts">
// ── CoursePlayerSidebar ───────────────────────────────────────────────────
// Floating course info + module tree, scrolls independently from page content
// แก้ไขได้: sticky offset, max-height, progress bar

import ModuleAccordion from '@/components/course/ModuleAccordion.vue'
import type { Course } from '@/types/course'

type Props = {
  course: Course
  activeModuleId: string
  activeSubLessonId: string
  progressPercent: number
}

defineProps<Props>()

defineEmits<{ select: [subLessonId: string] }>()
</script>

<template>
  <aside
    class="flex w-full shrink-0 flex-col gap-6 overflow-y-auto rounded-lg bg-white p-7 shadow-[4px_4px_24px_rgba(0,0,0,0.08)] lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:w-89.5"
  >
    <p class="text-sm text-orange-500">{{ course.category }}</p>
    <div class="flex flex-col gap-2">
      <h2 class="text-2xl leading-tight font-medium tracking-[-0.02em] text-black">
        {{ course.title }}
      </h2>
      <p class="text-base text-[#646D89]">{{ course.description }}</p>
    </div>
    <div class="flex flex-col gap-2">
      <p class="text-sm text-[#646D89]">{{ progressPercent }}% Complete</p>
      <div class="h-2.5 w-full rounded-full bg-gray-200">
        <div
          class="h-2.5 rounded-full bg-linear-to-r from-[#95BEFF] to-[#0040E6] transition-all duration-300"
          :style="{ width: progressPercent + '%' }"
        ></div>
      </div>
    </div>
    <div class="flex flex-col">
      <ModuleAccordion
        v-for="(module, index) in course.modules"
        :key="module.id"
        :module="module"
        :index="index"
        :default-open="module.id === activeModuleId"
        interactive
        :active-sub-lesson-id="activeSubLessonId"
        @select="$emit('select', $event)"
      />
    </div>
  </aside>
</template>
