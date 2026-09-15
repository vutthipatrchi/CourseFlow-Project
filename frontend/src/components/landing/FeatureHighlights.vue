<script setup lang="ts">
import featureSecure from '@/assets/landing/feature-secure.svg'
import featureHeart from '@/assets/landing/feature-heart.svg'
import featurePeople from '@/assets/landing/feature-people.svg'
import featurePhotoSecure from '@/assets/landing/feature-photo-secure.svg'
import featurePhotoCollab from '@/assets/landing/feature-photo-collab.svg'

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
      <img
        :src="featurePhotoSecure"
        alt="Student working on code across two screens"
        class="w-full shadow-lg"
      />
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
      <img
        :src="featurePhotoCollab"
        alt="Tutor's laptop screen showing a course website mockup"
        class="w-full shadow-lg md:order-2"
      />
    </div>
  </section>
</template>
