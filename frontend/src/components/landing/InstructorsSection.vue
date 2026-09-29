<script setup lang="ts">
import instructorJane from '@/assets/landing/instructor-jane.jpg'
import instructorEsther from '@/assets/landing/instructor-esther.jpg'
import instructorBrooklyn from '@/assets/landing/instructor-brooklyn.jpg'
import heroTriangle from '@/assets/landing/hero-triangle.svg'

interface Instructor {
  name: string
  role: string
  photo: string
}

const instructors: Instructor[] = [
  { name: 'Jane Cooper', role: 'UX/UI Designer', photo: instructorJane },
  { name: 'Esther Howard', role: 'Program Manager', photo: instructorEsther },
  { name: 'Brooklyn Simmons', role: 'Software Engineer', photo: instructorBrooklyn },
]
</script>

<template>
  <section class="mx-auto max-w-6xl px-6 py-16">
    <h2 class="text-center text-2xl font-bold text-gray-900 md:text-3xl">
      Our Professional Instructors
    </h2>

    <div class="relative mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
      <div v-for="instructor in instructors" :key="instructor.name">
        <img
          :src="instructor.photo"
          :alt="instructor.name"
          class="aspect-357/420 w-full rounded-lg object-cover shadow-md"
        />
        <p class="mt-4 font-semibold text-gray-900">{{ instructor.name }}</p>
        <p class="text-sm text-blue-600">{{ instructor.role }}</p>
      </div>

      <img
        :src="heroTriangle"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute -left-[81px] top-full mt-[81px] hidden h-6 w-7 md:block"
      />
    </div>
  </section>
</template>
