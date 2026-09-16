<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AssignmentForm from '@/components/admin/AssignmentForm.vue'
import { createAssignment, listSubLessonOptions } from '@/api/assignments'
import { toApiError } from '@/api/client'
import type { CreateAssignmentPayload, SubLessonOption } from '@/types/assignment'

const router = useRouter()

const subLessonOptions = ref<SubLessonOption[]>([])
const submitting = ref(false)
const serverFieldErrors = ref<Record<string, string> | undefined>(undefined)
const serverError = ref<string | null>(null)

onMounted(async () => {
  try {
    subLessonOptions.value = await listSubLessonOptions()
  } catch (err) {
    serverError.value = toApiError(err).message
  }
})

async function handleSubmit(payload: CreateAssignmentPayload) {
  submitting.value = true
  serverError.value = null
  serverFieldErrors.value = undefined

  try {
    await createAssignment(payload)
    router.push({ name: 'admin-assignments' })
  } catch (err) {
    const apiError = toApiError(err)
    serverError.value = apiError.message
    serverFieldErrors.value = apiError.fieldErrors
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  router.push({ name: 'admin-assignments' })
}
</script>

<template>
  <AdminLayout>
    <h1 class="mb-6 text-2xl font-semibold text-gray-900">New assignment</h1>
    <p v-if="serverError" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
      {{ serverError }}
    </p>
    <AssignmentForm
      :sub-lesson-options="subLessonOptions"
      :submitting="submitting"
      :field-errors="serverFieldErrors"
      @submit="handleSubmit"
      @cancel="handleCancel"
    />
  </AdminLayout>
</template>
