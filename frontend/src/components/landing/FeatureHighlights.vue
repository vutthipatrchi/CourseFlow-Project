<script setup lang="ts">
import featureSecure from '@/assets/landing/feature-secure.svg'
import featureHeart from '@/assets/landing/feature-heart.svg'
import featurePeople from '@/assets/landing/feature-people.svg'

interface Feature {
  title: string
  description: string
  icon: string
}

const secureFeatures: Feature[] = [
  {
    title: 'Secure & Easy',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.',
    icon: featureSecure,
  },
  {
    title: 'Supports All Students',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.',
    icon: featureHeart,
  },
]

const collabFeatures: Feature[] = [
  {
    title: 'Purely Collaborative',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.',
    icon: featurePeople,
  },
  {
    title: 'Supports All Students',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit es se cillum dolore eu fugiat nulla pariatur. Excepteur sint.',
    icon: featureHeart,
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
            <img :src="feature.icon" alt="" aria-hidden="true" class="mt-1 h-9 w-9 shrink-0" />
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
            <img :src="feature.icon" alt="" aria-hidden="true" class="mt-1 h-9 w-9 shrink-0" />
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
