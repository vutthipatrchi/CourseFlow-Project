<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { DemoLesson } from '@/types/course'
import { DEMO_VIDEO_LABEL, DEMO_VIDEO_URL } from '@/data/demoVideo'
import LessonReading from './LessonReading.vue'

defineProps<{ lesson: DemoLesson }>()

const expanded = ref(false)
const videoFailed = ref(false)
const video = ref<HTMLVideoElement | null>(null)

onBeforeUnmount(() => video.value?.pause())

function toggle(event: Event) {
  expanded.value = (event.currentTarget as HTMLDetailsElement).open
  if (!expanded.value) {
    video.value?.pause()
    videoFailed.value = false
  }
}
</script>

<template>
  <details class="rounded-xl border border-[#D6D9E4] bg-white" @toggle="toggle">
    <summary
      class="cursor-pointer rounded-xl p-4 text-blue-700 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span class="font-medium text-gray-900">{{ lesson.title }}</span>
      <span class="mt-2 block text-sm font-semibold">Preview lesson · Reading and sample clip</span>
    </summary>
    <div v-if="expanded" class="space-y-4 px-3 pb-4 sm:px-4">
      <figure class="space-y-3">
        <video
          ref="video"
          :src="DEMO_VIDEO_URL"
          :aria-label="`Sample clip for ${lesson.title}`"
          controls
          playsinline
          preload="metadata"
          class="aspect-video w-full rounded-lg bg-black"
          @error="videoFailed = true"
        />
        <figcaption class="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          {{ DEMO_VIDEO_LABEL }}
        </figcaption>
        <p v-if="videoFailed" role="alert" class="text-sm text-amber-900">
          Unable to load the sample clip. You can still read the sample below.
        </p>
      </figure>
      <LessonReading :lesson="lesson" />
    </div>
  </details>
</template>
