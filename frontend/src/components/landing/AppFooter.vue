<script setup lang="ts">
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
  <footer class="bg-blue-900">
    <div
      class="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 text-gray-300 sm:flex-row sm:justify-between"
    >
      <a href="/">
        <img :src="logo" alt="CourseFlow" class="h-4" />
      </a>

      <nav class="flex gap-6 text-sm">
        <a href="#" class="hover:text-white">All Courses</a>
        <a href="#" class="hover:text-white">Bundle Package</a>
      </nav>

      <div class="flex gap-3">
        <a v-for="social in socials" :key="social.name" href="#" :aria-label="social.name">
          <img :src="social.icon" :alt="social.name" class="h-9 w-9" />
        </a>
      </div>
    </div>
  </footer>
</template>
