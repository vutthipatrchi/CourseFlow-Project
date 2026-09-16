import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { RouterView, createRouter, createWebHistory } from 'vue-router'

const RootStub = defineComponent({
  components: { RouterView },
  template: '<RouterView />',
})

// The assignments "service" keeps its mock data in a module-level singleton so
// creates persist across a real page navigation (see services/assignments.ts).
// Reset the module registry per test so that singleton doesn't leak between
// tests in this file.
async function mountApp(initialPath: string) {
  vi.resetModules()
  const [{ default: AssignmentsView }, { default: AddAssignmentView }] = await Promise.all([
    import('../views/admin/AssignmentsView.vue'),
    import('../views/admin/AddAssignmentView.vue'),
  ])
  const router = createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/admin/assignments', name: 'admin-assignments', component: AssignmentsView },
      {
        path: '/admin/assignments/new',
        name: 'admin-assignments-new',
        component: AddAssignmentView,
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

function selectOptionTexts(wrapper: Awaited<ReturnType<typeof mountApp>>, selector: string) {
  return wrapper
    .get(selector)
    .findAll('option')
    .map((option) => option.text())
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('Add Assignment flow', () => {
  it('navigates to the Add Assignment page from the list, as a full page (not a modal)', async () => {
    const wrapper = await mountApp('/admin/assignments')
    await wrapper.get('a.bg-blue-600').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Add Assignment')
    expect(wrapper.find('#course').exists()).toBe(true)
  })

  it('disables Lesson and Sub-lesson until their parent is chosen, and cascades options per course', async () => {
    const wrapper = await mountApp('/admin/assignments/new')

    expect((wrapper.get('#lesson').element as HTMLSelectElement).disabled).toBe(true)
    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).disabled).toBe(true)

    await wrapper.get('#course').setValue('service-design-essentials')
    expect((wrapper.get('#lesson').element as HTMLSelectElement).disabled).toBe(false)
    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).disabled).toBe(true)
    expect(selectOptionTexts(wrapper, '#lesson')).toEqual([
      'Select Lesson',
      'Introduction',
      'Research Methods',
    ])

    await wrapper.get('#lesson').setValue('introduction')
    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).disabled).toBe(false)
    expect(selectOptionTexts(wrapper, '#sub-lesson')).toEqual([
      'Select Sub-lesson',
      '4 Levels of Service Design',
      'Service Design Principles',
    ])

    // Switching to a different course must show that course's own lessons.
    await wrapper.get('#course').setValue('ux-research-basics')
    expect(selectOptionTexts(wrapper, '#lesson')).toEqual(['Select Lesson', 'Getting Started'])
  })

  it('resets Lesson and Sub-lesson when the Course changes', async () => {
    const wrapper = await mountApp('/admin/assignments/new')

    await wrapper.get('#course').setValue('service-design-essentials')
    await wrapper.get('#lesson').setValue('introduction')
    await wrapper.get('#sub-lesson').setValue('4-levels-of-service-design')

    await wrapper.get('#course').setValue('ux-research-basics')

    expect((wrapper.get('#lesson').element as HTMLSelectElement).value).toBe('')
    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).value).toBe('')
    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).disabled).toBe(true)
  })

  it('resets Sub-lesson when the Lesson changes', async () => {
    const wrapper = await mountApp('/admin/assignments/new')

    await wrapper.get('#course').setValue('service-design-essentials')
    await wrapper.get('#lesson').setValue('introduction')
    await wrapper.get('#sub-lesson').setValue('4-levels-of-service-design')

    await wrapper.get('#lesson').setValue('research-methods')

    expect((wrapper.get('#sub-lesson').element as HTMLSelectElement).value).toBe('')
  })

  it('shows a validation error for every empty field when Create is clicked, and does not navigate away', async () => {
    const wrapper = await mountApp('/admin/assignments/new')

    await wrapper.get('button.bg-blue-600').trigger('click')

    expect(wrapper.text()).toContain('Please select a course.')
    expect(wrapper.text()).toContain('Please select a lesson.')
    expect(wrapper.text()).toContain('Please select a sub-lesson.')
    expect(wrapper.text()).toContain('Please enter the assignment detail.')
    expect(wrapper.find('#course').exists()).toBe(true)
  })

  it('only shows errors for the fields still left empty', async () => {
    const wrapper = await mountApp('/admin/assignments/new')

    await wrapper.get('#course').setValue('service-design-essentials')
    await wrapper.get('#lesson').setValue('introduction')
    await wrapper.get('#sub-lesson').setValue('4-levels-of-service-design')
    await wrapper.get('button.bg-blue-600').trigger('click')

    expect(wrapper.text()).not.toContain('Please select a course.')
    expect(wrapper.text()).not.toContain('Please select a lesson.')
    expect(wrapper.text()).not.toContain('Please select a sub-lesson.')
    expect(wrapper.text()).toContain('Please enter the assignment detail.')
  })

  it('creates the assignment once every field is filled and returns to the list showing the new row', async () => {
    const wrapper = await mountApp('/admin/assignments/new')

    await wrapper.get('#course').setValue('service-design-essentials')
    await wrapper.get('#lesson').setValue('introduction')
    await wrapper.get('#sub-lesson').setValue('4-levels-of-service-design')
    await wrapper.get('#assignment').setValue('Cascading form smoke test')
    await wrapper.get('button.bg-blue-600').trigger('click')

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).toContain('Assignments')
    expect(wrapper.text()).toContain('Cascading form smoke test')
    expect(wrapper.findAll('tbody tr')).toHaveLength(9)
  })

  it('cancels without creating an assignment', async () => {
    const wrapper = await mountApp('/admin/assignments/new')

    await wrapper.get('#course').setValue('service-design-essentials')
    await wrapper.get('#assignment').setValue('Should not be saved')
    await wrapper.get('button.border-orange-500').trigger('click')

    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()

    expect(wrapper.text()).toContain('Assignments')
    expect(wrapper.text()).not.toContain('Should not be saved')
    expect(wrapper.findAll('tbody tr')).toHaveLength(8)
  })
})
