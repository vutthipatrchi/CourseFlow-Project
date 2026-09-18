<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AssignmentTable from '@/components/admin/AssignmentTable.vue'
import { listAssignments } from '@/api/assignments'
import { toApiError } from '@/api/client'
import type { Assignment } from '@/types/assignment'

const assignments = ref<Assignment[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')

const filteredAssignments = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return assignments.value
  return assignments.value.filter((a) =>
    [a.description, a.courseName, a.lessonName, a.subLessonName].some((field) =>
      field.toLowerCase().includes(term),
    ),
  )
})

onMounted(async () => {
  try {
    assignments.value = await listAssignments()
  } catch (err) {
    error.value = toApiError(err).message
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AdminLayout title="Assignments">
    <template #actions>
      <div
        class="flex h-12 w-80 items-center gap-2.5 rounded-lg border border-[#CCD0D7] bg-white px-4"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          class="h-6 w-6 flex-none stroke-[#646D89]"
          stroke-width="1.5"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-3.8-3.8" stroke-linecap="round" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search..."
          class="w-full text-base text-[#2A2E3F] placeholder:text-[#9AA1B9] focus:outline-none"
        />
      </div>
      <RouterLink
        :to="{ name: 'admin-assignment-create' }"
        class="flex h-[60px] items-center justify-center rounded-xl bg-[#2F5FAC] px-8 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] hover:bg-[#274e93]"
      >
        + Add Assignment
      </RouterLink>
    </template>

    <AssignmentTable :assignments="filteredAssignments" :loading="loading" :error="error" />
  </AdminLayout>
</template>
