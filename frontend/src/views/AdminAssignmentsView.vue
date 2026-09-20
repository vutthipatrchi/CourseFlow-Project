<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AssignmentTable from '@/components/admin/AssignmentTable.vue'
import { deleteAssignment, listAssignments } from '@/api/assignments'
import { toApiError } from '@/api/client'
import type { Assignment } from '@/types/assignment'

const assignments = ref<Assignment[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const search = ref('')
const pendingDeletion = ref<Assignment | null>(null)
const deleteError = ref<string | null>(null)

const filteredAssignments = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return assignments.value
  return assignments.value.filter((a) =>
    [a.description, a.courseName, a.lessonName, a.subLessonName].some((field) =>
      field.toLowerCase().includes(term),
    ),
  )
})

async function loadAssignments() {
  loading.value = true
  try {
    assignments.value = await listAssignments()
  } catch (err) {
    error.value = toApiError(err).message
  } finally {
    loading.value = false
  }
}

onMounted(loadAssignments)

function requestDeletion(assignment: Assignment) {
  deleteError.value = null
  pendingDeletion.value = assignment
}

function cancelDeletion() {
  pendingDeletion.value = null
}

async function confirmDeletion() {
  const assignment = pendingDeletion.value
  if (!assignment) return

  try {
    await deleteAssignment(assignment.id)
    pendingDeletion.value = null
    await loadAssignments()
  } catch (err) {
    deleteError.value = toApiError(err).message
  }
}
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

    <AssignmentTable
      :assignments="filteredAssignments"
      :loading="loading"
      :error="error"
      @delete="requestDeletion"
    />

    <div
      v-if="pendingDeletion"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      @click.self="cancelDeletion"
    >
      <section
        class="w-full max-w-md rounded-2xl bg-white p-8"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-assignment-title"
      >
        <div class="flex items-center justify-between">
          <h2 id="delete-assignment-title" class="text-xl font-bold text-[#2A2E3F]">
            Confirmation
          </h2>
          <button type="button" aria-label="Close" @click="cancelDeletion">
            <svg viewBox="0 0 24 24" fill="none" class="h-6 w-6 stroke-[#646D89]" stroke-width="1.5">
              <path d="m7 7 10 10M17 7 7 17" stroke-linecap="round" />
            </svg>
          </button>
        </div>
        <hr class="my-4 border-[#D6D9E4]" />
        <p class="text-base text-[#646D89]">Are you sure you want to delete this assignment?</p>
        <p v-if="deleteError" class="mt-2 text-sm text-red-600">{{ deleteError }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="flex h-12 items-center justify-center rounded-xl border border-[#D6D9E4] px-6 text-base font-bold text-[#424C6B] hover:bg-[#F1F2F6]"
            @click="cancelDeletion"
          >
            Cancel
          </button>
          <button
            type="button"
            class="flex h-12 items-center justify-center rounded-xl bg-red-600 px-6 text-base font-bold text-white hover:bg-red-700"
            @click="confirmDeletion"
          >
            Delete
          </button>
        </div>
      </section>
    </div>
  </AdminLayout>
</template>
