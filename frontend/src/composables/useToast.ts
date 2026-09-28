// Shared toast notifications, so a success or a failure anywhere in the app has one place to
// show it instead of every page inventing its own `showXToast` ref and setTimeout (as
// SubscribeCard.vue and CoursePlayerView.vue currently do). Backed by vue-sonner rather than a
// hand-rolled component: toasts need real accessibility work (an ARIA live region, pausing while
// the pointer is over them so the message doesn't vanish mid-read, keyboard dismissal, a visible
// count limit, respecting prefers-reduced-motion) that is easy to get subtly wrong by hand.
// success()/error() below are this file's stable API — the rest of the app calls these, never
// vue-sonner directly, so the library can be swapped later without touching every call site.
import { toast } from 'vue-sonner'

function notify(type: 'success' | 'error', message: string, durationMs?: number) {
  const fn = type === 'success' ? toast.success : toast.error
  return fn(message, durationMs === undefined ? undefined : { duration: durationMs })
}

export function useToast() {
  return {
    success: (message: string, durationMs?: number) => notify('success', message, durationMs),
    error: (message: string, durationMs?: number) => notify('error', message, durationMs),
    dismiss: (id?: string | number) => toast.dismiss(id),
    // Escape hatch for scenarios success()/error() don't cover, e.g. a loading toast that
    // resolves into success or error: toast.loading(...), toast.promise(...).
    raw: toast,
  }
}
