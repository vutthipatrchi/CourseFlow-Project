<script setup lang="ts">
defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  cancel: []
  confirm: []
}>()
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 px-4"
    @click.self="emit('cancel')"
  >
    <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-900">Confirmation</h2>
        <button
          type="button"
          class="text-gray-400 hover:text-gray-600"
          aria-label="Close"
          @click="emit('cancel')"
        >
          <svg viewBox="0 0 24 24" fill="none" class="h-5 w-5" aria-hidden="true">
            <path
              d="M6 6L18 18M18 6L6 18"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <hr class="my-4 border-gray-200" />

      <p class="text-sm text-gray-600">Are you sure you want to delete this assignment?</p>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          class="flex-1 rounded-lg border-2 border-orange-500 bg-white px-4 py-2.5 text-sm font-semibold text-orange-500 hover:bg-orange-500 hover:text-white"
          @click="emit('confirm')"
        >
          Yes, I want to delete the assignment
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          @click="emit('cancel')"
        >
          No, keep it
        </button>
      </div>
    </div>
  </div>
</template>
