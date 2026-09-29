import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import CourseDetailView from '@/views/CourseDetailView.vue'
import ModuleAccordion from '@/components/course/ModuleAccordion.vue'
import { createDemoModules } from '@/data/demoLessons'
import { demoContentFixtures } from './demoContentFixtures'
import type { DemoContentRow } from '@/api/demoContent'
import { getPublicDemoContent } from '@/api/demoContent'
import { getCheckoutCourse } from '@/api/payments'
import { getCourseAccess } from '@/lib/courseAccess'

afterEach(() => vi.restoreAllMocks())

vi.mock('@/api/demoContent', () => ({
  getPublicDemoContent: vi.fn<(courseTitle: string) => Promise<DemoContentRow[]>>(
    async (courseTitle) =>
      demoContentFixtures(courseTitle).map((row, index) =>
        index === 0 ? row : { ...row, reading: null },
      ),
  ),
}))

vi.mock('@/api/payments', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/payments')>()
  return {
    ...actual,
    getCheckoutCourse: vi.fn(async () => ({
      id: 9,
      name: 'Software Developer',
      price: 3559,
      category: 'Course',
      summary: 'Build a solid foundation in programming and modern software development.',
      description: 'Build a solid foundation in programming and modern software development.',
      learningTime: 10,
      lessons: 6,
      imageName: null,
      accent: '#dce8fb',
    })),
  }
})

vi.mock('@/lib/courseAccess', () => ({
  getCourseAccess: vi.fn(async () => ({
    enrolled: false,
    checkoutCourse: {
      id: 9,
      name: 'Software Developer',
      price: 3559,
      category: 'Course',
      summary: null,
      description: null,
      learningTime: null,
      lessons: 6,
      imageName: null,
      accent: null,
    },
    subscriptionCourseId: null,
  })),
  learningPathForSubscription: (courseId: number) => `/courses/course-${courseId}/learn/sub-1-1`,
}))

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/courses/:id', component: CourseDetailView },
      { path: '/courses', component: { template: '<div>Courses</div>' } },
      {
        path: '/learn/:courseId',
        name: 'learning-progress',
        component: { template: '<div>Learn</div>' },
      },
      { path: '/payment', name: 'payment', component: { template: '<div>Payment</div>' } },
      {
        path: '/courses/:id/learn/:subLessonId',
        name: 'course-player',
        component: { template: '<div>Player</div>' },
      },
    ],
  })
  await router.push('/courses/course-9')
  await router.isReady()
  const wrapper = mount(CourseDetailView, {
    global: {
      plugins: [router],
      stubs: { AppNavbar: true, AppFooter: true, CtaBanner: true, SubscribeCard: true },
    },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('Module Samples previews', () => {
  it('hides Start learning until the course is purchased', async () => {
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: false,
      checkoutCourse: null,
      subscriptionCourseId: null,
    })
    const { wrapper, router } = await mountPage()
    expect(wrapper.text()).toContain('Subscribe to this course to unlock Start learning')
    expect(
      wrapper.findAll('button').some((button) => button.text().includes('Start learning')),
    ).toBe(false)
    expect(router.currentRoute.value.name).not.toBe('course-player')
    wrapper.unmount()
  })

  it('shows Start learning and opens the course player after purchase', async () => {
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: true,
      checkoutCourse: null,
      subscriptionCourseId: 9,
    })
    const { wrapper, router } = await mountPage()
    const start = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Start learning'))
    expect(start).toBeTruthy()
    await start!.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/courses/course-9/learn/sub-1-1')
    wrapper.unmount()
  })

  it('shows a retryable error when the backend cannot supply preview readings', async () => {
    vi.mocked(getPublicDemoContent).mockRejectedValueOnce(new Error('Unavailable'))
    const { wrapper } = await mountPage()
    expect(wrapper.get('[role="alert"]').text()).toContain('Unable to load the sample lesson')
    expect(wrapper.find('article').exists()).toBe(false)
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('article').exists()).toBe(true)
    wrapper.unmount()
  })

  it('keeps locked module readings out of the public preview', async () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const { wrapper } = await mountPage()
    const module = wrapper.findAllComponents(ModuleAccordion)[1]!
    const toggle = module.get('button')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(module.find('details').exists()).toBe(false)
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(module.text()).toContain('Development Tools')
    expect(module.find('details').exists()).toBe(false)
    expect(module.find('article').exists()).toBe(false)
    await toggle.trigger('click')
    expect(pause).not.toHaveBeenCalled()
    expect(module.find('video').exists()).toBe(false)
    wrapper.unmount()
  })

  it('closes the clip and clears its error before reopening; changing courses resets previews', async () => {
    vi.mocked(getCheckoutCourse)
      .mockResolvedValueOnce({
        id: 9,
        name: 'Software Developer',
        price: 3559,
        category: 'Course',
        summary: 'Build a solid foundation in programming and modern software development.',
        description: 'Build a solid foundation in programming and modern software development.',
        learningTime: 10,
        lessons: 6,
        imageName: null,
        accent: '#dce8fb',
      })
      .mockResolvedValueOnce({
        id: 10,
        name: 'UX/UI Design Beginner',
        price: 3559,
        category: 'Course',
        summary: 'Get started designing intuitive products.',
        description: 'Get started designing intuitive products.',
        learningTime: 9,
        lessons: 6,
        imageName: null,
        accent: '#fce4cf',
      })
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const { wrapper, router } = await mountPage()
    const module = wrapper.findComponent(ModuleAccordion)
    const sample = module.get('details')
    ;(sample.element as HTMLDetailsElement).open = true
    await sample.trigger('toggle')
    await sample.get('video').trigger('error')
    expect(sample.get('[role="alert"]').text()).toContain('Unable to load the sample clip')
    expect(sample.find('article').exists()).toBe(true)
    ;(sample.element as HTMLDetailsElement).open = false
    await sample.trigger('toggle')
    expect(pause).toHaveBeenCalledOnce()
    expect(sample.find('video').exists()).toBe(false)
    ;(sample.element as HTMLDetailsElement).open = true
    await sample.trigger('toggle')
    expect(sample.find('[role="alert"]').exists()).toBe(false)
    await router.push('/courses/course-10')
    await flushPromises()
    expect(pause).toHaveBeenCalledTimes(2)
    const nextModule = wrapper.findComponent(ModuleAccordion)
    expect(nextModule.get('summary').text()).toContain('Design Foundations')
    expect(nextModule.find('video').exists()).toBe(false)
    wrapper.unmount()
  })

  it('preserves lesson selection in the enrolled-course sidebar', async () => {
    const module = createDemoModules(demoContentFixtures('Software Developer'))[0]!
    const wrapper = mount(ModuleAccordion, {
      props: { module, index: 0, defaultOpen: true, interactive: true },
    })
    await wrapper.get('li button').trigger('click')
    expect(wrapper.emitted('select')).toEqual([[module.subLessons[0]!.id]])
    expect(wrapper.find('details').exists()).toBe(false)
    wrapper.unmount()
  })
})
