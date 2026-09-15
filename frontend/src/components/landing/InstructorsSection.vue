<script setup lang="ts">
interface Instructor {
  name: string
  role: string
  avatarId: number
}

const instructors: Instructor[] = [
  { name: 'Jane Cooper', role: 'UX/UI Designer', avatarId: 47 },
  { name: 'Esther Howard', role: 'Program Manager', avatarId: 12 },
  { name: 'Brooklyn Simmons', role: 'Software Engineer', avatarId: 33 },
]
</script>

<template>
  <section class="mx-auto max-w-6xl px-6 py-16">
    <h2 class="text-center text-2xl font-bold text-gray-900 md:text-3xl">Our Professional Instructors</h2>

    <div class="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
      <div v-for="instructor in instructors" :key="instructor.name" class="text-center">
        <img
          :src="`https://i.pravatar.cc/320?img=${instructor.avatarId}`"
          :alt="instructor.name"
          class="mx-auto h-40 w-40 rounded-2xl object-cover shadow-md"
        />
        <p class="mt-4 font-semibold text-gray-900">{{ instructor.name }}</p>
        <p class="text-sm text-blue-600">{{ instructor.role }}</p>
      </div>
    </div>
  </section>
</template>
