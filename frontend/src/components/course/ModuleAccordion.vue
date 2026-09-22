<script setup lang="ts">
// ── ModuleAccordion ───────────────────────────────────────────────────────
// Single collapsible module row: number, title, arrow toggle, sub-lesson list
// แก้ไขได้: default open state, arrow icon, sub-lesson list layout

import { ref } from 'vue'
import type { Module } from '@/types/course'

type Props = {
  module: Module
  index: number
  defaultOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), { defaultOpen: false })

const isOpen = ref(props.defaultOpen)

const toggle = () => {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div class="border-b border-[#D6D9E4] py-6">
    <button
      type="button"
      class="flex w-full cursor-pointer items-start gap-6 rounded-lg text-left transition-colors duration-200 hover:bg-gray-50 active:scale-[0.99]"
      @click="toggle"
    >
      <span class="text-2xl leading-tight font-medium tracking-[-0.02em] text-[#646D89]">
        {{ String(index + 1).padStart(2, '0') }}
      </span>
      <span class="flex-1 text-2xl leading-tight font-medium tracking-[-0.02em] text-black">
        {{ module.title }}
      </span>
      <svg
        class="mt-1 h-6 w-6 shrink-0 text-[#646D89] transition-transform"
        :class="{ 'rotate-180': isOpen }"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M7 10l5 5 5-5z" />
      </svg>
    </button>
    <div
      class="grid transition-[grid-template-rows] duration-300 ease-in-out"
      :class="isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'"
    >
      <ul class="flex min-h-0 flex-col gap-2 overflow-hidden px-10 pt-2 text-base text-[#646D89]">
        <li v-for="subLesson in module.subLessons" :key="subLesson">{{ subLesson }}</li>
      </ul>
    </div>
  </div>
</template>
