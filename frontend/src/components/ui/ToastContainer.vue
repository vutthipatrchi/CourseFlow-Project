<script setup lang="ts">
// Mounted once in App.vue. useToast() (in this file's sibling composable) is what the rest of
// the app calls; this component only needs to exist once, rendering whatever vue-sonner's own
// state currently holds.
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'
</script>

<template>
  <Toaster position="bottom-center" :duration="2500" close-button rich-colors />
</template>

<style>
/* Match the app's existing success (utility-green) and error (red-600) colors instead of
   vue-sonner's defaults. Unscoped: these attribute selectors target vue-sonner's own markup,
   which scoped styles can't reach since Toaster renders it itself, not through a slot. */
[data-sonner-toaster] {
  --success-bg: var(--color-utility-green);
  --success-border: var(--color-utility-green);
  --success-text: #fff;
  --error-bg: #dc2626;
  --error-border: #dc2626;
  --error-text: #fff;
}
</style>
