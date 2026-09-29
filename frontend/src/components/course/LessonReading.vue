<script setup lang="ts">
import type { DemoLesson } from '@/types/course'

defineProps<{ lesson: DemoLesson }>()
</script>

<template>
  <article
    lang="en"
    class="space-y-7 rounded-xl border border-[#D6D9E4] bg-white p-5 text-gray-800 sm:p-8"
  >
    <div class="space-y-3">
      <p class="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
        Practice lesson • Read and try it yourself
      </p>
      <h2 class="text-2xl font-semibold leading-snug">{{ lesson.title }}</h2>
      <p class="leading-8">
        <strong>By the end of this lesson you will:</strong> {{ lesson.objective }}
      </p>
    </div>
    <section aria-label="Lesson content" class="space-y-4 leading-8">
      <p v-for="paragraph in lesson.paragraphs" :key="paragraph">{{ paragraph }}</p>
    </section>
    <section class="space-y-2 rounded-lg bg-blue-50 p-5 leading-8">
      <h3 class="text-lg font-semibold">Example</h3>
      <p>{{ lesson.example }}</p>
    </section>
    <section class="space-y-3 leading-8">
      <h3 class="text-lg font-semibold">Try it yourself</h3>
      <p>{{ lesson.exercise }}</p>
      <p class="text-sm text-gray-500">
        Write your answer before opening the suggested answer. This exercise is not submitted or
        graded.
      </p>
      <details class="rounded-lg border border-[#D6D9E4] p-4">
        <summary
          class="cursor-pointer font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          Show suggested answer
        </summary>
        <p class="mt-3">{{ lesson.solution }}</p>
      </details>
    </section>
  </article>
</template>
