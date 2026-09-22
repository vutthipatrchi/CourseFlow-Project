<script setup lang="ts">
// ── CourseCard ──────────────────────────────────────────────────────────
// Course thumbnail card: category, title, description, lesson/hour count
// แก้ไขได้: image aspect ratio, icon style, footer stat layout

type Props = {
  id: string
  category: string
  title: string
  description: string
  imageUrl: string
  lessonCount: number
  hourCount: number
}

defineProps<Props>()
</script>

<template>
  <RouterLink
    :to="`/courses/${id}`"
    class="flex w-full max-w-92.5 cursor-pointer flex-col rounded-lg bg-white shadow-[4px_4px_24px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:scale-95"
  >
    <img :src="imageUrl" :alt="title" class="h-60 w-full rounded-t-lg bg-gray-100 object-cover" />
    <div class="flex flex-col gap-2 px-4 pb-4">
      <p class="text-sm text-orange-500">{{ category }}</p>
      <h3 class="text-2xl leading-tight font-medium tracking-[-0.02em] text-gray-900">
        {{ title }}
      </h3>
      <p class="text-base text-[#646D89]">{{ description }}</p>
    </div>
    <div class="flex items-center gap-6 border-t border-[#E4E6ED] p-4">
      <div class="flex items-center gap-2">
        <span class="h-5 w-5 rounded-full border-[1.5px] border-blue-500"></span>
        <span class="text-base text-[#646D89]">{{ lessonCount }} Lesson</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="h-5 w-5 rounded-full border-[1.5px] border-blue-500"></span>
        <span class="text-base text-[#646D89]">{{ hourCount }} Hours</span>
      </div>
    </div>
  </RouterLink>
</template>
