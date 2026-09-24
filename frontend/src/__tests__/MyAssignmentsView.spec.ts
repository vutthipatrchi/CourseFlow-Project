import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import MyAssignmentsView from '../views/MyAssignmentsView.vue'
import { listMyAssignments, submitAssignment } from '@/api/submissions'
import type { MyAssignment } from '@/types/submission'

vi.mock('@/api/submissions')

const pending: MyAssignment = {
  id: 5,
  description: 'What are the 4 elements of service design?',
  courseId: 1,
  courseName: 'Service Design Essentials',
  lessonName: 'Introduction',
  lessonPosition: 2,
  subLessonId: 7,
  subLessonName: '4 Levels of Service Design',
  subLessonPosition: 3,
  durationDays: 2,
  dueAt: '2026-09-30T00:00:00Z',
  status: 'pending',
  answer: null,
  submittedAt: null,
}

const submitted: MyAssignment = {
  ...pending,
  id: 6,
  description: 'What is service system design?',
  status: 'submitted',
  answer: 'Planning people, infrastructure and communication.',
  submittedAt: '2026-09-20T00:00:00Z',
}

const overdue: MyAssignment = {
  ...pending,
  id: 8,
  description: 'Introduce yourself',
  status: 'overdue',
}

async function mountView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  const wrapper = mount(MyAssignmentsView, {
    global: {
      plugins: [router],
      stubs: { AppNavbar: true, AppFooter: true },
    },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('MyAssignmentsView', () => {
  it('lists the assignments returned by the API with their status and course link', async () => {
    vi.mocked(listMyAssignments).mockResolvedValue([pending, submitted, overdue])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Course: Service Design Essentials')
    expect(wrapper.text()).toContain('Introduction: 4 Levels of Service Design')
    expect(wrapper.text()).toContain('Pending')
    expect(wrapper.text()).toContain('Submitted')
    expect(wrapper.text()).toContain('Overdue')
    expect(wrapper.text()).toContain('Planning people, infrastructure and communication.')
    expect(wrapper.find('a[href="/courses/course-1/learn/sub-2-3"]').exists()).toBe(true)
  })

  it('shows an empty state when there are no assignments', async () => {
    vi.mocked(listMyAssignments).mockResolvedValue([])

    const wrapper = await mountView()

    expect(wrapper.text()).toContain('No assignments in this tab yet.')
  })

  it('shows the error and reloads on "Try again"', async () => {
    vi.mocked(listMyAssignments)
      .mockRejectedValueOnce(new Error('Network down'))
      .mockResolvedValueOnce([pending])

    const wrapper = await mountView()
    expect(wrapper.get('[role="alert"]').text()).toBe('Network down')

    await wrapper.get('button.cursor-pointer.font-bold').trigger('click')
    await flushPromises()

    expect(listMyAssignments).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Course: Service Design Essentials')
  })

  it('filters by tab: "In progress" hides submitted, "Submitted" shows only submitted', async () => {
    vi.mocked(listMyAssignments).mockResolvedValue([pending, submitted, overdue])
    const wrapper = await mountView()

    const tabButton = (label: string) =>
      wrapper.findAll('button').find((button) => button.text() === label)!

    await tabButton('In progress').trigger('click')
    expect(wrapper.text()).toContain('Introduce yourself')
    expect(wrapper.text()).not.toContain('What is service system design?')

    await tabButton('Submitted').trigger('click')
    expect(wrapper.text()).toContain('What is service system design?')
    expect(wrapper.text()).not.toContain('Introduce yourself')
  })

  it('submits an answer through the API and flips the card to Submitted', async () => {
    vi.mocked(listMyAssignments).mockResolvedValue([pending])
    vi.mocked(submitAssignment).mockResolvedValue({
      ...pending,
      status: 'submitted',
      answer: 'People, process, products, partners',
      submittedAt: '2026-09-24T00:00:00Z',
    })
    const wrapper = await mountView()

    await wrapper.get('textarea').setValue('People, process, products, partners')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Submit')!
      .trigger('click')
    await flushPromises()

    expect(submitAssignment).toHaveBeenCalledWith(5, 'People, process, products, partners')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.text()).toContain('Submitted')
    expect(wrapper.text()).toContain('People, process, products, partners')
  })

  it('keeps the card editable and shows the error when submitting fails', async () => {
    vi.mocked(listMyAssignments).mockResolvedValue([pending])
    vi.mocked(submitAssignment).mockRejectedValue(new Error('Assignment 5 not found'))
    const wrapper = await mountView()

    await wrapper.get('textarea').setValue('my answer')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Submit')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Assignment 5 not found')
    expect(wrapper.find('textarea').exists()).toBe(true)
  })
})
