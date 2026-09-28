<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { CreateAssignmentPayload, SubLessonOption } from '@/types/assignment'

const props = defineProps<{
  subLessonOptions: SubLessonOption[]
  submitting: boolean
  fieldErrors?: Record<string, string>
  initialValue?: { subLessonId: number; description: string; durationDays: number | null } | null
}>()

const emit = defineEmits<{
  submit: [payload: CreateAssignmentPayload]
}>()

const selectedCourse = ref<string | null>(null)
const selectedLesson = ref<string | null>(null)
const subLessonId = ref<number | null>(null)
const description = ref('')
const durationDays = ref<number | null>(null)
const localError = ref<string | null>(null)

const courses = computed(() => [...new Set(props.subLessonOptions.map((o) => o.courseName))])

const lessons = computed(() => [
  ...new Set(
    props.subLessonOptions
      .filter((o) => o.courseName === selectedCourse.value)
      .map((o) => o.lessonName),
  ),
])

const subLessons = computed(() =>
  props.subLessonOptions.filter(
    (o) => o.courseName === selectedCourse.value && o.lessonName === selectedLesson.value,
  ),
)

// Bound to the <select>s' native `change` event rather than a `watch` on the
// refs, so hydrating an existing assignment (below) can set course/lesson/
// sub-lesson together without this cascade wiping out what it just set.
function handleCourseChange() {
  selectedLesson.value = null
  subLessonId.value = null
}

function handleLessonChange() {
  subLessonId.value = null
}

watch(
  () => [props.subLessonOptions, props.initialValue] as const,
  ([options, initialValue]) => {
    if (!initialValue) return
    const match = options.find((option) => option.subLessonId === initialValue.subLessonId)
    if (match) {
      selectedCourse.value = match.courseName
      selectedLesson.value = match.lessonName
      subLessonId.value = match.subLessonId
    }
    description.value = initialValue.description
    durationDays.value = initialValue.durationDays
  },
  { immediate: true },
)

function handleSubmit() {
  localError.value = null

  if (subLessonId.value === null) {
    localError.value = 'Select a course, lesson and sub-lesson.'
    return
  }
  if (!description.value.trim()) {
    localError.value = 'Assignment is required.'
    return
  }

  emit('submit', {
    subLessonId: subLessonId.value,
    description: description.value.trim(),
    durationDays: durationDays.value || null,
  })
}
</script>

<template>
  <form id="assignment-form" class="mx-auto max-w-230 space-y-10" @submit.prevent="handleSubmit">
    <p v-if="localError" class="text-sm text-red-600">{{ localError }}</p>

    <div class="flex max-w-110 flex-col gap-1">
      <label for="course" class="text-base text-black">Course</label>
      <select
        id="course"
        v-model="selectedCourse"
        class="h-12 rounded-lg border border-[#D6D9E4] pt-3 pr-11 pb-3 pl-3 text-base text-black"
        @change="handleCourseChange"
      >
        <option :value="null" disabled>Select a course</option>
        <option v-for="course in courses" :key="course" :value="course">{{ course }}</option>
      </select>
    </div>

    <div class="grid grid-cols-1 gap-10 sm:grid-cols-2">
      <div class="flex flex-col gap-1">
        <label for="lesson" class="text-base text-black">Lesson</label>
        <select
          id="lesson"
          v-model="selectedLesson"
          :disabled="!selectedCourse"
          class="h-12 rounded-lg border border-[#D6D9E4] pt-3 pr-11 pb-3 pl-3 text-base text-black disabled:bg-gray-50"
          @change="handleLessonChange"
        >
          <option :value="null" disabled>Select a lesson</option>
          <option v-for="lesson in lessons" :key="lesson" :value="lesson">{{ lesson }}</option>
        </select>
      </div>

      <div class="flex flex-col gap-1">
        <label for="sub-lesson" class="text-base text-black">Sub-lesson</label>
        <select
          id="sub-lesson"
          v-model.number="subLessonId"
          :disabled="!selectedLesson"
          class="h-12 rounded-lg border border-[#D6D9E4] pt-3 pr-11 pb-3 pl-3 text-base text-black disabled:bg-gray-50"
        >
          <option :value="null" disabled>Select a sub-lesson</option>
          <option
            v-for="option in subLessons"
            :key="option.subLessonId"
            :value="option.subLessonId"
          >
            {{ option.subLessonName }}
          </option>
        </select>
        <p v-if="props.fieldErrors?.subLessonId" class="text-sm text-red-600">
          {{ props.fieldErrors.subLessonId }}
        </p>
      </div>
    </div>

    <hr class="border-t border-[#D6D9E4]" />

    <p class="text-xl font-semibold text-[#646D89]">Assignment detail</p>

    <div class="flex flex-col gap-1">
      <label for="description" class="text-base text-black">Assignment *</label>
      <input
        id="description"
        v-model="description"
        type="text"
        class="h-12 rounded-lg border border-[#D6D9E4] pt-3 pr-4 pb-3 pl-3 text-base text-black"
      />
      <p v-if="props.fieldErrors?.description" class="text-sm text-red-600">
        {{ props.fieldErrors.description }}
      </p>
    </div>

    <div class="flex max-w-110 flex-col gap-1">
      <label for="duration-days" class="text-base text-black">Assign within (days, optional)</label>
      <input
        id="duration-days"
        v-model.number="durationDays"
        type="number"
        min="1"
        class="h-12 rounded-lg border border-[#D6D9E4] pt-3 pr-4 pb-3 pl-3 text-base text-black"
      />
      <p v-if="props.fieldErrors?.durationDays" class="text-sm text-red-600">
        {{ props.fieldErrors.durationDays }}
      </p>
    </div>
  </form>
</template>

<style scoped>
select {
  appearance: none;
  background-image: url('@/assets/landing/arrow_drop_down_black.svg');
  background-repeat: no-repeat;
  /* Figma: 20px icon frame 16px from the edge, glyph inset 5.83px within it */
  background-position: right 21px center;
  background-size: 9px 5px;
}
</style>
