import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import CoursePlayerView from '../views/CoursePlayerView.vue'
import type { CourseProgressView, SubscriptionView } from '@/api/payments'

const mocks = vi.hoisted(() => ({
  getSubscriptions: vi.fn<() => Promise<SubscriptionView[]>>(),
  getCourseProgress: vi.fn<(courseId: number) => Promise<CourseProgressView>>(),
  completeSubLesson: vi.fn(),
}))
vi.mock('@/api/payments', () => mocks)

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
