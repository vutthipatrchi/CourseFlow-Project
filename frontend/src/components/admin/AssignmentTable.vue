<script setup lang="ts">
import type { Assignment } from '@/types/assignment'

defineProps<{
  assignments: Assignment[]
  loading: boolean
  error: string | null
}>()

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="overflow-hidden rounded-lg bg-white">
    <table class="min-w-full text-left">
      <thead class="h-[41px] bg-[#E4E6ED] text-sm text-[#424C6B]">
        <tr>
          <th class="w-12 px-6 py-2.5 text-center font-normal">#</th>
          <th class="px-4 py-2.5 font-normal">Assignment detail</th>
          <th class="px-4 py-2.5 font-normal">Course</th>
          <th class="px-4 py-2.5 font-normal">Lesson</th>
          <th class="px-4 py-2.5 font-normal">Sub-lesson</th>
          <th class="px-4 py-2.5 font-normal">Duration</th>
          <th class="px-4 py-2.5 font-normal">Status</th>
          <th class="px-6 py-2.5 font-normal">Created date</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td class="px-4 py-8 text-center text-[#646D89]" colspan="8">Loading assignments…</td>
        </tr>
        <tr v-else-if="error">
          <td class="px-4 py-8 text-center text-red-600" colspan="8">{{ error }}</td>
        </tr>
        <tr v-else-if="assignments.length === 0">
          <td class="px-4 py-8 text-center text-[#646D89]" colspan="8">No assignments yet.</td>
        </tr>
        <tr
          v-for="(assignment, index) in assignments"
          :key="assignment.id"
          class="min-h-[88px] border-b border-[#F1F2F6] text-base text-[#000000]"
        >
          <td class="px-6 py-8 text-center">{{ index + 1 }}</td>
          <td class="max-w-xs truncate px-4 py-8">{{ assignment.description }}</td>
          <td class="px-4 py-8">{{ assignment.courseName }}</td>
          <td class="px-4 py-8">{{ assignment.lessonName }}</td>
          <td class="px-4 py-8">{{ assignment.subLessonName }}</td>
          <td class="px-4 py-8">{{ assignment.durationDays }} day(s)</td>
          <td class="px-4 py-8">
            <span
              class="rounded-full px-2 py-0.5 text-xs font-semibold"
              :class="
                assignment.status === 'published'
                  ? 'bg-utility-green/10 text-utility-green'
                  : 'bg-gray-200 text-gray-700'
              "
            >
              {{ assignment.status }}
            </span>
          </td>
          <td class="px-6 py-8">{{ formatDate(assignment.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
