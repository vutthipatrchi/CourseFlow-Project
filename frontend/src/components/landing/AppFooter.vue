<script setup lang="ts">
const socials = [
  { name: 'Facebook', path: 'M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h3l1-3h-4V9c0-.6.4-1 1-1z' },
  {
    name: 'Instagram',
    path: 'M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5ZM17 7a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z',
  },
  {
    name: 'Twitter',
    path: 'M22 5.9c-.7.3-1.5.6-2.3.7.8-.5 1.5-1.3 1.8-2.3-.8.5-1.7.8-2.6 1a4.1 4.1 0 0 0-7 3.7A11.6 11.6 0 0 1 3.4 4.6a4.1 4.1 0 0 0 1.3 5.5c-.7 0-1.3-.2-1.9-.5v.1c0 2 1.4 3.6 3.3 4a4.1 4.1 0 0 1-1.9.1c.5 1.6 2 2.8 3.8 2.8A8.2 8.2 0 0 1 2 18.6a11.6 11.6 0 0 0 6.3 1.8c7.5 0 11.7-6.3 11.7-11.7v-.5c.8-.6 1.5-1.3 2-2.3Z',
  },
]
</script>

<template>
  <footer class="bg-gray-900">
    <div
      class="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6 py-10 text-gray-300 sm:flex-row sm:justify-between"
    >
      <a href="/" class="text-lg font-bold text-white">
        Course<span class="text-blue-400">Flow</span>
      </a>

      <nav class="flex gap-6 text-sm">
        <a href="#" class="hover:text-white">All Courses</a>
        <a href="#" class="hover:text-white">Bundle Package</a>
      </nav>

      <div class="flex gap-3">
        <a
          v-for="social in socials"
          :key="social.name"
          href="#"
          :aria-label="social.name"
          class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500"
        >
          <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor">
            <path :d="social.path" />
          </svg>
        </a>
      </div>
    </div>
  </footer>
</template>
