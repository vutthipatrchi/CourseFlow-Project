import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import AssignmentsView from '../views/admin/AssignmentsView.vue'

async function mountAndLoad() {
  const router = createRouter({
    history: createWebHistory(),
    routes: [{ path: '/', component: AssignmentsView }],
  })
  const wrapper = mount(AssignmentsView, { global: { plugins: [router] } })
  await router.isReady()
  await vi.advanceTimersByTimeAsync(300)
  await flushPromises()
  return wrapper
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  vi.useRealTimers()
})

describe('AssignmentsView', () => {
  it('renders the mock assignments once loading finishes', async () => {
    const wrapper = await mountAndLoad()
    expect(wrapper.findAll('tbody tr')).toHaveLength(8)
    expect(wrapper.text()).toContain('Service Design Essentials')
  })

  it('filters rows by the search query', async () => {
    const wrapper = await mountAndLoad()
    await wrapper.find('input[type="search"]').setValue('nothing matches this')
    expect(wrapper.text()).toContain('No assignments found.')
  })

  it('links "+ Add Assignment" to the full-page create route instead of a modal', async () => {
    const wrapper = await mountAndLoad()
    expect(wrapper.get('a.bg-blue-600').attributes('href')).toBe('/admin/assignments/new')
  })

  it('edits an assignment through the modal', async () => {
    const wrapper = await mountAndLoad()
    await wrapper.get('button[aria-label^="Edit"]').trigger('click')

    await wrapper.get('input[name="detail"]').setValue('Updated assignment detail')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.findAll('tbody tr')).toHaveLength(8)
    expect(wrapper.text()).toContain('Updated assignment detail')
  })

  it('deletes an assignment after confirmation', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const wrapper = await mountAndLoad()
    await wrapper.get('button[aria-label^="Delete"]').trigger('click')
    expect(confirmSpy).toHaveBeenCalled()
    expect(wrapper.findAll('tbody tr')).toHaveLength(7)
    confirmSpy.mockRestore()
  })
})
