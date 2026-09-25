import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import CoursePlayerView from '../views/CoursePlayerView.vue'
import type { CourseProgressView, SubscriptionView } from '@/api/payments'
import type { MyAssignment } from '@/types/submission'

const mocks = vi.hoisted(() => ({
  getSubscriptions: vi.fn<() => Promise<SubscriptionView[]>>(),
  getCourseProgress: vi.fn<(courseId: number) => Promise<CourseProgressView>>(),
  completeSubLesson: vi.fn<() => Promise<CourseProgressView>>(),
}))
vi.mock('@/api/payments', () => mocks)

const submissionMocks = vi.hoisted(() => ({
  listMyAssignments: vi.fn<() => Promise<MyAssignment[]>>(),
  submitAssignment: vi.fn<(id: number, answer: string) => Promise<MyAssignment>>(),
}))
vi.mock('@/api/submissions', () => submissionMocks)

async function mountPlayer() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/my-courses', component: { template: '<div>My Courses</div>' } },
      {
        path: '/courses/:id/learn/:subLessonId',
        name: 'course-player',
        component: CoursePlayerView,
      },
    ],
  })
  await router.push('/courses/course-9/learn/sub-1-1')
  await router.isReady()
  const wrapper = mount(CoursePlayerView, {
    global: {
      plugins: [router],
      stubs: { AppNavbar: true, AppFooter: true, CoursePlayerSidebar: true, AssignmentCard: true },
    },
  })
  return wrapper
}

describe('purchased course player', () => {
  beforeEach(() => {
    submissionMocks.listMyAssignments.mockResolvedValue([])
  })

  it('shows the server lesson only after subscription and progress are loaded', async () => {
    let resolveSubscriptions!: (courses: SubscriptionView[]) => void
    mocks.getSubscriptions.mockImplementation(
      () => new Promise((resolve) => (resolveSubscriptions = resolve)),
    )
    mocks.getCourseProgress.mockResolvedValue({
      courseId: 9,
      completedLessons: 0,
      totalLessons: 1,
      progressPercent: 0,
      status: 'in-progress',
      subLessons: [
        {
          id: 99,
          title: 'Introduction to Programming',
          videoUrl: null,
          lessonPosition: 1,
          lessonTitle: 'Introduction',
          subLessonPosition: 1,
          completed: false,
        },
      ],
    })
    const wrapper = await mountPlayer()
    expect(wrapper.text()).toContain('Loading your course')
    expect(wrapper.text()).not.toContain('UX/UI Design Beginner')

    resolveSubscriptions([
      {
        id: 'subscription-9',
        courseId: 9,
        courseTitle: 'Software Developer',
        reference: 'CFTEST',
        activatedAt: '2026-09-25T00:00:00Z',
        completedLessons: 0,
        totalLessons: 1,
        progressPercent: 0,
        status: 'in-progress',
      },
    ])
    await flushPromises()
    expect(wrapper.text()).toContain('Introduction to Programming')
    expect(wrapper.text()).not.toContain('UX/UI Design Beginner')
    wrapper.unmount()
  })

  it('does not show mock lessons when entitlement check fails', async () => {
    mocks.getSubscriptions.mockResolvedValue([])
    mocks.getCourseProgress.mockRejectedValue(new Error('Active course subscription not found'))
    const wrapper = await mountPlayer()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Active course subscription not found')
    expect(wrapper.text()).not.toContain('Welcome to the Course')
    wrapper.unmount()
  })
})

const progress: CourseProgressView = {
  courseId: 1,
  completedLessons: 0,
  totalLessons: 2,
  progressPercent: 0,
  status: 'in-progress',
  subLessons: [
    {
      id: 7,
      title: '4 Levels of Service Design',
      videoUrl: null,
      lessonPosition: 1,
      lessonTitle: 'Introduction',
      subLessonPosition: 1,
      completed: false,
    },
    {
      id: 8,
      title: 'Scope of Service Design',
      videoUrl: null,
      lessonPosition: 1,
      lessonTitle: 'Introduction',
      subLessonPosition: 2,
      completed: false,
    },
  ],
}

const assignment: MyAssignment = {
  id: 5,
  description: 'What are the 4 elements of service design?',
  courseId: 1,
  courseName: 'Service Design Essentials',
  lessonName: 'Introduction',
  lessonPosition: 1,
  subLessonId: 7,
  subLessonName: '4 Levels of Service Design',
  subLessonPosition: 1,
  durationDays: 2,
  status: 'pending',
  answer: null,
  submittedAt: null,
}

async function mountAssignmentPlayer(path = '/courses/course-1/learn/sub-1-1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/courses/:id/learn/:subLessonId',
        name: 'course-player',
        component: { template: '<div />' },
      },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(CoursePlayerView, {
    global: {
      plugins: [router],
      stubs: { AppNavbar: true, AppFooter: true, CoursePlayerSidebar: true },
    },
  })
  await flushPromises()
  return wrapper
}

describe('CoursePlayerView assignments on a real course', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSubscriptions.mockResolvedValue([
      {
        id: 'sub-1',
        courseId: 1,
        courseTitle: 'Service Design Essentials',
        reference: 'R1',
        activatedAt: '2026-09-20T00:00:00Z',
        completedLessons: 0,
        totalLessons: 2,
        progressPercent: 0,
        status: 'in-progress',
      },
    ])
    mocks.getCourseProgress.mockResolvedValue(progress)
    submissionMocks.listMyAssignments.mockResolvedValue([assignment])
  })

  it('shows the assignment of the open sub-lesson with its status and deadline', async () => {
    const wrapper = await mountAssignmentPlayer()

    expect(wrapper.text()).toContain('What are the 4 elements of service design?')
    expect(wrapper.text()).toContain('Pending')
    expect(wrapper.text()).toContain('Assign within 2 days')
  })

  it('shows no assignment card on a sub-lesson without one', async () => {
    const wrapper = await mountAssignmentPlayer('/courses/course-1/learn/sub-1-2')

    expect(wrapper.text()).toContain('Scope of Service Design')
    expect(wrapper.text()).not.toContain('What are the 4 elements of service design?')
    expect(wrapper.find('textarea').exists()).toBe(false)
  })

  it('saves the answer through the API and turns the card into Submitted', async () => {
    submissionMocks.submitAssignment.mockResolvedValue({
      ...assignment,
      status: 'submitted',
      answer: 'People, process',
      submittedAt: '2026-09-24T00:00:00Z',
    })
    const wrapper = await mountAssignmentPlayer()

    await wrapper.get('textarea').setValue('People, process')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Send Assignment')!
      .trigger('click')
    await flushPromises()

    expect(submissionMocks.submitAssignment).toHaveBeenCalledWith(5, 'People, process')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.text()).toContain('Submitted')
    expect(wrapper.text()).toContain('People, process')
    expect(wrapper.text()).toContain('Assignment submitted successfully!')
  })

  it('keeps the card editable and shows the error when saving fails', async () => {
    submissionMocks.submitAssignment.mockRejectedValue(new Error('Assignment 5 not found'))
    const wrapper = await mountAssignmentPlayer()

    await wrapper.get('textarea').setValue('my answer')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Send Assignment')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Assignment 5 not found')
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Assignment submitted successfully!')
  })

  it('still shows the course when the assignments request fails', async () => {
    submissionMocks.listMyAssignments.mockRejectedValue(new Error('Network down'))
    const wrapper = await mountAssignmentPlayer()

    expect(wrapper.get('[role="alert"]').text()).toBe('Network down')
    expect(wrapper.text()).toContain('4 Levels of Service Design')
    expect(wrapper.find('textarea').exists()).toBe(false)
  })
})
