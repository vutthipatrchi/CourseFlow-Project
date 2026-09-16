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
  const [{ default: PromoCodeView }, { default: AddPromoCodeView }] = await Promise.all([
    import('../views/admin/PromoCodeView.vue'),
    import('../views/admin/AddPromoCodeView.vue'),
  ])
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/promo-code', name: 'admin-promo-code', component: PromoCodeView },
      { path: '/admin/promo-code/new', name: 'admin-promo-code-new', component: AddPromoCodeView },
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

describe('Add Promo code flow', () => {
  it('keeps Create disabled until every required field is filled', async () => {
    const wrapper = await mountApp('/admin/promo-code/new')
    const createButton = wrapper.get('button.bg-blue-600')
    expect((createButton.element as HTMLButtonElement).disabled).toBe(true)

    await wrapper.get('#promo-code').setValue('SAVE20')
    await wrapper.get('#minimum-purchase').setValue('500')
    expect((createButton.element as HTMLButtonElement).disabled).toBe(true)

    const radios = wrapper.findAll('input[type="radio"]')
    await radios[1]!.setValue(true) // percent
    expect((createButton.element as HTMLButtonElement).disabled).toBe(true)

    await wrapper.get('input[placeholder="Percent"]').setValue('10')
    expect((createButton.element as HTMLButtonElement).disabled).toBe(false)
  })

  it('blocks special characters and spaces while typing the promo code', async () => {
    const wrapper = await mountApp('/admin/promo-code/new')
    await wrapper.get('#promo-code').setValue('AB@ 12! cd')
    expect((wrapper.get('#promo-code').element as HTMLInputElement).value).toBe('AB12cd')
  })

  it('disables the THB/Percent inputs until their radio is selected, and enforces mutual exclusion', async () => {
    const wrapper = await mountApp('/admin/promo-code/new')
    const thbInput = wrapper.get('input[placeholder="THB"]')
    const percentInput = wrapper.get('input[placeholder="Percent"]')
    expect((thbInput.element as HTMLInputElement).disabled).toBe(true)
    expect((percentInput.element as HTMLInputElement).disabled).toBe(true)

    const radios = wrapper.findAll('input[type="radio"]')
    await radios[0]!.setValue(true) // THB
    expect((thbInput.element as HTMLInputElement).disabled).toBe(false)
    await thbInput.setValue('250')

    await radios[1]!.setValue(true) // Percent
    expect((percentInput.element as HTMLInputElement).disabled).toBe(false)
    expect((thbInput.element as HTMLInputElement).value).toBe('')

    await percentInput.setValue('150')
    await percentInput.trigger('blur')
    expect((percentInput.element as HTMLInputElement).value).toBe('100')
  })

  it('creates the promo code and returns to the list showing the new row', async () => {
    const wrapper = await mountApp('/admin/promo-code/new')

    await wrapper.get('#promo-code').setValue('SAVE20')
    await wrapper.get('#minimum-purchase').setValue('500')
    const radios = wrapper.findAll('input[type="radio"]')
    await radios[1]!.setValue(true)
    await wrapper.get('input[placeholder="Percent"]').setValue('20')
    await wrapper.get('button.bg-blue-600').trigger('click')

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).toContain('Promo code')
    expect(wrapper.text()).toContain('SAVE20')
    expect(wrapper.findAll('tbody tr')).toHaveLength(7)
  })

  it('cancels without creating a promo code', async () => {
    const wrapper = await mountApp('/admin/promo-code/new')
    await wrapper.get('#promo-code').setValue('SHOULDNOTSAVE')
    await wrapper.get('button.border-orange-500').trigger('click')

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).not.toContain('SHOULDNOTSAVE')
    expect(wrapper.findAll('tbody tr')).toHaveLength(6)
  })
})
