<script setup lang="ts">
import { ref } from 'vue'
import type { AssignmentStatus, CreateAssignmentPayload, SubLessonOption } from '@/types/assignment'

const props = defineProps<{
  subLessonOptions: SubLessonOption[]
  submitting: boolean
  fieldErrors?: Record<string, string>
}>()

const emit = defineEmits<{
  submit: [payload: CreateAssignmentPayload]
  cancel: []
}>()

const subLessonId = ref<number | null>(null)
const description = ref('')
const durationDays = ref(1)
const status = ref<AssignmentStatus>('draft')
const localError = ref<string | null>(null)

function optionLabel(option: SubLessonOption): string {
  return `${option.courseName} / ${option.lessonName} / ${option.subLessonName}`
}

function handleSubmit() {
  localError.value = null

  if (subLessonId.value === null) {
    localError.value = 'Select a sub-lesson.'
    return
  }
  if (!description.value.trim()) {
    localError.value = 'Description is required.'
    return
  }

  emit('submit', {
    subLessonId: subLessonId.value,
    description: description.value.trim(),
    durationDays: durationDays.value,
    status: status.value,
  })
}
</script>

<template>
  <form class="space-y-5" @submit.prevent="handleSubmit">
    <p v-if="localError" class="text-sm text-red-600">{{ localError }}</p>

    <div>
      <label for="sub-lesson" class="block text-sm font-medium text-gray-700">Sub-lesson</label>
      <select
        id="sub-lesson"
        v-model.number="subLessonId"
        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option :value="null" disabled>Select a sub-lesson</option>
        <option
          v-for="option in props.subLessonOptions"
          :key="option.subLessonId"
          :value="option.subLessonId"
        >
          {{ optionLabel(option) }}
        </option>
      </select>
      <p v-if="props.fieldErrors?.subLessonId" class="mt-1 text-sm text-red-600">
        {{ props.fieldErrors.subLessonId }}
      </p>
    </div>

    <div>
      <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
      <textarea
        id="description"
        v-model="description"
        rows="4"
        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      ></textarea>
      <p v-if="props.fieldErrors?.description" class="mt-1 text-sm text-red-600">
        {{ props.fieldErrors.description }}
      </p>
    </div>

    <div>
      <label for="duration-days" class="block text-sm font-medium text-gray-700"
        >Duration (days)</label
      >
      <input
        id="duration-days"
        v-model.number="durationDays"
        type="number"
        min="1"
        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <p v-if="props.fieldErrors?.durationDays" class="mt-1 text-sm text-red-600">
        {{ props.fieldErrors.durationDays }}
      </p>
    </div>

    <div>
      <label for="status" class="block text-sm font-medium text-gray-700">Status</label>
      <select
        id="status"
        v-model="status"
        class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="draft">Draft</option>
        <option value="published">Published</option>
      </select>
    </div>

    <div class="flex gap-3">
      <button
        type="submit"
        :disabled="submitting"
        class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {{ submitting ? 'Saving...' : 'Create assignment' }}
      </button>
      <button
        type="button"
        class="rounded-lg border-2 border-orange-500 bg-white px-5 py-2.5 text-sm font-semibold text-orange-500 hover:bg-orange-500 hover:text-white"
        @click="emit('cancel')"
      >
        Cancel
      </button>
    </div>
  </form>
</template>
