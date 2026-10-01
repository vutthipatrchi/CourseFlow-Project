import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import LearningProgressView from '../views/LearningProgressView.vue'
import { getCheckoutCourse } from '@/api/payments'
import { getCourseAccess } from '@/lib/courseAccess'

vi.mock('@/api/payments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/payments')>()
  return {
    ...actual,
    getCheckoutCourse: vi.fn(async () => ({
      id: 1,
      name: 'Service Design Essentials',
      price: 3559,
      category: 'Course',
      summary: 'Learn service design',
      description: 'Learn service design',
      learningTime: 8,
      lessons: 6,
      imageName: null,
      accent: '#dce8fb',
    })),
  }
})

vi.mock('@/lib/courseAccess', () => ({
  getCourseAccess: vi.fn(async () => ({
    enrolled: false,
    checkoutCourse: null,
    subscriptionCourseId: null,
  })),
  learningPathForSubscription: (courseId: number) => `/courses/course-${courseId}/learn/sub-1-1`,
}))

async function mountView(path = '/learn/course-1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/learn/:courseId',
        name: 'learning-progress',
        component: LearningProgressView,
      },
      { path: '/courses/:id', component: { template: '<div>Detail</div>' } },
      { path: '/my-courses', component: { template: '<div>My Courses</div>' } },
      { path: '/payment', name: 'payment', component: { template: '<div>Payment</div>' } },
      {
        path: '/courses/:id/learn/:subLessonId',
        name: 'course-player',
        component: { template: '<div>Player</div>' },
      },
    ],
  })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(LearningProgressView, {
    global: {
      plugins: [router],
      stubs: { AppNavbar: true, AppFooter: true },
    },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('learning progress access gate', () => {
  beforeEach(() => {
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: false,
      checkoutCourse: null,
      subscriptionCourseId: null,
    })
  })

  it('blocks learning when the course is not purchased', async () => {
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper } = await mountView()
    expect(wrapper.get('[role="alert"]').text()).toContain('Purchase this course to start learning')
    expect(wrapper.text()).toContain('Subscribe this course')
    expect(errorSpy).toHaveBeenCalledWith('Purchase this course to start learning.')
  })

  it('sends purchased learners to the course player', async () => {
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: true,
      checkoutCourse: null,
      subscriptionCourseId: 1,
    })
    const { router } = await mountView()
    expect(router.currentRoute.value.fullPath).toBe('/courses/course-1/learn/sub-1-1')
    expect(vi.mocked(getCheckoutCourse)).toHaveBeenCalled()
  })

  it('raises a matching toast when the course id in the link is invalid', async () => {
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper } = await mountView('/learn/not-a-course')

    expect(wrapper.get('[role="alert"]').text()).toContain('Course not found.')
    expect(errorSpy).toHaveBeenCalledWith('Course not found.')
  })

  it('raises a matching toast when checking access fails', async () => {
    vi.mocked(getCheckoutCourse).mockRejectedValue(new Error('The server is unreachable.'))
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper } = await mountView()

    expect(wrapper.get('[role="alert"]').text()).toBe('The server is unreachable.')
    expect(errorSpy).toHaveBeenCalledWith('The server is unreachable.')
  })
})
