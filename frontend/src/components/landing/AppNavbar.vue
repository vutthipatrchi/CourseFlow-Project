<script setup lang="ts">
import logo from '@/assets/landing/logo.svg'
import { Show, SignInButton } from '@clerk/vue'
import UserMenu from './UserMenu.vue'
</script>

<template>
  <header class="w-full bg-white">
    <nav class="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <a href="/">
        <img :src="logo" alt="CourseFlow" class="h-4" />
      </a>

      <div class="flex items-center gap-4 sm:gap-8">
        <a href="#" class="text-sm font-medium text-darkblue-500 hover:text-blue-600">Our Courses</a>
        <Show when="signed-out">
          <SignInButton>
            <button
              type="button"
              class="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Log in
            </button>
          </SignInButton>
        </Show>
        <Show when="signed-in">
          <UserMenu />
        </Show>
      </div>
    </nav>
  </header>
</template>
