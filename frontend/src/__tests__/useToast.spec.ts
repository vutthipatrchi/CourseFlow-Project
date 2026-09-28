import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Toaster, toast } from 'vue-sonner'
import { useToast } from '@/composables/useToast'

// vue-sonner keeps toasts in its own module-level store; mounting its Toaster is the only way
// to observe what success()/error() actually raised.
function mountToaster() {
  return mount(Toaster, { props: { richColors: true } })
}

// A dismiss is applied on a requestAnimationFrame, not on Vue's own tick, and needs a few
// frames to settle in jsdom.
async function settle() {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await nextTick()
  }
}

describe('useToast', () => {
  beforeEach(() => {
    toast.dismiss()
  })

  it('raises a success toast', async () => {
    const wrapper = mountToaster()
    const { success } = useToast()

    success('Added to wishlist successfully!')
    await nextTick()
    await nextTick()

    expect(wrapper.text()).toContain('Added to wishlist successfully!')
    expect(wrapper.find('[data-type="success"]').exists()).toBe(true)
  })

  it('raises an error toast', async () => {
    const wrapper = mountToaster()
    const { error } = useToast()

    error('Something went wrong.')
    await nextTick()
    await nextTick()

    expect(wrapper.text()).toContain('Something went wrong.')
    expect(wrapper.find('[data-type="error"]').exists()).toBe(true)
  })

  it('can show several toasts at once', async () => {
    const wrapper = mountToaster()
    const { success, error } = useToast()

    success('First')
    error('Second')
    await nextTick()
    await nextTick()

    expect(wrapper.findAll('[data-sonner-toast]')).toHaveLength(2)
  })

  it('dismisses a toast by the id success() returns', async () => {
    const wrapper = mountToaster()
    const { success, dismiss } = useToast()

    const id = success('Dismiss me')
    await nextTick()
    await nextTick()
    expect(wrapper.find('[data-sonner-toast]').exists()).toBe(true)

    dismiss(id)
    await settle()

    // vue-sonner marks a dismissed toast for its exit animation before removing it from the DOM.
    expect(wrapper.get('[data-sonner-toast]').attributes('data-removed')).toBe('true')
  })

  it('passes a custom duration through to vue-sonner', () => {
    const spy = vi.spyOn(toast, 'success')
    const { success } = useToast()

    success('Sticks around', 5000)

    expect(spy).toHaveBeenCalledWith('Sticks around', { duration: 5000 })
  })

  it('exposes the underlying vue-sonner toast for scenarios success()/error() do not cover', () => {
    const { raw } = useToast()

    expect(raw).toBe(toast)
  })
})
