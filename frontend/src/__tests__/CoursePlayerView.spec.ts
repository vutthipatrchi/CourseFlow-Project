import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import CoursePlayerView from '../views/CoursePlayerView.vue'
import type { CourseProgressView, SubscriptionView } from '@/api/payments'
import type { MyAssignment } from '@/types/submission'
import { DEMO_VIDEO_URL, DEMO_VIDEO_LABEL } from '@/data/demoVideo'
import { demoContentFixtures } from './demoContentFixtures'
import type { DemoContentRow } from '@/api/demoContent'
import { getEnrolledDemoContent } from '@/api/demoContent'

const mocks = vi.hoisted(() => ({
  getSubscriptions: vi.fn<() => Promise<SubscriptionView[]>>(),
  getCourseProgress: vi.fn<(courseId: number) => Promise<CourseProgressView>>(),
  getCheckoutCourse: vi.fn(async (courseId: number) => ({
    id: courseId,
    name: courseId === 9 ? 'Software Developer' : 'Service Design Essentials',
    price: 3559,
    category: 'Course',
    summary: 'Catalog summary',
    description: 'Catalog description',
    learningTime: 8,
    lessons: 6,
    imageName: null,
    accent: '#dce8fb',
  })),
  completeSubLesson:
    vi.fn<
      (
        courseId: number,
        lessonPosition: number,
        subLessonPosition: number,
      ) => Promise<CourseProgressView>
    >(),
}))
vi.mock('@/api/payments', () => mocks)

const submissionMocks = vi.hoisted(() => ({
  listMyAssignments: vi.fn<() => Promise<MyAssignment[]>>(),
  submitAssignment: vi.fn<(id: number, answer: string) => Promise<MyAssignment>>(),
}))
vi.mock('@/api/submissions', () => submissionMocks)
vi.mock('@/api/uploads', () => ({
  isProtectedVideoUrl: (source: string) => source.includes('/api/uploads/videos/'),
  authorizeVideoPlayback: vi.fn<(source: string) => Promise<void>>(async () => {}),
}))
vi.mock('@/api/demoContent', () => ({
  getEnrolledDemoContent: vi.fn<(courseId: number) => Promise<DemoContentRow[]>>(async (courseId) =>
    demoContentFixtures(courseId === 9 ? 'Software Developer' : 'Service Design Essentials'),
  ),
}))

const progress: CourseProgressView = {
  courseId: 9,
  completedLessons: 0,
  totalLessons: 1,
  progressPercent: 0,
  status: 'in-progress',
  subLessons: [
    {
      id: 99,
      title: 'Welcome to Software Development',
      videoUrl: null,
      lessonPosition: 1,
      lessonTitle: 'Getting Started as a Developer',
      subLessonPosition: 1,
      completed: false,
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  // jsdom has no IntersectionObserver; avoid auto-complete noise from a fake one.
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
    },
  )
  mocks.getCheckoutCourse.mockImplementation(async (courseId: number) => ({
    id: courseId,
    name: courseId === 9 ? 'Software Developer' : 'Service Design Essentials',
    price: 3559,
    category: 'Course',
    summary: 'Catalog summary',
    description: 'Catalog description',
    learningTime: 8,
    lessons: 6,
    imageName: null,
    accent: '#dce8fb',
  }))
  submissionMocks.listMyAssignments.mockResolvedValue([])
  mocks.getSubscriptions.mockResolvedValue([
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
  mocks.getCourseProgress.mockResolvedValue(structuredClone(progress))
  vi.mocked(getEnrolledDemoContent).mockImplementation(async (courseId) =>
    demoContentFixtures(courseId === 9 ? 'Software Developer' : 'Service Design Essentials'),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

async function mountPlayer(path = '/courses/course-9/learn/sub-1-1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/my-courses', component: { template: '<div>My Courses</div>' } },
      {
        path: '/courses/:id/learn/:subLessonId',
        name: 'course-player',
        component: CoursePlayerView,
      },
    ],
  })
  await router.push(path)
  await router.isReady()
  const wrapper = mount(CoursePlayerView, {
    global: {
      plugins: [router],
      stubs: { AppNavbar: true, AppFooter: true, CoursePlayerSidebar: true, AssignmentCard: true },
    },
  })
  return wrapper
}

function scrollToBottom() {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: 2000,
  })
  Object.defineProperty(document.body, 'scrollHeight', {
    configurable: true,
    value: 2000,
  })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 1200 })
  Object.defineProperty(document.documentElement, 'scrollTop', {
    configurable: true,
    value: 1200,
  })
  window.dispatchEvent(new Event('scroll'))
}

function sidebarProgress(wrapper: Awaited<ReturnType<typeof mountPlayer>>) {
  return wrapper.getComponent({ name: 'CoursePlayerSidebar' }).props('progressPercent')
}

describe('purchased course player', () => {
  it('shows Back to home on the last sub-lesson and opens the home page', async () => {
    const wrapper = await mountPlayer()
    await flushPromises()
    const action = wrapper.get('button.bg-blue-600')
    expect(action.text()).toBe('Back to home')
    expect(action.attributes('disabled')).toBeUndefined()
    const push = vi.spyOn(wrapper.vm.$router, 'push')
    await action.trigger('click')
    await flushPromises()
    expect(push).toHaveBeenCalledWith({ name: 'home' })
    wrapper.unmount()
  })

  it('keeps Next Lesson while another sub-lesson follows', async () => {
    const first = progress.subLessons[0]!
    mocks.getCourseProgress.mockResolvedValue({
      ...structuredClone(progress),
      subLessons: [first, { ...first, id: 100, subLessonPosition: 2, title: 'Second lesson' }],
    })
    const wrapper = await mountPlayer()
    await flushPromises()
    const action = wrapper.get('button.bg-blue-600')
    expect(action.text()).toBe('Next Lesson')
    const push = vi.spyOn(wrapper.vm.$router, 'push')
    await action.trigger('click')
    await flushPromises()
    expect(push).toHaveBeenCalledWith({
      name: 'course-player',
      params: { id: 'course-9', subLessonId: 'sub-1-2' },
    })
    wrapper.unmount()
  })

  it('does not substitute local readings when the content API fails', async () => {
    vi.mocked(getEnrolledDemoContent).mockRejectedValueOnce(
      new Error('Content service unavailable'),
    )
    const wrapper = await mountPlayer()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Content service unavailable')
    expect(wrapper.find('article').exists()).toBe(false)
    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('อ่านจบแล้ว')
    wrapper.unmount()
  })

  it.each([
    ['Course Overview', 2],
    ['Getting to Know You', 3],
    ['What is Service Design ?', 4],
  ])('can complete the named seed sub-lesson %s', async (title, subLessonPosition) => {
    const seedProgress: CourseProgressView = {
      courseId: 1,
      completedLessons: 0,
      totalLessons: 1,
      progressPercent: 0,
      status: 'in-progress',
      subLessons: [
        {
          id: 100 + subLessonPosition,
          title,
          videoUrl: 'https://example.com/videos/welcome.mp4',
          lessonPosition: 3,
          lessonTitle: 'Lesson 1',
          subLessonPosition,
          completed: false,
        },
      ],
    }
    mocks.getSubscriptions.mockResolvedValue([
      {
        id: 'subscription-1',
        courseId: 1,
        courseTitle: 'Service Design Essentials',
        reference: 'CFTEST',
        activatedAt: '2026-09-25T00:00:00Z',
        completedLessons: 0,
        totalLessons: 1,
        progressPercent: 0,
        status: 'in-progress',
      },
    ])
    mocks.getCourseProgress.mockResolvedValue(seedProgress)
    mocks.completeSubLesson.mockResolvedValue({
      ...seedProgress,
      completedLessons: 1,
      progressPercent: 100,
      status: 'completed',
      subLessons: [{ ...seedProgress.subLessons[0]!, completed: true }],
    })
    const wrapper = await mountPlayer(`/courses/course-1/learn/sub-3-${subLessonPosition}`)
    await flushPromises()
    expect(wrapper.get('article').text()).toContain(title)
    expect(wrapper.get('video').attributes('src')).toBe(DEMO_VIDEO_URL)
    scrollToBottom()
    await flushPromises()
    expect(mocks.completeSubLesson).toHaveBeenCalledExactlyOnceWith(1, 3, subLessonPosition)
    expect(sidebarProgress(wrapper)).toBe(100)
    wrapper.unmount()
  })

  it('renders a reading and self-check answer without automatically completing the lesson', async () => {
    const wrapper = await mountPlayer()
    await flushPromises()
    expect(wrapper.get('article').text()).toContain('input, process')
    expect(wrapper.get('article').text()).toContain('60, 75 and 90')
    expect(wrapper.get('details summary').text()).toBe('Show suggested answer')
    expect(wrapper.get('details').attributes('open')).toBeUndefined()
    expect(wrapper.get('video').attributes('src')).toBe(DEMO_VIDEO_URL)
    expect(wrapper.text()).toContain(DEMO_VIDEO_LABEL)
    await wrapper.get('video').trigger('play')
    await wrapper.get('video').trigger('ended')
    expect(mocks.completeSubLesson).not.toHaveBeenCalled()

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    window.dispatchEvent(new Event('scroll'))
    await flushPromises()
    expect(mocks.completeSubLesson).not.toHaveBeenCalled()

    mocks.completeSubLesson.mockResolvedValue({
      ...progress,
      completedLessons: 1,
      progressPercent: 100,
      status: 'completed',
      subLessons: [{ ...progress.subLessons[0]!, completed: true }],
    })
    scrollToBottom()
    await flushPromises()
    expect(mocks.completeSubLesson).toHaveBeenCalledExactlyOnceWith(9, 1, 1)
    expect(sidebarProgress(wrapper)).toBe(100)
    expect(wrapper.text()).not.toContain('อ่านจบแล้ว')
    wrapper.unmount()
  })

  it('keeps an unsuccessful completion retryable and does not claim success', async () => {
    mocks.completeSubLesson.mockRejectedValue(new Error('Could not save progress'))
    const errorSpy = vi.spyOn(toast, 'error')
    const wrapper = await mountPlayer()
    await flushPromises()
    scrollToBottom()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Could not save progress')
    expect(errorSpy).toHaveBeenCalledWith('Could not save progress')
    expect(sidebarProgress(wrapper)).toBe(0)
    expect(wrapper.text()).not.toContain('อ่านจบแล้ว')
    mocks.completeSubLesson.mockResolvedValue({
      ...progress,
      completedLessons: 1,
      progressPercent: 100,
      status: 'completed',
      subLessons: [{ ...progress.subLessons[0]!, completed: true }],
    })
    scrollToBottom()
    await flushPromises()
    expect(mocks.completeSubLesson).toHaveBeenCalledTimes(2)
    expect(sidebarProgress(wrapper)).toBe(100)
    wrapper.unmount()
  })

  it('leaves unknown lessons unavailable instead of supplying unrelated reading material', async () => {
    mocks.getCourseProgress.mockResolvedValue({
      ...progress,
      subLessons: [
        {
          ...progress.subLessons[0]!,
          title: 'Custom advanced workshop',
          videoUrl: 'https://example.com/videos/welcome.mp4',
        },
      ],
    })
    const wrapper = await mountPlayer()
    await flushPromises()
    expect(wrapper.find('article').exists()).toBe(false)
    expect(wrapper.find('video').exists()).toBe(false)
    expect(wrapper.text()).toContain('This lesson does not have a reading or video yet')
    expect(wrapper.text()).not.toContain('อ่านจบแล้ว')
    expect(wrapper.text()).not.toContain('เรียนจบแล้ว')
    wrapper.unmount()
  })

  it('renders a real video URL with controls, without treating play as completion', async () => {
    mocks.getCourseProgress.mockResolvedValue({
      ...progress,
      subLessons: [
        {
          ...progress.subLessons[0]!,
          title: 'Custom video lesson',
          videoUrl: '/api/uploads/videos/lesson.mp4',
        },
      ],
    })
    const wrapper = await mountPlayer()
    await flushPromises()
    const video = wrapper.get('video')
    expect(video.attributes('src')).toContain('/api/uploads/videos/lesson.mp4')
    expect(video.attributes('controls')).toBeDefined()
    expect(wrapper.text()).not.toContain(DEMO_VIDEO_LABEL)
    await video.trigger('play')
    expect(mocks.completeSubLesson).not.toHaveBeenCalled()
    await video.trigger('error')
    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to load the video')
    expect(wrapper.text()).not.toContain('เรียนจบแล้ว')
    wrapper.unmount()
  })

  it('uses the bundled clip for a known demo lesson with an example.com seed URL', async () => {
    mocks.getCourseProgress.mockResolvedValue({
      ...progress,
      subLessons: [
        { ...progress.subLessons[0]!, videoUrl: 'https://example.com/videos/welcome.mp4' },
      ],
    })
    const wrapper = await mountPlayer()
    await flushPromises()
    expect(wrapper.get('video').attributes('src')).toBe(DEMO_VIDEO_URL)
    expect(wrapper.text()).toContain(DEMO_VIDEO_LABEL)
    await wrapper.get('video').trigger('error')
    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to load the video')
    expect(wrapper.text()).not.toContain('อ่านจบแล้ว')
    expect(wrapper.text()).not.toContain('เรียนจบแล้ว')
    wrapper.unmount()
  })

  it('prefers an uploaded video even when demo reading material is available', async () => {
    mocks.getCourseProgress.mockResolvedValue({
      ...progress,
      subLessons: [{ ...progress.subLessons[0]!, videoUrl: '/api/uploads/videos/real-lesson.mp4' }],
    })
    const wrapper = await mountPlayer()
    await flushPromises()
    expect(wrapper.get('video').attributes('src')).toContain('/api/uploads/videos/real-lesson.mp4')
    expect(wrapper.text()).not.toContain(DEMO_VIDEO_LABEL)
    expect(wrapper.find('article').exists()).toBe(true)
    wrapper.unmount()
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
          title: 'Welcome to Software Development',
          videoUrl: null,
          lessonPosition: 1,
          lessonTitle: 'Getting Started as a Developer',
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
    expect(wrapper.text()).toContain('Welcome to Software Development')
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
    expect(wrapper.find('video').exists()).toBe(false)
    wrapper.unmount()
  })
})

const assignmentProgress: CourseProgressView = {
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
    mocks.getCourseProgress.mockResolvedValue(assignmentProgress)
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
    const successSpy = vi.spyOn(toast, 'success')
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
    expect(successSpy).toHaveBeenCalledWith('Assignment submitted successfully!')
  })

  it('keeps the card editable and shows the error when saving fails', async () => {
    submissionMocks.submitAssignment.mockRejectedValue(new Error('Assignment 5 not found'))
    const successSpy = vi.spyOn(toast, 'success')
    const errorSpy = vi.spyOn(toast, 'error')
    const wrapper = await mountAssignmentPlayer()

    await wrapper.get('textarea').setValue('my answer')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Send Assignment')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('Assignment 5 not found')
    expect(wrapper.find('textarea').exists()).toBe(true)
    expect(errorSpy).toHaveBeenCalledWith('Assignment 5 not found')
    expect(successSpy).not.toHaveBeenCalled()
  })

  it('still shows the course when the assignments request fails', async () => {
    submissionMocks.listMyAssignments.mockRejectedValue(new Error('Network down'))
    const errorSpy = vi.spyOn(toast, 'error')
    const wrapper = await mountAssignmentPlayer()

    expect(wrapper.get('[role="alert"]').text()).toBe('Network down')
    expect(wrapper.text()).toContain('4 Levels of Service Design')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(errorSpy).toHaveBeenCalledWith('Network down')
  })

  it('preserves the demo reading and submitted assignment when completing the lesson', async () => {
    const demoProgress: CourseProgressView = {
      ...assignmentProgress,
      subLessons: assignmentProgress.subLessons.map((lesson, index) =>
        index === 0 ? { ...lesson, title: 'Introduction to Service Design' } : lesson,
      ),
    }
    mocks.getCourseProgress.mockResolvedValue(demoProgress)
    submissionMocks.submitAssignment.mockResolvedValue({
      ...assignment,
      status: 'submitted',
      answer: 'People, process',
      submittedAt: '2026-09-28T00:00:00Z',
    })
    mocks.completeSubLesson.mockResolvedValue({
      ...demoProgress,
      completedLessons: 1,
      progressPercent: 50,
      subLessons: demoProgress.subLessons.map((lesson, index) =>
        index === 0 ? { ...lesson, completed: true } : lesson,
      ),
    })
    const wrapper = await mountAssignmentPlayer()
    expect(wrapper.find('article').exists()).toBe(true)
    expect(wrapper.get('video').attributes('src')).toBe(DEMO_VIDEO_URL)

    await wrapper.get('textarea').setValue('People, process')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Send Assignment')!
      .trigger('click')
    await flushPromises()
    expect(submissionMocks.submitAssignment).toHaveBeenCalledExactlyOnceWith(5, 'People, process')
    expect(wrapper.find('article').exists()).toBe(true)

    scrollToBottom()
    await flushPromises()
    expect(mocks.completeSubLesson).toHaveBeenCalledExactlyOnceWith(1, 1, 1)
    expect(wrapper.text()).toContain('Submitted')
    expect(wrapper.text()).toContain('People, process')
    expect(wrapper.find('article').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('อ่านจบแล้ว')
    wrapper.unmount()
  })
})
