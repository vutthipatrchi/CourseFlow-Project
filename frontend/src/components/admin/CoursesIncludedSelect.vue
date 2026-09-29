<script setup lang="ts">
import { ref, watch } from 'vue'

interface CourseChoice {
  id: number
  name: string
}

const props = defineProps<{
  modelValue: number[]
  courses: CourseChoice[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number[]]
}>()

const isOpen = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const allChecked = ref(props.modelValue.length === 0)
const selected = ref<Set<number>>(new Set(props.modelValue))

watch(
  () => props.modelValue,
  (value) => {
    allChecked.value = value.length === 0
    selected.value = new Set(value)
  },
)

function emitUpdate() {
  emit('update:modelValue', allChecked.value ? [] : Array.from(selected.value))
}

function toggleOpen() {
  if (isOpen.value) {
    closeAndNormalize()
  } else {
    isOpen.value = true
  }
}

function closeAndNormalize() {
  isOpen.value = false
  if (!allChecked.value && selected.value.size === 0) {
    allChecked.value = true
    emitUpdate()
  }
}

function handleFocusOut(event: FocusEvent) {
  const related = event.relatedTarget as Node | null
  if (rootEl.value && (!related || !rootEl.value.contains(related))) {
    closeAndNormalize()
  }
}

function toggleAll(checked: boolean) {
  allChecked.value = checked
  if (checked) selected.value = new Set()
  emitUpdate()
}

function toggleCourse(id: number, checked: boolean) {
  const next = new Set(selected.value)
  if (checked) {
    next.add(id)
    allChecked.value = false
  } else {
    next.delete(id)
  }
  selected.value = next
  emitUpdate()
}

function removeChip(id: number) {
  const next = new Set(selected.value)
  next.delete(id)
  selected.value = next
  if (next.size === 0) allChecked.value = true
  emitUpdate()
}

function courseName(id: number): string {
  return props.courses.find((course) => course.id === id)?.name ?? String(id)
}
</script>

<template>
  <div ref="rootEl" class="relative" @focusout="handleFocusOut">
    <button
      type="button"
      class="flex min-h-12 w-full flex-wrap items-center gap-2 rounded-lg border border-[#D6D9E4] px-3 py-2 text-left text-base text-black"
      @click="toggleOpen"
    >
      <span v-if="allChecked" class="text-[#646D89]">All courses</span>
      <template v-else>
        <span
          v-for="id in selected"
          :key="id"
          class="flex items-center gap-1 rounded-full bg-[#F1F2F6] px-2 py-1 text-xs text-[#424C6B]"
        >
          {{ courseName(id) }}
          <span
            role="button"
            tabindex="0"
            :aria-label="`Remove ${courseName(id)}`"
            class="text-[#646D89] hover:text-[#424C6B]"
            @click.stop="removeChip(id)"
          >
            &times;
          </span>
        </span>
      </template>
    </button>

    <div
      v-if="isOpen"
      class="absolute z-10 mt-1 w-full rounded-lg border border-[#D6D9E4] bg-white p-2 shadow-lg"
    >
      <label class="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[#F1F2F6]">
        <input
          type="checkbox"
          :checked="allChecked"
          @change="toggleAll(($event.target as HTMLInputElement).checked)"
        />
        All courses
      </label>
      <label
        v-for="course in courses"
        :key="course.id"
        class="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[#F1F2F6]"
      >
        <input
          type="checkbox"
          :checked="selected.has(course.id)"
          @change="toggleCourse(course.id, ($event.target as HTMLInputElement).checked)"
        />
        {{ course.name }}
      </label>
    </div>
  </div>
</template>
