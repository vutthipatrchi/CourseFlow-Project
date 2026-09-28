import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { Toaster, toast } from 'vue-sonner'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { useToast } from '@/composables/useToast'

describe('ToastContainer', () => {
  beforeEach(() => {
    toast.dismiss()
  })

  it('renders nothing when there are no toasts', () => {
    const wrapper = mount(ToastContainer)

    expect(wrapper.find('[data-sonner-toast]').exists()).toBe(false)
  })

  it('renders a toast raised through useToast', async () => {
    const wrapper = mount(ToastContainer)
    const { success } = useToast()

    success('Added to wishlist successfully!')
    await nextTick()
    await nextTick()

    expect(wrapper.text()).toContain('Added to wishlist successfully!')
  })

  it('configures the toaster to match the app: bottom-center, rich colors, a close button', () => {
    const wrapper = mount(ToastContainer)

    expect(wrapper.findComponent(Toaster).props()).toMatchObject({
      position: 'bottom-center',
      duration: 2500,
      richColors: true,
      closeButton: true,
    })
  })
})
