<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { authorizeVideoPlayback, isProtectedVideoUrl } from '@/api/uploads'

const props = defineProps<{ src: string }>()
const emit = defineEmits<{ error: [] }>()
const playable = ref('')
let request = 0
let renewal: ReturnType<typeof setInterval> | undefined

watch(
  () => props.src,
  async (source) => {
    const current = ++request
    clearInterval(renewal)
    playable.value = ''
    if (!source) return
    if (!isProtectedVideoUrl(source)) {
      playable.value = source
      return
    }
    try {
      await authorizeVideoPlayback(source)
      if (current !== request) return
      playable.value = source
      renewal = setInterval(
        () => {
          void authorizeVideoPlayback(source).catch(() => {
            if (current === request) emit('error')
          })
        },
        10 * 60 * 1000,
      )
    } catch {
      if (current === request) emit('error')
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  request++
  clearInterval(renewal)
})
</script>

<template>
  <video v-if="playable" :src="playable" @error="emit('error')" />
</template>
