<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { Assignment } from '@/types/assignment'

const props = defineProps<{
  open: boolean
  initial?: Assignment | null
}>()

const emit = defineEmits<{
  close: []
  save: [assignment: Pick<Assignment, 'detail' | 'course' | 'lesson' | 'subLesson'>]
}>()

const form = reactive({
  detail: '',
  course: '',
  lesson: '',
  subLesson: '',
})

watch(
  () => [props.open, props.initial] as const,
  ([isOpen, initial]) => {
    if (!isOpen) return
    form.detail = initial?.detail ?? ''
    form.course = initial?.course ?? ''
    form.lesson = initial?.lesson ?? ''
    form.subLesson = initial?.subLesson ?? ''
  },
  { immediate: true },
)

function handleSubmit() {
  emit('save', { ...form })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4"
    @click.self="emit('close')"
  >
    <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
      <h2 class="text-lg font-bold text-gray-900">
        {{ initial ? 'Edit Assignment' : 'Add Assignment' }}
      </h2>

      <form class="mt-4 flex flex-col gap-4" @submit.prevent="handleSubmit">
        <label class="flex flex-col gap-1 text-sm text-gray-700">
          Assignment detail
          <input
            v-model="form.detail"
            required
            name="detail"
            type="text"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label class="flex flex-col gap-1 text-sm text-gray-700">
          Course
          <input
            v-model="form.course"
            required
            name="course"
            type="text"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label class="flex flex-col gap-1 text-sm text-gray-700">
          Lesson
          <input
            v-model="form.lesson"
            required
            name="lesson"
            type="text"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>
        <label class="flex flex-col gap-1 text-sm text-gray-700">
          Sub-lesson
          <input
            v-model="form.subLesson"
            required
            name="subLesson"
            type="text"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </label>

        <div class="mt-2 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
