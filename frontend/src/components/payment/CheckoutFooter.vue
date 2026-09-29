<script setup lang="ts">
import { RouterLink } from 'vue-router'
import logo from '@/assets/landing/logo.svg'
import socialFacebook from '@/assets/landing/social-facebook.svg'
import socialInstagram from '@/assets/landing/social-instagram.svg'
import socialTwitter from '@/assets/landing/social-twitter.svg'

const socials = [
  { name: 'Facebook', icon: socialFacebook },
  { name: 'Instagram', icon: socialInstagram },
  { name: 'Twitter', icon: socialTwitter },
]
</script>

<template>
  <footer class="min-h-[240px] bg-blue-900">
    <div
      class="mx-auto flex min-h-[240px] max-w-[1120px] flex-col items-center justify-center gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:gap-10 xl:px-0"
    >
      <RouterLink to="/" aria-label="CourseFlow home" class="w-[156px] px-2 py-4">
        <img :src="logo" alt="CourseFlow" class="h-4 w-[140px]" />
      </RouterLink>
      <nav class="flex flex-1 flex-wrap justify-center gap-8 text-base text-gray-300">
        <RouterLink to="/" class="hover:text-white">All Courses</RouterLink>
        <a href="#" class="hover:text-white">Bundle Package</a>
      </nav>
      <div class="flex gap-4">
        <a
          v-for="social in socials"
          :key="social.name"
          href="#"
          :aria-label="social.name"
          class="rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <img :src="social.icon" :alt="social.name" class="h-12 w-12" />
        </a>
      </div>
    </div>
  </footer>
</template>
