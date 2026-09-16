import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

// services/assignments.ts keeps its mock data in a module-level singleton so
// deletes/creates persist across a real page navigation. Reset the module
// registry per test so that singleton doesn't leak between tests here.
async function mountAndLoad() {
  vi.resetModules()
  const { default: AssignmentsView } = await import('../views/admin/AssignmentsView.vue')
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

  it('links "+ Add Assignment" to the full-page create route', async () => {
    const wrapper = await mountAndLoad()
    expect(wrapper.get('a.bg-blue-600').attributes('href')).toBe('/admin/assignments/new')
  })

  it("links each row's edit icon to its full-page edit route", async () => {
    const wrapper = await mountAndLoad()
    expect(wrapper.get('a[aria-label^="Edit"]').attributes('href')).toBe(
      '/admin/assignments/mock-1/edit',
    )
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
