<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../components/admin/AdminLayout.vue'
import { createLesson, deleteLesson, fetchLesson, updateLesson } from '../api/lessons'
import {
  emptySubLesson,
  toFormSubLessons,
  type SubLessonFormItem,
} from '../types/lesson'

const route = useRoute()
const router = useRouter()

const courseId = computed(() => Number(route.params.courseId))
const lessonIdParam = computed(() => route.params.lessonId)
const isCreate = computed(() => route.name === 'admin-lesson-create')

const courseName = ref('Service Design Essentials')
const lessonName = ref('')
const subLessons = ref<SubLessonFormItem[]>([emptySubLesson()])
const loading = ref(!isCreate.value)
const saving = ref(false)
const errorMessage = ref('')
const usingDemoData = ref(false)

const pageTitle = computed(() => (isCreate.value ? 'Add Lesson' : 'Edit Lesson'))
const breadcrumb = computed(() => {
  const lessonLabel = lessonName.value || 'Introduction'
  return `Course '${courseName.value}' / ${isCreate.value ? lessonLabel : `Lesson '${lessonLabel}'`}`
})

onMounted(async () => {
  if (isCreate.value) return
  const lessonId = Number(lessonIdParam.value)
  if (!Number.isFinite(lessonId)) {
    errorMessage.value = 'Invalid lesson id'
    loading.value = false
    return
  }
  try {
    const detail = await fetchLesson(lessonId)
    lessonName.value = detail.name
    subLessons.value = detail.subLessons.length
      ? toFormSubLessons(detail.subLessons)
      : [emptySubLesson()]
  } catch {
    // Backend lesson APIs need profile=local + Postgres. Show demo data so the
    // sub-lesson UI is still reviewable while that is unavailable.
    usingDemoData.value = true
    lessonName.value = 'Introduction'
    subLessons.value = toFormSubLessons([
      {
        id: 1,
        name: 'Welcome to the Course',
        videoUrl: 'https://example.com/videos/welcome.mp4',
        position: 1,
      },
      {
        id: 2,
        name: 'Course Overview',
        videoUrl: 'https://example.com/videos/overview.mp4',
        position: 2,
      },
      {
        id: 3,
        name: 'Getting to Know You',
        videoUrl: 'https://example.com/videos/getting-to-know-you.mp4',
        position: 3,
      },
      {
        id: 4,
        name: 'What is Service Design ?',
        videoUrl: 'https://example.com/videos/what-is-service-design.mp4',
        position: 4,
      },
    ])
  } finally {
    loading.value = false
  }
})

function addSubLesson() {
  subLessons.value.push(emptySubLesson())
}

function removeSubLesson(localKey: string) {
  if (subLessons.value.length === 1) {
    subLessons.value = [emptySubLesson()]
    return
  }
  subLessons.value = subLessons.value.filter((item) => item.localKey !== localKey)
}

function onVideoSelected(item: SubLessonFormItem, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  // Upload storage is not wired yet — keep a local object URL as the videoUrl.
  item.videoUrl = URL.createObjectURL(file)
}

function validate(): string | null {
  if (!lessonName.value.trim()) return 'Lesson name is required'
  for (const [index, item] of subLessons.value.entries()) {
    if (!item.name.trim()) return `Sub-lesson ${index + 1}: name is required`
    if (!item.videoUrl.trim()) return `Sub-lesson ${index + 1}: video is required`
  }
  return null
}

async function save() {
  errorMessage.value = ''
  const validationError = validate()
  if (validationError) {
    errorMessage.value = validationError
    return
  }
  saving.value = true
  try {
    const payload = {
      name: lessonName.value.trim(),
      subLessons: subLessons.value.map((item) => ({
        id: item.id,
        name: item.name.trim(),
        videoUrl: item.videoUrl.trim(),
      })),
    }
    if (isCreate.value) {
      const created = await createLesson(courseId.value, {
        name: payload.name,
        subLessons: payload.subLessons.map(({ name, videoUrl }) => ({ name, videoUrl })),
      })
      await router.push({
        name: 'admin-lesson-edit',
        params: { courseId: String(courseId.value), lessonId: String(created.id) },
      })
      return
    }
    await updateLesson(Number(lessonIdParam.value), payload)
  } catch (error) {
    errorMessage.value =
      error instanceof Error
        ? `${error.message} (API needs backend profile local + database)`
        : 'Save failed'
  } finally {
    saving.value = false
  }
}

function cancel() {
  router.push({ name: 'home' })
}

async function onDeleteLesson() {
  if (isCreate.value) return
  if (!window.confirm('Delete this lesson and all of its sub-lessons?')) return
  try {
    await deleteLesson(Number(lessonIdParam.value))
    router.push({ name: 'admin-lesson-create', params: { courseId: String(courseId.value) } })
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Delete failed'
  }
}
</script>

<template>
  <AdminLayout :title="pageTitle" :breadcrumb="breadcrumb">
    <template #actions>
      <button
        type="button"
        class="rounded-xl border border-[#F47E20] px-8 py-3 text-base font-bold text-[#F47E20]"
        @click="cancel"
      >
        Cancel
      </button>
      <button
        type="button"
        class="rounded-xl bg-[#2F5FAC] px-8 py-3 text-base font-bold text-white disabled:opacity-60"
        :disabled="saving || loading"
        @click="save"
      >
        {{ isCreate ? 'Create' : 'Edit' }}
      </button>
    </template>

    <div v-if="loading" class="text-[#646D89]">Loading lesson…</div>

    <div v-else class="flex flex-col gap-6">
      <p
        v-if="usingDemoData"
        class="rounded-xl border border-[#F1C40F]/40 bg-[#FFF8E1] px-4 py-3 text-sm text-[#7A5B00]"
      >
        Showing demo sub-lessons because the lesson API is unavailable (start Postgres + backend
        with profile <code>local</code> to save for real).
      </p>
      <p v-if="errorMessage" class="rounded-xl bg-[#FDECEC] px-4 py-3 text-sm text-[#C0392B]">
        {{ errorMessage }}
      </p>

      <section class="rounded-2xl bg-white p-10 shadow-sm">
        <label class="mb-10 flex flex-col gap-1">
          <span class="text-base font-normal text-[#424C6B]">Lesson name *</span>
          <input
            v-model="lessonName"
            type="text"
            class="h-12 rounded-lg border border-[#D6D9E4] px-4 text-base text-[#2A2E3F] outline-none focus:border-[#2F5FAC]"
          />
        </label>

        <h2 class="mb-6 text-xl font-semibold text-[#2A2E3F]">Sub-Lesson</h2>

        <div class="flex flex-col gap-4">
          <article
            v-for="item in subLessons"
            :key="item.localKey"
            class="flex gap-4 rounded-xl bg-[#F6F7FC] p-6"
          >
            <div class="pt-8 text-[#9AA1B9]" aria-hidden="true">⋮⋮</div>
            <div class="flex min-w-0 flex-1 flex-col gap-4">
              <div class="flex items-start justify-between gap-4">
                <label class="flex min-w-0 flex-1 flex-col gap-1">
                  <span class="text-base text-[#424C6B]">Sub-lesson name *</span>
                  <input
                    v-model="item.name"
                    type="text"
                    class="h-12 rounded-lg border border-[#D6D9E4] bg-white px-4 text-base text-[#2A2E3F] outline-none focus:border-[#2F5FAC]"
                  />
                </label>
                <button
                  type="button"
                  class="pt-7 text-base font-medium text-[#2F5FAC]"
                  @click="removeSubLesson(item.localKey)"
                >
                  Delete
                </button>
              </div>

              <div class="flex flex-col gap-2">
                <span class="text-base text-[#424C6B]">Video *</span>
                <label
                  class="flex h-40 w-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#D6D9E4] bg-[#EFF0F6] text-[#9AA1B9]"
                >
                  <template v-if="item.videoUrl">
                    <span class="px-3 text-center text-xs break-all text-[#2F5FAC]">Video set</span>
                    <span class="px-3 text-center text-[10px] break-all text-[#646D89]">{{
                      item.videoUrl
                    }}</span>
                  </template>
                  <template v-else>
                    <span class="text-3xl leading-none">+</span>
                    <span class="text-sm">Upload Video</span>
                  </template>
                  <input
                    type="file"
                    accept="video/*"
                    class="hidden"
                    @change="onVideoSelected(item, $event)"
                  />
                </label>
              </div>
            </div>
          </article>
        </div>

        <button
          type="button"
          class="mt-6 w-full rounded-xl border border-[#F47E20] py-3 text-base font-bold text-[#F47E20]"
          @click="addSubLesson"
        >
          + Add Sub-lesson
        </button>
      </section>

      <div v-if="!isCreate" class="flex justify-end">
        <button type="button" class="text-base font-medium text-[#2F5FAC]" @click="onDeleteLesson">
          Delete Lesson
        </button>
      </div>
    </div>
  </AdminLayout>
</template>
