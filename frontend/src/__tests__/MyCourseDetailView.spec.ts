import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import MyCourseDetailView from '../views/MyCourseDetailView.vue'
import type { CourseProgressView, SubscriptionView } from '@/api/payments'
import { demoContentFixtures } from './demoContentFixtures'
import type { DemoContentRow } from '@/api/demoContent'

const mocks = vi.hoisted(() => ({
  getSubscriptions: vi.fn<() => Promise<SubscriptionView[]>>(),
  getCourseProgress: vi.fn<(courseId: number) => Promise<CourseProgressView>>(),
  getCheckoutCourse: vi.fn(async (courseId: number) => ({
    id: courseId,
    name: courseId === 1 ? 'Service Design Essentials' : 'Software Developer',
    price: 3559,
    category: 'Course',
    summary: 'Catalog summary',
    description: 'Catalog description',
    learningTime: 8,
    lessons: 6,
    imageName: null,
    accent: '#dce8fb',
  })),
}))
vi.mock('@/api/payments', () => mocks)
vi.mock('@/api/demoContent', () => ({
  getEnrolledDemoContent: vi.fn<(courseId: number) => Promise<DemoContentRow[]>>(async (courseId) =>
    demoContentFixtures(courseId === 1 ? 'Service Design Essentials' : 'Software Developer'),
  ),
}))
vi.mock('@/components/landing/AppNavbar.vue', () => ({
  default: { template: '<header>Navbar</header>' },
}))
vi.mock('@/components/landing/AppFooter.vue', () => ({
  default: { template: '<footer>Footer</footer>' },
}))

async function mountPage(courseId = 1) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/my-courses', component: { template: '<div>My Courses</div>' } },
      { path: '/my-courses/:courseId', component: MyCourseDetailView },
      {
        path: '/courses/:id/learn/:subLessonId',
        name: 'course-player',
        component: { template: '<div>Player</div>' },
      },
    ],
  })
  await router.push(`/my-courses/${courseId}`)
  await router.isReady()
  const wrapper = mount(MyCourseDetailView, { global: { plugins: [router] } })
  await flushPromises()
  return { router, wrapper }
}

beforeEach(() => {
  vi.resetAllMocks()
  mocks.getSubscriptions.mockResolvedValue([
    {
      id: 'subscription-1',
      courseId: 1,
      courseTitle: 'Service Design Essentials',
      reference: 'CF123',
      activatedAt: '2026-09-20T00:00:00Z',
      completedLessons: 1,
      totalLessons: 2,
      progressPercent: 50,
      status: 'in-progress',
    },
  ])
  mocks.getCourseProgress.mockResolvedValue({
    courseId: 1,
    completedLessons: 1,
    totalLessons: 2,
    progressPercent: 50,
    status: 'in-progress',
    subLessons: [
      {
        id: 10,
        title: 'Welcome',
        videoUrl: null,
        lessonPosition: 1,
        lessonTitle: 'Introduction',
        subLessonPosition: 1,
        completed: true,
      },
      {
        id: 11,
        title: 'Course Overview',
        videoUrl: null,
        lessonPosition: 1,
        lessonTitle: 'Introduction',
        subLessonPosition: 2,
        completed: false,
      },
    ],
  })
})

describe('MyCourseDetailView', () => {
  it('shows the purchased course and opens the first unfinished lesson', async () => {
    const { router, wrapper } = await mountPage()
    expect(wrapper.text()).toContain('Service Design Essentials')
    expect(wrapper.text()).toContain('Welcome')
    expect(wrapper.text()).toContain('Course Overview')
    expect(wrapper.get('header').text()).toBe('Navbar')
    expect(wrapper.get('footer').text()).toBe('Footer')
    expect(mocks.getCourseProgress).toHaveBeenCalledWith(1)
    await wrapper.get('a[aria-label="Start learning Service Design Essentials"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/courses/course-1/learn/sub-1-2')
    wrapper.unmount()
  })

  it('does not show details for a course outside the user subscriptions', async () => {
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper } = await mountPage(2)
    expect(wrapper.get('[role="alert"]').text()).toBe('This course is not in your courses.')
    expect(mocks.getCourseProgress).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledWith('This course is not in your courses.')
    wrapper.unmount()
  })

  it('raises a matching toast when loading the course fails', async () => {
    mocks.getSubscriptions.mockRejectedValue(new Error('The server is unreachable.'))
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper } = await mountPage()
    expect(wrapper.get('[role="alert"]').text()).toBe('The server is unreachable.')
    expect(errorSpy).toHaveBeenCalledWith('The server is unreachable.')
    wrapper.unmount()
  })
})
