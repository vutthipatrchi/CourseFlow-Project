# Toast notifications

A shared way to tell the user an action succeeded or failed, instead of each
page writing its own `showXToast` ref and `setTimeout` (as
`SubscribeCard.vue` and `CoursePlayerView.vue` currently do — this PR does
not change those two files; it only adds the shared system) or not showing
anything at all.

Backed by [vue-sonner](https://github.com/xiaoluoboding/vue-sonner) rather
than a hand-rolled component. A toast needs to get several things right that
are easy to get subtly wrong by hand: an ARIA live region so screen readers
announce it, pausing the auto-dismiss while the pointer is over the toast so
the message doesn't vanish mid-read, dismissing it with the keyboard, a
visible-count limit so toasts don't pile up forever, and respecting
`prefers-reduced-motion`. vue-sonner handles all of that.

## Usage

```ts
import { useToast } from '@/composables/useToast'

const { success, error } = useToast()

success('Added to wishlist successfully!')
error('Something went wrong. Please try again.')
```

`success` and `error` are this file's stable API — call these, not
vue-sonner directly, so the library can be swapped later without touching
every call site. Both accept an optional second argument, the duration in
milliseconds (default `2500`, matching the toasts already in the app).

For a scenario `success()`/`error()` don't cover — e.g. a loading toast that
resolves into success or error once a promise settles — `raw` is the
underlying vue-sonner `toast` object (`toast.loading(...)`,
`toast.promise(...)`; see vue-sonner's docs):

```ts
const { raw } = useToast()
raw.promise(submitAnswer(id, answer), {
  loading: 'Submitting...',
  success: 'Submitted!',
  error: 'Could not submit. Please try again.',
})
```

`ToastContainer.vue` is mounted once in `App.vue` and renders whatever
vue-sonner's own state holds — nothing else to add per page. Toasts stack
bottom-center, matching the app's existing green success / red error
colors, and dismiss themselves after the duration, or right away via the
close button, a keyboard shortcut, or by hovering to pause and moving away.

## Not done in this PR

Existing inline `showXToast` refs (`SubscribeCard.vue`,
`CoursePlayerView.vue`) and the ~13 pages that only show errors as an inline
`role="alert"` banner (or not at all) were left as they are — switching them
over touches files this story doesn't own. Whoever owns each page can adopt
`useToast()` when convenient.
