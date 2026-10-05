import { onScopeDispose, ref, watch } from 'vue'
import { useUser } from '@clerk/vue'
import { listWishlist, addWishlistCourse, removeWishlistCourse } from '@/api/wishlist'
import { toApiError } from '@/api/client'
import type { CheckoutCourse } from '@/api/payments'

// Each consumer reloads from the server. No private data is cached across accounts.
export function useWishlist() {
  const { user } = useUser()
  const courses = ref<CheckoutCourse[]>([])
  const loading = ref(false)
  const loaded = ref(false)
  const error = ref('')
  const pending = ref(new Set<number>())
  let generation = 0
  onScopeDispose(() => generation++)

  async function load() {
    const request = ++generation
    courses.value = []
    loaded.value = false
    error.value = ''
    pending.value = new Set()
    loading.value = !!user.value?.id
    if (!user.value?.id) return
    try {
      const result = await listWishlist()
      if (request !== generation) return
      courses.value = result
      loaded.value = true
    } catch (cause) {
      if (request === generation) error.value = toApiError(cause).message
    } finally {
      if (request === generation) loading.value = false
    }
  }

  watch(() => user.value?.id, load, { immediate: true, flush: 'sync' })

  async function setSaved(course: CheckoutCourse, saved: boolean): Promise<boolean> {
    if (!user.value?.id) throw new Error('Please sign in to save courses.')
    if (!loaded.value || pending.value.has(course.id)) return false
    const request = generation
    pending.value.add(course.id)
    try {
      if (saved) await addWishlistCourse(course.id)
      else await removeWishlistCourse(course.id)
      if (request !== generation) return false
      courses.value = courses.value.filter((item) => item.id !== course.id)
      if (saved) courses.value.unshift(course)
      return true
    } catch (cause) {
      if (request !== generation) return false
      throw cause
    } finally {
      if (request === generation) pending.value.delete(course.id)
    }
  }

  return { user, courses, loading, loaded, error, pending, load, setSaved }
}
