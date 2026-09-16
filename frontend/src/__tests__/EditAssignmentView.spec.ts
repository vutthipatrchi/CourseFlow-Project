import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { RouterView, createRouter, createWebHistory } from 'vue-router'

const RootStub = defineComponent({
  components: { RouterView },
  template: '<RouterView />',
})

// Same isolation concern as AddAssignmentView.spec.ts: services/assignments.ts
// mutates a module-level singleton so edits/deletes persist across a real
// page navigation. Reset the module registry per test.
async function mountApp(initialPath: string) {
  vi.resetModules()
  const [{ default: AssignmentsView }, { default: EditAssignmentView }] = await Promise.all([
    import('../views/admin/AssignmentsView.vue'),
    import('../views/admin/EditAssignmentView.vue'),
  ])
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/assignments', name: 'admin-assignments', component: AssignmentsView },
      {
        path: '/admin/assignments/:id/edit',
        name: 'admin-assignments-edit',
        component: EditAssignmentView,
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

describe('Edit Assignment flow', () => {
  it("navigates to the Edit Assignment page from the list, pre-filled with that row's data", async () => {
    const wrapper = await mountApp('/admin/assignments')
    await wrapper.get('a[aria-label^="Edit"]').trigger('click')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).toContain('Assignment')
    expect((wrapper.get('#course').element as HTMLSelectElement).value).toBe(
      'service-design-essentials',
    )
    expect((wrapper.get('#lesson').element as HTMLSelectElement).value).toBe('introduction')
    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).value).toBe(
      '4-levels-of-service-design',
    )
    expect((wrapper.get('#assignment').element as HTMLInputElement).value).toBe(
      'What are the 4 elements of a good service design?',
    )
  })

  it('resets Lesson and Sub-lesson when the Course changes, same as the Add page', async () => {
    const wrapper = await mountApp('/admin/assignments/mock-1/edit')

    await wrapper.get('#course').setValue('ux-research-basics')

    expect((wrapper.get('#lesson').element as HTMLSelectElement).value).toBe('')
    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).value).toBe('')
    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).disabled).toBe(true)
  })

  it('shows a validation error and blocks Save when a field is cleared', async () => {
    const wrapper = await mountApp('/admin/assignments/mock-1/edit')

    await wrapper.get('#assignment').setValue('')
    await wrapper.get('button.bg-blue-600').trigger('click')

    expect(wrapper.text()).toContain('Please enter the assignment detail.')
    expect(wrapper.find('#course').exists()).toBe(true)
  })

  it('saves the edit and returns to the list with the row updated', async () => {
    const wrapper = await mountApp('/admin/assignments/mock-1/edit')

    await wrapper.get('#course').setValue('ux-research-basics')
    await wrapper.get('#lesson').setValue('getting-started')
    await wrapper.get('#sub-lesson').setValue('what-is-ux-research')
    await wrapper.get('#assignment').setValue('Edited assignment detail')
    await wrapper.get('button.bg-blue-600').trigger('click')

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).toContain('Assignments')
    expect(wrapper.text()).toContain('Edited assignment detail')
    expect(wrapper.text()).toContain('UX Research Basics')
    expect(wrapper.findAll('tbody tr')).toHaveLength(8)
  })

  it('cancels without saving any change', async () => {
    const wrapper = await mountApp('/admin/assignments/mock-1/edit')

    await wrapper.get('#assignment').setValue('Should not be saved')
    await wrapper.get('button.border-orange-500').trigger('click')

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).toContain('Assignments')
    expect(wrapper.text()).not.toContain('Should not be saved')
    expect(wrapper.findAll('tbody tr')).toHaveLength(8)
  })

  it('opens the delete confirmation modal from "Delete Assignment"', async () => {
    const wrapper = await mountApp('/admin/assignments/mock-1/edit')

    const deleteLink = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Delete Assignment')
    expect(deleteLink).toBeTruthy()
    await deleteLink!.trigger('click')

    expect(wrapper.text()).toContain('Confirmation')
    expect(wrapper.text()).toContain('Are you sure you want to delete this assignment?')
  })

  it('"No, keep it" closes the modal without deleting the assignment', async () => {
    const wrapper = await mountApp('/admin/assignments/mock-1/edit')

    const deleteLink = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Delete Assignment')
    await deleteLink!.trigger('click')

    const keepButton = wrapper.findAll('button').find((button) => button.text() === 'No, keep it')
    await keepButton!.trigger('click')

    expect(wrapper.text()).not.toContain('Are you sure you want to delete this assignment?')

    await wrapper.get('button.border-orange-500').trigger('click')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(wrapper.findAll('tbody tr')).toHaveLength(8)
  })

  it('the X close button also closes the modal without deleting', async () => {
    const wrapper = await mountApp('/admin/assignments/mock-1/edit')

    const deleteLink = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Delete Assignment')
    await deleteLink!.trigger('click')

    await wrapper.get('button[aria-label="Close"]').trigger('click')

    expect(wrapper.text()).not.toContain('Are you sure you want to delete this assignment?')
  })

  it('"Yes, I want to delete the assignment" deletes it and returns to the list', async () => {
    const wrapper = await mountApp('/admin/assignments/mock-1/edit')

    const deleteLink = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Delete Assignment')
    await deleteLink!.trigger('click')

    const confirmButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Yes, I want to delete the assignment')
    await confirmButton!.trigger('click')

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).toContain('Assignments')
    expect(wrapper.findAll('tbody tr')).toHaveLength(7)
  })
})
