import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import CourseDetailView from '@/views/CourseDetailView.vue'
import ModuleAccordion from '@/components/course/ModuleAccordion.vue'
import { createDemoModules } from '@/data/demoLessons'
import { demoContentFixtures } from './demoContentFixtures'
import type { DemoContentRow } from '@/api/demoContent'
import { getPublicDemoContent } from '@/api/demoContent'
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

vi.mock('@/lib/courseAccess', () => ({
  getCourseAccess: vi.fn(async () => ({
    enrolled: false,
    checkoutCourse: { id: 9, name: 'Software Developer', price: 3559 },
  })),
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
    ],
  })
  await router.push('/courses/course-2')
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
  it('sends unpaid learners to checkout instead of the learning page', async () => {
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: false,
      checkoutCourse: { id: 9, name: 'Software Developer', price: 3559 },
    })
    const { wrapper, router } = await mountPage()
    const start = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Start learning'))
    await start?.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('payment')
    expect(router.currentRoute.value.query.courseId).toBe('9')
    wrapper.unmount()
  })

  it('opens the learning page when the course is already purchased', async () => {
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: true,
      checkoutCourse: { id: 9, name: 'Software Developer', price: 3559 },
    })
    const { wrapper, router } = await mountPage()
    const start = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Start learning'))
    await start?.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('learning-progress')
    expect(router.currentRoute.value.params.courseId).toBe('course-2')
    wrapper.unmount()
  })

  it('shows a retryable error when the backend cannot supply preview readings', async () => {
    vi.mocked(getPublicDemoContent).mockRejectedValueOnce(new Error('Unavailable'))
    const { wrapper } = await mountPage()
    expect(wrapper.get('[role="alert"]').text()).toContain('ไม่สามารถโหลดบทเรียนตัวอย่างได้')
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
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const { wrapper, router } = await mountPage()
    const module = wrapper.findComponent(ModuleAccordion)
    const sample = module.get('details')
    ;(sample.element as HTMLDetailsElement).open = true
    await sample.trigger('toggle')
    await sample.get('video').trigger('error')
    expect(sample.get('[role="alert"]').text()).toContain('ไม่สามารถโหลดคลิปทดสอบได้')
    expect(sample.find('article').exists()).toBe(true)
    ;(sample.element as HTMLDetailsElement).open = false
    await sample.trigger('toggle')
    expect(pause).toHaveBeenCalledOnce()
    expect(sample.find('video').exists()).toBe(false)
    ;(sample.element as HTMLDetailsElement).open = true
    await sample.trigger('toggle')
    expect(sample.find('[role="alert"]').exists()).toBe(false)
    await router.push('/courses/course-3')
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
