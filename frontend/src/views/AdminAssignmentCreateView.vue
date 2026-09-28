<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/AdminLayout.vue'
import AssignmentForm from '@/components/admin/AssignmentForm.vue'
import {
  createAssignment,
  getAssignment,
  listSubLessonOptions,
  updateAssignment,
} from '@/api/assignments'
import { toApiError } from '@/api/client'
import type { CreateAssignmentPayload, SubLessonOption } from '@/types/assignment'

const route = useRoute()
const router = useRouter()

const assignmentId = computed(() => {
  const id = route.params.id
  return typeof id === 'string' ? Number(id) : null
})
const isEditing = computed(() => assignmentId.value !== null)

const subLessonOptions = ref<SubLessonOption[]>([])
const initialValue = ref<{
  subLessonId: number
  description: string
  durationDays: number | null
} | null>(null)
const loading = ref(isEditing.value)
const submitting = ref(false)
const serverFieldErrors = ref<Record<string, string> | undefined>(undefined)
const serverError = ref<string | null>(null)

onMounted(async () => {
  try {
    subLessonOptions.value = await listSubLessonOptions()
  } catch (err) {
    serverError.value = toApiError(err).message
  }

  if (isEditing.value) {
    try {
      const assignment = await getAssignment(assignmentId.value!)
      initialValue.value = {
        subLessonId: assignment.subLessonId,
        description: assignment.description,
        durationDays: assignment.durationDays,
      }
    } catch (err) {
      serverError.value = toApiError(err).message
    }
  }

  loading.value = false
})

async function handleSubmit(payload: CreateAssignmentPayload) {
  submitting.value = true
  serverError.value = null
  serverFieldErrors.value = undefined

  try {
    if (isEditing.value) {
      await updateAssignment(assignmentId.value!, payload)
    } else {
      await createAssignment(payload)
    }
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
  <AdminLayout :title="isEditing ? 'Edit Assignment' : 'Add Assignment'">
    <template #actions>
      <button
        type="button"
        class="flex h-[60px] items-center justify-center rounded-xl border border-[#F47E20] bg-white px-8 text-base font-bold text-[#F47E20] shadow-[4px_4px_24px_rgba(0,0,0,0.08)] hover:bg-orange-50"
        @click="handleCancel"
      >
        Cancel
      </button>
      <button
        type="submit"
        form="assignment-form"
        :disabled="submitting || loading"
        class="flex h-[60px] items-center justify-center rounded-xl bg-[#2F5FAC] px-8 text-base font-bold text-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] hover:bg-[#274e93] disabled:opacity-60"
      >
        {{ submitting ? 'Saving...' : isEditing ? 'Save' : 'Create' }}
      </button>
    </template>

    <div class="rounded-2xl border border-[#E6E7EB] bg-white pt-10 px-25 pb-15">
      <p v-if="serverError" class="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
        {{ serverError }}
      </p>
      <p v-if="loading" class="text-base text-[#646D89]">Loading assignment…</p>
      <AssignmentForm
        v-else
        :sub-lesson-options="subLessonOptions"
        :submitting="submitting"
        :field-errors="serverFieldErrors"
        :initial-value="initialValue"
        @submit="handleSubmit"
      />
    </div>
  </AdminLayout>
</template>
