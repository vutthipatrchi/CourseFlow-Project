import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import CoursePlayerView from '../views/CoursePlayerView.vue'
import type { CourseProgressView, SubscriptionView } from '@/api/payments'
import { DEMO_VIDEO_URL, DEMO_VIDEO_LABEL } from '@/data/demoVideo'

const mocks = vi.hoisted(() => ({
  getSubscriptions: vi.fn<() => Promise<SubscriptionView[]>>(),
  getCourseProgress: vi.fn<(courseId: number) => Promise<CourseProgressView>>(),
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

const progress: CourseProgressView = {
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
      lessonTitle: 'Introduction to Programming',
      subLessonPosition: 1,
      completed: false,
    },
  ],
}

beforeEach(() => {
  vi.resetAllMocks()
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
})

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
  it('renders a reading and self-check answer without automatically completing the lesson', async () => {
    const wrapper = await mountPlayer()
    await flushPromises()
    expect(wrapper.get('article').text()).toContain('input, process')
    expect(wrapper.get('article').text()).toContain('60, 75 และ 90')
    expect(wrapper.get('details summary').text()).toBe('ดูแนวคำตอบ')
    expect(wrapper.get('details').attributes('open')).toBeUndefined()
    expect(wrapper.get('video').attributes('src')).toBe(DEMO_VIDEO_URL)
    expect(wrapper.text()).toContain(DEMO_VIDEO_LABEL)
    await wrapper.get('video').trigger('play')
    await wrapper.get('video').trigger('ended')
    expect(mocks.completeSubLesson).not.toHaveBeenCalled()

    mocks.completeSubLesson.mockResolvedValue({
      ...progress,
      completedLessons: 1,
      progressPercent: 100,
      status: 'completed',
      subLessons: [{ ...progress.subLessons[0]!, completed: true }],
    })
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'อ่านจบแล้ว')!
      .trigger('click')
    await flushPromises()
    expect(mocks.completeSubLesson).toHaveBeenCalledExactlyOnceWith(9, 1, 1)
    expect(wrapper.text()).toContain('Completed')
    expect(wrapper.text()).not.toContain('อ่านจบแล้ว')
    wrapper.unmount()
  })

  it('keeps an unsuccessful completion retryable and does not claim success', async () => {
    mocks.completeSubLesson.mockRejectedValue(new Error('Could not save progress'))
    const wrapper = await mountPlayer()
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'อ่านจบแล้ว')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Could not save progress')
    expect(wrapper.text()).not.toContain('Completed')
    expect(
      wrapper
        .findAll('button')
        .find((button) => button.text() === 'อ่านจบแล้ว')!
        .attributes('disabled'),
    ).toBeUndefined()
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
    expect(wrapper.text()).toContain('บทนี้ยังไม่มีเนื้อหา')
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
    expect(wrapper.get('[role="alert"]').text()).toContain('ไม่สามารถโหลดวิดีโอได้')
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
    expect(wrapper.get('[role="alert"]').text()).toContain('ไม่สามารถโหลดวิดีโอได้')
    expect(wrapper.text()).toContain('อ่านจบแล้ว')
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
    expect(wrapper.find('video').exists()).toBe(false)
    wrapper.unmount()
  })
})
