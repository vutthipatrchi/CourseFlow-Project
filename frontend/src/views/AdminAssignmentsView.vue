<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AssignmentTable from '@/components/admin/AssignmentTable.vue'
import { listAssignments } from '@/api/assignments'
import { toApiError } from '@/api/client'
import type { Assignment } from '@/types/assignment'

const assignments = ref<Assignment[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

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
  <AdminLayout>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Assignments</h1>
      <RouterLink
        :to="{ name: 'admin-assignment-create' }"
        class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        New assignment
      </RouterLink>
    </div>
    <AssignmentTable :assignments="assignments" :loading="loading" :error="error" />
  </AdminLayout>
</template>
