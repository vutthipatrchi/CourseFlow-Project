<script setup lang="ts">
// ── AssignmentCard ────────────────────────────────────────────────────────
// Assignment block: editable (Pending/In progress/Overdue) or read-only (Submitted)
// แก้ไขได้: badge colors, deadline hint copy, button label

import { computed, ref } from 'vue'
import type { Assignment } from '@/types/course'

type Props = {
  assignment: Assignment
  courseTitle?: string
  lessonTitle?: string
  openInCourseHref?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{ submit: [answer: string] }>()

const draftAnswer = ref(props.assignment.answer ?? '')

const isEditable = computed(() => props.assignment.status !== 'submitted')

const handleSubmit = () => {
  if (!draftAnswer.value.trim()) return
  emit('submit', draftAnswer.value.trim())
}

const badgeClasses: Record<Assignment['status'], string> = {
  pending: 'bg-[#FFFBDB] text-[#996500]',
  'in-progress': 'bg-[#EBF0FF] text-[#3557CF]',
  submitted: 'bg-[#DDF9EF] text-[#0A7B60]',
  overdue: 'bg-[#FAE7F4] text-[#9B2FAC]',
}

// Figma sets the Submitted/Overdue badges at 14px (My Assignments and the course player); Pending/In progress stay 16px.
const badgeTextSize = computed(() =>
  ['submitted', 'overdue'].includes(props.assignment.status)
    ? 'text-sm leading-normal'
    : 'text-base',
)

const badgeLabel: Record<Assignment['status'], string> = {
  pending: 'Pending',
  'in-progress': 'In progress',
  submitted: 'Submitted',
  overdue: 'Overdue',
}
</script>

<template>
  <div
    class="flex w-full flex-col rounded-lg bg-blue-100"
    :class="openInCourseHref ? 'gap-9 px-24 py-10' : 'gap-6 p-6'"
  >
    <div class="flex items-start gap-6">
      <div class="flex flex-1 flex-col gap-3">
        <p
          v-if="courseTitle"
          class="text-2xl leading-tight font-medium tracking-[-0.02em] text-black"
        >
          Course: {{ courseTitle }}
        </p>
        <p v-else class="text-xl text-black">Assignment</p>
        <p v-if="lessonTitle" class="text-base text-[#646D89]">{{ lessonTitle }}</p>
      </div>
      <span
        class="shrink-0 rounded px-2 py-1 font-medium"
        :class="[badgeClasses[assignment.status], badgeTextSize]"
      >
        {{ badgeLabel[assignment.status] }}
      </span>
    </div>

    <!-- My Assignments context: textarea/answer + actions share one bordered card.
         Figma draws the Pending field at 96px and the other editable states at 120px. -->
    <template v-if="openInCourseHref">
      <template v-if="isEditable">
        <div class="flex items-end gap-6 rounded-lg bg-white p-6 ring-1 ring-[#D6D9E4] ring-inset">
          <div class="flex flex-1 flex-col gap-1">
            <p class="text-base text-black">{{ assignment.question }}</p>
            <textarea
              v-model="draftAnswer"
              rows="4"
              placeholder="Answer..."
              :class="assignment.status === 'pending' ? 'h-24' : 'h-30'"
              class="w-full resize-none rounded-lg py-3 pr-4 pl-3 text-base text-black ring-1 ring-[#D6D9E4] outline-none ring-inset placeholder:text-[#9AA1B9] focus:ring-blue-500"
            ></textarea>
          </div>
          <div class="flex w-34.25 shrink-0 flex-col items-stretch gap-4">
            <button
              type="button"
              class="w-full cursor-pointer rounded-xl bg-blue-600 px-8 py-4.5 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-blue-700 active:scale-95"
              @click="handleSubmit"
            >
              Submit
            </button>
            <RouterLink
              :to="openInCourseHref"
              class="flex h-8 items-center justify-center rounded-2xl px-2 py-1 text-base font-bold text-blue-600 transition-colors duration-200 hover:text-blue-700"
            >
              Open in Course
            </RouterLink>
          </div>
        </div>
      </template>
      <div
        v-else
        class="flex items-center gap-6 rounded-lg bg-white p-6 ring-1 ring-[#D6D9E4] ring-inset"
      >
        <div class="flex flex-1 flex-col gap-1">
          <p class="text-base text-black">{{ assignment.question }}</p>
          <p class="min-h-30 py-3 pr-4 pl-3 text-base whitespace-pre-wrap text-[#9AA1B9]">
            {{ assignment.answer }}
          </p>
        </div>
        <RouterLink
          :to="openInCourseHref"
          class="flex h-8 w-34.25 shrink-0 items-center justify-center rounded-2xl px-2 py-1 text-base font-bold text-blue-600 transition-colors duration-200 hover:text-blue-700"
        >
          Open in Course
        </RouterLink>
      </div>
    </template>

    <!-- Course player context: textarea box, then a separate action row below -->
    <template v-else-if="isEditable">
      <div class="flex flex-col gap-1">
        <p class="text-base text-black">{{ assignment.question }}</p>
        <textarea
          v-model="draftAnswer"
          rows="3"
          placeholder="Answer..."
          class="w-full rounded-lg border border-[#D6D9E4] bg-white p-3 text-base text-black transition-colors duration-200 outline-none placeholder:text-[#9AA1B9] focus:border-blue-500"
        ></textarea>
      </div>
      <div class="flex items-center justify-between gap-6">
        <button
          type="button"
          class="cursor-pointer rounded-xl bg-blue-600 px-8 py-4.5 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:bg-blue-700 active:scale-95"
          @click="handleSubmit"
        >
          Send Assignment
        </button>
        <span class="text-base text-[#646D89]">{{ assignment.deadlineLabel }}</span>
      </div>
    </template>

    <div v-else class="flex flex-col gap-4">
      <p class="text-base text-black">{{ assignment.question }}</p>
      <p class="text-base whitespace-pre-wrap text-[#646D89]" v-text="assignment.answer"></p>
    </div>
  </div>
</template>
