<script setup lang="ts">
import deleteIcon from '@/assets/admin/delete.svg'
import editIcon from '@/assets/admin/edit.svg'
import type { Assignment } from '@/types/assignment'

defineProps<{
  assignments: Assignment[]
  loading: boolean
  error: string | null
}>()

function formatDate(value: string): string {
  const d = new Date(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  const hours = d.getHours() % 12 || 12
  const period = d.getHours() < 12 ? 'AM' : 'PM'
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(hours)}:${pad(d.getMinutes())}${period}`
}
</script>

<template>
  <div class="overflow-x-auto overflow-hidden rounded-lg bg-white">
    <table class="w-full table-fixed text-left">
      <colgroup>
        <col class="w-[18%]" />
        <col class="w-[18%]" />
        <col class="w-[18%]" />
        <col class="w-[18%]" />
        <col class="w-[18%]" />
        <col class="w-[10%]" />
      </colgroup>
      <thead class="h-[41px] bg-[#E4E6ED] text-sm text-[#424C6B]">
        <tr>
          <th class="truncate px-4 py-2.5 font-normal">Assignment detail</th>
          <th class="truncate px-4 py-2.5 font-normal">Course</th>
          <th class="truncate px-4 py-2.5 font-normal">Lesson</th>
          <th class="truncate px-4 py-2.5 font-normal">Sub-lesson</th>
          <th class="truncate px-4 py-2.5 font-normal">Created date</th>
          <th class="px-4 py-2.5 text-center font-normal">Action</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td class="px-4 py-8 text-center text-[#646D89]" colspan="6">Loading assignments…</td>
        </tr>
        <tr v-else-if="error">
          <td class="px-4 py-8 text-center text-red-600" colspan="6">{{ error }}</td>
        </tr>
        <tr v-else-if="assignments.length === 0">
          <td class="px-4 py-8 text-center text-[#646D89]" colspan="6">No assignments yet.</td>
        </tr>
        <tr
          v-for="assignment in assignments"
          :key="assignment.id"
          class="border-b border-[#F1F2F6] text-base text-[#000000]"
        >
          <td class="truncate px-4 py-8">{{ assignment.description }}</td>
          <td class="truncate px-4 py-8">{{ assignment.courseName }}</td>
          <td class="truncate px-4 py-8">{{ assignment.lessonName }}</td>
          <td class="truncate px-4 py-8">{{ assignment.subLessonName }}</td>
          <td class="truncate px-4 py-8">{{ formatDate(assignment.createdAt) }}</td>
          <td class="px-4 py-8">
            <div class="flex items-center justify-center gap-3">
              <img :src="deleteIcon" alt="Delete (not available yet)" class="h-6 w-6 opacity-50" />
              <img :src="editIcon" alt="Edit (not available yet)" class="h-6 w-6 opacity-50" />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
