<script setup lang="ts">
// Mounted once in App.vue. useToast() (in this file's sibling composable) is what the rest of
// the app calls; this component only needs to exist once, rendering whatever vue-sonner's own
// state currently holds.
import { Toaster } from 'vue-sonner'
import 'vue-sonner/style.css'

// vue-sonner's default toast is a fixed 356px wide regardless of message length and sets
// font-size: 13px — both too small here. toastOptions.style is spread onto each toast's own
// inline style (higher specificity than the library's stylesheet, so it reliably wins), letting
// the box hug short messages and grow for longer ones instead of a fixed width either way.
const toastOptions = {
  style: {
    width: 'fit-content',
    minWidth: '300px',
    maxWidth: 'min(460px, calc(100vw - 32px))',
    fontSize: '15px',
    padding: '16px 20px',
  },
}
</script>

<template>
  <!-- Top-right, not bottom-center: CoursePlayerView has a Previous/Next Lesson bar fixed to the
       bottom of the viewport that a bottom toast would sit on top of. The 96px top offset clears
       every navbar in the app (76-88px tall) with room to spare. -->
  <Toaster
    position="top-right"
    :offset="{ top: 96 }"
    :duration="2500"
    :toast-options="toastOptions"
    close-button
    rich-colors
  />
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

/* toastOptions.style (above) sets the toast's own font-size; give the optional description a
   distinct, slightly smaller and softer line under the title instead of inheriting it verbatim. */
[data-sonner-toast] [data-description] {
  font-size: 13px;
  opacity: 0.92;
}
</style>
