<script setup lang="ts">
interface Feature {
  title: string
  description: string
}

const secureFeatures: Feature[] = [
  {
    title: 'Secure & Easy',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.',
  },
  {
    title: 'Supports All Students',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.',
  },
]

const collabFeatures: Feature[] = [
  {
    title: 'Purely Collaborative',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.',
  },
  {
    title: 'Supports All Students',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.',
  },
]
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-24 px-6 py-20">
    <!-- block 1: image left, text right -->
    <div class="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
      <div class="flex aspect-4/3 w-full items-center justify-center rounded-2xl bg-blue-100 shadow-lg">
        <svg viewBox="0 0 64 64" class="h-20 w-20 text-blue-400">
          <rect x="8" y="14" width="48" height="30" rx="3" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M4 48h56l-4 6H8l-4-6Z" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M20 26l8 8 16-14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div>
        <h2 class="text-2xl font-bold text-gray-900 md:text-3xl">
          Learning experience has been enhanced with new technologies
        </h2>
        <ul class="mt-8 space-y-6">
          <li v-for="feature in secureFeatures" :key="feature.title" class="flex gap-4">
            <span
              class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-300 text-blue-600"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none">
                <path
                  d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
                  stroke="currentColor"
                  stroke-width="1.6"
                />
              </svg>
            </span>
            <div>
              <h3 class="font-semibold text-gray-900">{{ feature.title }}</h3>
              <p class="mt-1 text-sm text-gray-500">{{ feature.description }}</p>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- block 2: text left, image right -->
    <div class="grid grid-cols-1 items-center gap-12 md:grid-cols-2">
      <div class="md:order-1">
        <h2 class="text-2xl font-bold text-gray-900 md:text-3xl">
          Interactions between the tutor and the learners
        </h2>
        <ul class="mt-8 space-y-6">
          <li v-for="feature in collabFeatures" :key="feature.title" class="flex gap-4">
            <span
              class="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-300 text-blue-600"
            >
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none">
                <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6" />
              </svg>
            </span>
            <div>
              <h3 class="font-semibold text-gray-900">{{ feature.title }}</h3>
              <p class="mt-1 text-sm text-gray-500">{{ feature.description }}</p>
            </div>
          </li>
        </ul>
      </div>
      <div
        class="flex aspect-4/3 w-full items-center justify-center rounded-2xl bg-blue-100 shadow-lg md:order-2"
      >
        <svg viewBox="0 0 64 64" class="h-20 w-20 text-blue-400">
          <circle cx="24" cy="20" r="8" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M10 46c0-8 6-14 14-14s14 6 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <circle cx="46" cy="16" r="6" fill="none" stroke="currentColor" stroke-width="2" />
          <path d="M36 40c1-6 5-10 10-10s9 4 10 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>
    </div>
  </section>
</template>
