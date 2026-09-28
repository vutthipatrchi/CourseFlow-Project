<script setup lang="ts">
import type { DemoLesson } from '@/types/course'

defineProps<{ lesson: DemoLesson }>()
</script>

<template>
  <article
    lang="th"
    class="space-y-7 rounded-xl border border-[#D6D9E4] bg-white p-5 text-gray-800 sm:p-8"
  >
    <div class="space-y-3">
      <p class="inline-block rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
        บทเรียนจำลอง • อ่านและฝึกด้วยตนเอง
      </p>
      <h2 class="text-2xl font-semibold leading-snug">{{ lesson.title }}</h2>
      <p class="leading-8"><strong>เมื่อจบบทนี้ คุณจะ:</strong> {{ lesson.objective }}</p>
    </div>
    <section aria-label="เนื้อหาบทเรียน" class="space-y-4 leading-8">
      <p v-for="paragraph in lesson.paragraphs" :key="paragraph">{{ paragraph }}</p>
    </section>
    <section class="space-y-2 rounded-lg bg-blue-50 p-5 leading-8">
      <h3 class="text-lg font-semibold">ตัวอย่าง</h3>
      <p>{{ lesson.example }}</p>
    </section>
    <section class="space-y-3 leading-8">
      <h3 class="text-lg font-semibold">ลองทำด้วยตัวเอง</h3>
      <p>{{ lesson.exercise }}</p>
      <p class="text-sm text-gray-500">
        ลองเขียนคำตอบในสมุดก่อนเปิดแนวคำตอบ แบบฝึกหัดนี้ไม่มีการส่งตรวจหรือให้คะแนน
      </p>
      <details class="rounded-lg border border-[#D6D9E4] p-4">
        <summary
          class="cursor-pointer font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          ดูแนวคำตอบ
        </summary>
        <p class="mt-3">{{ lesson.solution }}</p>
      </details>
    </section>
  </article>
</template>
