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
  <div class="overflow-hidden rounded-lg border border-gray-200 bg-white">
    <table class="min-w-full divide-y divide-gray-200 text-sm">
      <thead class="bg-gray-100">
        <tr>
          <th class="px-4 py-3 text-left font-semibold text-gray-700">Assignment detail</th>
          <th class="px-4 py-3 text-left font-semibold text-gray-700">Course</th>
          <th class="px-4 py-3 text-left font-semibold text-gray-700">Lesson</th>
          <th class="px-4 py-3 text-left font-semibold text-gray-700">Sub-lesson</th>
          <th class="px-4 py-3 text-left font-semibold text-gray-700">Duration</th>
          <th class="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
          <th class="px-4 py-3 text-left font-semibold text-gray-700">Created</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <tr v-if="loading">
          <td class="px-4 py-6 text-center text-gray-500" colspan="7">Loading assignments…</td>
        </tr>
        <tr v-else-if="error">
          <td class="px-4 py-6 text-center text-red-600" colspan="7">{{ error }}</td>
        </tr>
        <tr v-else-if="assignments.length === 0">
          <td class="px-4 py-6 text-center text-gray-500" colspan="7">No assignments yet.</td>
        </tr>
        <tr v-for="assignment in assignments" :key="assignment.id">
          <td class="max-w-xs truncate px-4 py-3 text-gray-900">{{ assignment.description }}</td>
          <td class="px-4 py-3 text-gray-700">{{ assignment.courseName }}</td>
          <td class="px-4 py-3 text-gray-700">{{ assignment.lessonName }}</td>
          <td class="px-4 py-3 text-gray-700">{{ assignment.subLessonName }}</td>
          <td class="px-4 py-3 text-gray-700">{{ assignment.durationDays }} day(s)</td>
          <td class="px-4 py-3">
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
          <td class="px-4 py-3 text-gray-700">{{ formatDate(assignment.createdAt) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
