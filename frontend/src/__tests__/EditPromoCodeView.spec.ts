import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { RouterView, createRouter, createWebHistory } from 'vue-router'

const RootStub = defineComponent({
  components: { RouterView },
  template: '<RouterView />',
})

async function mountApp(initialPath: string) {
  vi.resetModules()
  const [{ default: PromoCodeView }, { default: EditPromoCodeView }] = await Promise.all([
    import('../views/admin/PromoCodeView.vue'),
    import('../views/admin/EditPromoCodeView.vue'),
  ])
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/promo-code', name: 'admin-promo-code', component: PromoCodeView },
      {
        path: '/admin/promo-code/:id/edit',
        name: 'admin-promo-code-edit',
        component: EditPromoCodeView,
      },
    ],
  })
  router.push(initialPath)
  await router.isReady()
  const wrapper = mount(RootStub, { global: { plugins: [router] } })
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()
  return wrapper
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('Edit Promo code flow', () => {
  it("navigates to Edit from the list's pencil icon, pre-filled with that row's data", async () => {
    const wrapper = await mountApp('/admin/promo-code')
    await wrapper.get('a[aria-label^="Edit"]').trigger('click')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).toContain('Promo code')
    expect(wrapper.text()).toContain('NEWYEAR200')
    expect((wrapper.get('#promo-code').element as HTMLInputElement).value).toBe('NEWYEAR200')
    expect((wrapper.get('#minimum-purchase').element as HTMLInputElement).value).toBe('0')
    const radios = wrapper.findAll('input[type="radio"]')
    expect((radios[0]!.element as HTMLInputElement).checked).toBe(true) // fixed
    expect((wrapper.get('input[placeholder="THB"]').element as HTMLInputElement).value).toBe('200')
  })

  it('pre-fills the discount type using the shared "Discount (THB)/(%)" labels', async () => {
    const wrapper = await mountApp('/admin/promo-code/promo-4/edit')
    expect(wrapper.text()).toContain('Discount (THB)')
    expect(wrapper.text()).toContain('Discount (%)')
    const radios = wrapper.findAll('input[type="radio"]')
    expect((radios[1]!.element as HTMLInputElement).checked).toBe(true) // promo-4 is percent
    expect((wrapper.get('input[placeholder="Percent"]').element as HTMLInputElement).value).toBe(
      '15',
    )
  })

  it('resets Lesson-equivalent state: switching discount type clears the previous value, same as Add', async () => {
    const wrapper = await mountApp('/admin/promo-code/promo-1/edit')
    expect((wrapper.get('input[placeholder="THB"]').element as HTMLInputElement).value).toBe('200')

    const radios = wrapper.findAll('input[type="radio"]')
    await radios[1]!.setValue(true) // switch to percent
    expect((wrapper.get('input[placeholder="THB"]').element as HTMLInputElement).value).toBe('')
  })

  it('blocks Save when a required field is cleared', async () => {
    const wrapper = await mountApp('/admin/promo-code/promo-1/edit')
    await wrapper.get('#promo-code').setValue('')
    const saveButton = wrapper.get('button.bg-blue-600')
    expect((saveButton.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('saves the edit and returns to the list with the row updated', async () => {
    const wrapper = await mountApp('/admin/promo-code/promo-1/edit')
    await wrapper.get('#promo-code').setValue('NEWYEAR300')
    await wrapper.get('input[placeholder="THB"]').setValue('300')
    await wrapper.get('button.bg-blue-600').trigger('click')

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).toContain('NEWYEAR300')
    expect(wrapper.text()).toContain('300')
    expect(wrapper.findAll('tbody tr')).toHaveLength(6)
  })

  it('cancels without saving any change', async () => {
    const wrapper = await mountApp('/admin/promo-code/promo-1/edit')
    await wrapper.get('#promo-code').setValue('SHOULDNOTSAVE')
    await wrapper.get('button.border-orange-500').trigger('click')

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).not.toContain('SHOULDNOTSAVE')
    expect(wrapper.text()).toContain('NEWYEAR200')
  })

  it('opens the delete confirmation modal with promo-code wording', async () => {
    const wrapper = await mountApp('/admin/promo-code/promo-1/edit')
    const deleteLink = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Delete Promo code')
    await deleteLink!.trigger('click')

    expect(wrapper.text()).toContain('Are you sure you want to delete this promo code?')
  })

  it('deletes the promo code on confirm and returns to the list without it', async () => {
    const wrapper = await mountApp('/admin/promo-code/promo-1/edit')
    const deleteLink = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Delete Promo code')
    await deleteLink!.trigger('click')

    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Yes, I want to delete the promo code')
    await confirmButton!.trigger('click')

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).not.toContain('NEWYEAR200')
    expect(wrapper.findAll('tbody tr')).toHaveLength(5)
  })
})
