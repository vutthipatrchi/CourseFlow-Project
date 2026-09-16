<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AddAssignmentModal from '@/components/admin/AddAssignmentModal.vue'
import { fetchAssignments } from '@/services/assignments'
import type { Assignment } from '@/types/assignment'

const assignments = ref<Assignment[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const isModalOpen = ref(false)
const editingAssignment = ref<Assignment | null>(null)

onMounted(async () => {
  assignments.value = await fetchAssignments()
  isLoading.value = false
})

const filteredAssignments = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return assignments.value
  return assignments.value.filter((assignment) =>
    [assignment.detail, assignment.course, assignment.lesson, assignment.subLesson].some((field) =>
      field.toLowerCase().includes(query),
    ),
  )
})

function formatCreatedAt(iso: string): string {
  const date = new Date(iso)
  const datePart = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
  const hours24 = date.getHours()
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const hours12 = hours24 % 12 || 12
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${datePart} ${hours12}:${minutes}${period}`
}

function openEditModal(assignment: Assignment) {
  editingAssignment.value = assignment
  isModalOpen.value = true
}

function closeModal() {
  isModalOpen.value = false
  editingAssignment.value = null
}

function handleSave(form: Pick<Assignment, 'detail' | 'course' | 'lesson' | 'subLesson'>) {
  if (editingAssignment.value) {
    const target = assignments.value.find((a) => a.id === editingAssignment.value?.id)
    if (target) Object.assign(target, form)
  } else {
    assignments.value.unshift({
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...form,
    })
  }
  closeModal()
}

function handleDelete(assignment: Assignment) {
  if (!confirm(`Delete "${assignment.detail}"?`)) return
  assignments.value = assignments.value.filter((a) => a.id !== assignment.id)
}
</script>

<template>
  <AdminLayout>
    <div class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900">Assignments</h1>

      <div class="flex w-full flex-1 flex-wrap items-center justify-end gap-4 sm:w-auto">
        <div class="relative min-w-48 flex-1 sm:max-w-xs sm:flex-none">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M21 21L16.5 16.5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search..."
            aria-label="Search assignments"
            class="w-full rounded-lg border border-gray-300 py-2 pr-3 pl-9 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <RouterLink
          to="/admin/assignments/new"
          class="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <span aria-hidden="true">+</span> Add Assignment
        </RouterLink>
      </div>
    </div>

    <div class="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table class="w-full min-w-max text-left text-sm">
        <thead class="bg-gray-100 text-gray-600">
          <tr>
            <th class="px-4 py-3 font-medium">Assignment detail</th>
            <th class="px-4 py-3 font-medium">Course</th>
            <th class="px-4 py-3 font-medium">Lesson</th>
            <th class="px-4 py-3 font-medium">Sub-lesson</th>
            <th class="px-4 py-3 font-medium">Created date</th>
            <th class="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-if="isLoading">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">Loading assignments…</td>
          </tr>
          <tr v-else-if="filteredAssignments.length === 0">
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">No assignments found.</td>
          </tr>
          <tr v-for="assignment in filteredAssignments" v-else :key="assignment.id">
            <td class="max-w-56 truncate px-4 py-3" :title="assignment.detail">
              {{ assignment.detail }}
            </td>
            <td class="max-w-40 truncate px-4 py-3" :title="assignment.course">
              {{ assignment.course }}
            </td>
            <td class="px-4 py-3">{{ assignment.lesson }}</td>
            <td class="max-w-48 truncate px-4 py-3" :title="assignment.subLesson">
              {{ assignment.subLesson }}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-gray-600">
              {{ formatCreatedAt(assignment.createdAt) }}
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-3">
                <button
                  type="button"
                  class="text-blue-600 hover:text-blue-800"
                  :aria-label="`Delete ${assignment.detail}`"
                  @click="handleDelete(assignment)"
                >
                  <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" aria-hidden="true">
                    <path
                      d="M5 7H19M10 11V16M14 11V16M6 7L7 19A2 2 0 0 0 9 21H15A2 2 0 0 0 17 19L18 7M9 7V4A1 1 0 0 1 10 3H14A1 1 0 0 1 15 4V7"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  class="text-blue-600 hover:text-blue-800"
                  :aria-label="`Edit ${assignment.detail}`"
                  @click="openEditModal(assignment)"
                >
                  <svg viewBox="0 0 24 24" fill="none" class="h-4 w-4" aria-hidden="true">
                    <path
                      d="M4 20L4.5 16.5L16 5C16.83 4.17 18.17 4.17 19 5C19.83 5.83 19.83 7.17 19 8L7.5 19.5L4 20Z"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AddAssignmentModal
      :open="isModalOpen"
      :initial="editingAssignment"
      @close="closeModal"
      @save="handleSave"
    />
  </AdminLayout>
</template>
