<script setup lang="ts">
import { onMounted, ref } from 'vue'

const status = ref('Checking backend…')

onMounted(async () => {
  try {
    const response = await fetch('/api/health')
    if (!response.ok) throw new Error('Backend request failed')
    const health: { status?: string } = await response.json()
    if (health.status !== 'UP') throw new Error('Backend is not ready')
    status.value = 'Backend connected'
  } catch {
    status.value = 'Backend unavailable — start the Java server on port 8080.'
  }
})
</script>

<template>
  <main>
    <h1>CourseFlow</h1>
    <p>Vue + Java project starter</p>
    <p role="status">{{ status }}</p>
  </main>
</template>

<style scoped>
main {
  max-width: 48rem;
  margin: 4rem auto;
  padding: 1.5rem;
  font-family: system-ui, sans-serif;
}
</style>
