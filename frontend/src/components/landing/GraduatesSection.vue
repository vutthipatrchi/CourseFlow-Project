<script setup lang="ts">
interface Graduate {
  name: string
  quote: string
  avatarId: number
  highlighted?: boolean
}

const graduates: Graduate[] = [
  {
    name: 'Saiful Islam',
    quote:
      "Start with something simple and small, then expand over time. If people call it a 'toy' you're definitely onto something.",
    avatarId: 5,
  },
  {
    name: 'Saiful Islam',
    quote:
      "Start with something simple and small, then expand over time. If people call it a 'toy' you're definitely onto something. If you're waiting for encouragement from others, you're doing it wrong. By the time people think an idea is good, it's probably too late.",
    avatarId: 8,
    highlighted: true,
  },
  {
    name: 'Saiful Islam',
    quote:
      "Start with something simple and small, then expand over time. If people call it a 'toy' you're definitely onto something.",
    avatarId: 15,
  },
]
</script>

<template>
  <section class="mx-auto max-w-6xl px-6 py-16">
    <h2 class="text-center text-2xl font-bold text-gray-900 md:text-3xl">Our Graduates</h2>

    <div class="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
      <article
        v-for="graduate in graduates"
        :key="graduate.avatarId"
        class="flex flex-col gap-6 rounded-2xl p-6 sm:flex-row sm:items-center"
        :class="graduate.highlighted ? 'bg-blue-100' : ''"
      >
        <img
          :src="`https://i.pravatar.cc/240?img=${graduate.avatarId}`"
          :alt="graduate.name"
          class="h-40 w-full shrink-0 rounded-xl object-cover sm:w-28"
        />
        <div>
          <span class="text-3xl leading-none text-blue-300">&ldquo;</span>
          <p class="font-semibold text-blue-600">{{ graduate.name }}</p>
          <p class="mt-2 text-sm text-gray-500">{{ graduate.quote }}</p>
          <span class="mt-2 block text-right text-3xl leading-none text-blue-300">&rdquo;</span>
        </div>
      </article>
    </div>
  </section>
</template>
