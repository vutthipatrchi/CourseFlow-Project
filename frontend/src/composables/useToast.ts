// Shared toast notifications, so a success or a failure anywhere in the app has one place to
// show it instead of every page inventing its own `showXToast` ref and setTimeout (as
// SubscribeCard.vue and CoursePlayerView.vue currently do). Backed by vue-sonner rather than a
// hand-rolled component: toasts need real accessibility work (an ARIA live region, pausing while
// the pointer is over them so the message doesn't vanish mid-read, keyboard dismissal, a visible
// count limit, respecting prefers-reduced-motion) that is easy to get subtly wrong by hand.
// success()/error() below are this file's stable API — the rest of the app calls these, never
// vue-sonner directly, so the library can be swapped later without touching every call site.
import { toast } from 'vue-sonner'

export interface ToastOptions {
  // A second, lighter line under the main message — for when the message alone needs more
  // context (e.g. a reference number or the reason a payment failed).
  description?: string
  durationMs?: number
}

function notify(type: 'success' | 'error', message: string, options?: ToastOptions) {
  const fn = type === 'success' ? toast.success : toast.error
  const data: { description?: string; duration?: number } = {}
  if (options?.description !== undefined) data.description = options.description
  if (options?.durationMs !== undefined) data.duration = options.durationMs
  // Only pass a second argument when there is one: vue-sonner treats `fn(message, undefined)`
  // differently enough from `fn(message)` to matter for callers asserting on the exact call.
  return Object.keys(data).length > 0 ? fn(message, data) : fn(message)
}

export function useToast() {
  return {
    success: (message: string, options?: ToastOptions) => notify('success', message, options),
    error: (message: string, options?: ToastOptions) => notify('error', message, options),
    dismiss: (id?: string | number) => toast.dismiss(id),
    // Escape hatch for scenarios success()/error() don't cover, e.g. a loading toast that
    // resolves into success or error: toast.loading(...), toast.promise(...).
    raw: toast,
  }
}
