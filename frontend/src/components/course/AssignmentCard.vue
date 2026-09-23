<script setup lang="ts">
// ── AssignmentCard ────────────────────────────────────────────────────────
// Inline assignment block: Pending (question + textarea + submit) or Submitted (read-only)
// แก้ไขได้: badge colors, deadline hint copy, button label

import { ref } from 'vue'
import type { Assignment } from '@/types/course'

type Props = {
  assignment: Assignment
}

const props = defineProps<Props>()

const emit = defineEmits<{ submit: [answer: string] }>()

const draftAnswer = ref('')

const handleSubmit = () => {
  if (!draftAnswer.value.trim()) return
  emit('submit', draftAnswer.value.trim())
}
</script>

<template>
  <div class="flex w-full flex-col gap-6 rounded-lg bg-blue-100 p-6">
    <div class="flex items-start gap-6">
      <p class="flex-1 text-xl text-black">Assignment</p>
      <span
        v-if="assignment.status === 'pending'"
        class="shrink-0 rounded px-2 py-1 text-base font-medium text-[#996500]"
        style="background-color: #fffbdb"
      >
        Pending
      </span>
      <span
        v-else
        class="shrink-0 rounded bg-utility-green/15 px-2 py-1 text-base font-medium text-utility-green"
      >
        Submitted
      </span>
    </div>

    <template v-if="assignment.status === 'pending'">
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
        <span class="text-base text-[#646D89]">{{ props.assignment.deadlineLabel }}</span>
      </div>
    </template>

    <div v-else class="flex flex-col gap-1">
      <p class="text-base text-black">{{ assignment.question }}</p>
      <p class="rounded-lg border border-[#D6D9E4] bg-white p-3 text-base text-[#646D89]">
        {{ assignment.answer }}
      </p>
    </div>
  </div>
</template>
