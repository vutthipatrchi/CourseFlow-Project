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

  it('adds a new assignment through the modal', async () => {
    const wrapper = await mountAndLoad()
    await wrapper.get('button.bg-blue-600').trigger('click')

    await wrapper.get('input[name="detail"]').setValue('Brand new assignment')
    await wrapper.get('input[name="course"]').setValue('New Course')
    await wrapper.get('input[name="lesson"]').setValue('New Lesson')
    await wrapper.get('input[name="subLesson"]').setValue('New Sub-lesson')
    await wrapper.get('form').trigger('submit.prevent')

    expect(wrapper.findAll('tbody tr')).toHaveLength(9)
    expect(wrapper.text()).toContain('Brand new assignment')
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
