<script setup lang="ts">
// ── ModuleAccordion ───────────────────────────────────────────────────────
// Single collapsible module row: number, title, arrow toggle, sub-lesson list
// แก้ไขได้: default open state, arrow icon, sub-lesson list layout, progress icon

import { ref, useId } from 'vue'
import type { Module } from '@/types/course'

type Props = {
  module: Module
  index: number
  defaultOpen?: boolean
  interactive?: boolean
  activeSubLessonId?: string
  courseId?: string // kept for callers; lesson rows use the slot / interactive mode only
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  defaultOpen: false,
  interactive: false,
  compact: false,
})

defineEmits<{ select: [subLessonId: string] }>()

const isOpen = ref(props.defaultOpen)
const contentId = useId()

const toggle = () => {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="border-b border-[#D6D9E4]" :class="compact ? 'py-4' : 'py-6'">
    <button
      type="button"
      :aria-expanded="isOpen"
      :aria-controls="contentId"
      class="flex w-full cursor-pointer items-start rounded-lg text-left transition-colors duration-200 hover:bg-gray-50 active:scale-[0.99]"
      :class="compact ? 'gap-4' : 'gap-6'"
      @click="toggle"
    >
      <span
        class="leading-tight font-medium tracking-[-0.02em] text-[#646D89]"
        :class="compact ? 'text-lg' : 'text-2xl'"
      >
        {{ String(index + 1).padStart(2, '0') }}
      </span>
      <span
        class="flex-1 leading-tight font-medium tracking-[-0.02em] text-black"
        :class="compact ? 'text-lg' : 'text-2xl'"
      >
        {{ module.title }}
      </span>
      <svg
        class="mt-1 shrink-0 text-[#646D89] transition-transform duration-200"
        :class="[isOpen ? 'rotate-180' : '', compact ? 'h-5 w-5' : 'h-6 w-6']"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M7 10l5 5 5-5z" />
      </svg>
    </button>
    <div
      :id="contentId"
      class="grid transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <ul
        v-if="isOpen"
        class="flex min-h-0 flex-col gap-2 overflow-hidden px-2 pt-2 text-[#646D89] sm:px-10"
        :class="compact ? 'text-sm' : 'text-base'"
      >
        <li v-for="subLesson in module.subLessons" :key="subLesson.id">
          <button
            v-if="interactive"
            type="button"
            class="flex w-full cursor-pointer items-start gap-4 rounded-lg px-2 py-3 text-left transition-colors duration-200 hover:bg-gray-50"
            :class="subLesson.id === activeSubLessonId ? 'bg-gray-100' : ''"
            @click="$emit('select', subLesson.id)"
          >
            <svg
              v-if="subLesson.progress === 'completed'"
              class="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 20 20"
              fill="#2FAC8E"
            >
              <path
                d="M10 1a9 9 0 100 18 9 9 0 000-18zm-1.2 13.2l-4-4 1.4-1.4 2.6 2.6 6-6 1.4 1.4-7.4 7.4z"
              />
            </svg>
            <svg
              v-else-if="subLesson.progress === 'in-progress'"
              class="mt-0.5 h-5 w-5 shrink-0"
              viewBox="0 0 20 20"
            >
              <circle cx="10" cy="10" r="8.5" fill="none" stroke="#2FAC8E" stroke-width="1.5" />
              <path d="M10 1.5a8.5 8.5 0 010 17z" fill="#2FAC8E" />
            </svg>
            <svg v-else class="mt-0.5 h-5 w-5 shrink-0" viewBox="0 0 20 20">
              <circle cx="10" cy="10" r="8.5" fill="none" stroke="#2FAC8E" stroke-width="1.5" />
            </svg>
            <span class="flex-1">{{ subLesson.title }}</span>
          </button>
          <slot v-else name="lesson" :sub-lesson="subLesson">
            <span>{{ subLesson.title }}</span>
          </slot>
        </li>
      </ul>
    </div>
  </div>
</template>
