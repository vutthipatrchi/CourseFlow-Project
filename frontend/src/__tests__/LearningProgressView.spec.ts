import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import LearningProgressView from '../views/LearningProgressView.vue'
import { getCourseAccess } from '@/lib/courseAccess'

vi.mock('@/lib/courseAccess', () => ({
  getCourseAccess: vi.fn(async () => ({
    enrolled: true,
    checkoutCourse: { id: 1, name: 'Service Design Essentials', price: 3559 },
  })),
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
  return wrapper
}

describe('learning progress', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: true,
      checkoutCourse: { id: 1, name: 'Service Design Essentials', price: 3559 },
    })
  })

  it('shows course progress and the current lesson', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Service Design Essentials')
    expect(wrapper.text()).toContain('21% Complete')
    expect(wrapper.text()).not.toContain('"videoUrl"')
    expect(wrapper.get('h2').text()).toBe('4 Levels of Service Design in an Organization')
    expect(wrapper.text()).toContain('product, service, business, and societal level')
    expect(wrapper.text()).toContain('Example')
    expect(wrapper.text()).toContain('Try it yourself')
    expect(wrapper.text()).toContain('Pending')
  })

  it('blocks learning when the course is not purchased', async () => {
    vi.mocked(getCourseAccess).mockResolvedValue({
      enrolled: false,
      checkoutCourse: { id: 1, name: 'Service Design Essentials', price: 3559 },
    })
    const wrapper = await mountView()

    expect(wrapper.get('[role="alert"]').text()).toContain('Purchase this course to start learning')
    expect(wrapper.text()).toContain('Subscribe this course')
    expect(wrapper.find('h2').exists()).toBe(false)
  })

  it('shows a reading for a lesson that has no assignment', async () => {
    const wrapper = await mountView('/learn/course-3?lesson=sub-2-2')

    expect(wrapper.get('h2').text()).toBe('Personas and Jobs to Be Done')
    expect(wrapper.text()).toContain('personas and job statements')
    expect(wrapper.text()).toContain('Example')
    expect(wrapper.text()).toContain('Try it yourself')
  })

  it('opens the course and lesson selected from the course list', async () => {
    const software = await mountView('/learn/course-2')
    expect(software.text()).toContain('Software Developer')
    expect(software.get('h2').text()).toBe('Git Basics for Beginners')
    expect(software.text()).toContain('Programming Fundamentals')

    const scoped = await mountView('/learn/course-1?lesson=sub-1-7')
    expect(scoped.text()).toContain('Service Design Essentials')
    expect(scoped.get('h2').text()).toBe('Scope of Service Design')
  })

  it('moves to the next lesson', async () => {
    const wrapper = await mountView()

    const nextLesson = wrapper.findAll('button').find((button) => button.text() === 'Next Lesson')
    await nextLesson?.trigger('click')

    expect(wrapper.get('h2').text()).toBe('Scope of Service Design')
  })

  it('marks the current lesson complete after scrolling to the bottom', async () => {
    const wrapper = await mountView()
    const current = wrapper.get('[aria-current="true"]')
    expect(current.text()).toContain('4 Levels of Service Design in an Organization')
    expect(current.html()).toContain('>i<')

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1200 })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('25% Complete')
    expect(wrapper.get('[aria-current="true"]').html()).not.toContain('>i<')

    wrapper.unmount()
    const remounted = await mountView()
    expect(remounted.text()).toContain('25% Complete')
  })

  it('marks an assignment as submitted', async () => {
    const wrapper = await mountView()

    await wrapper.get('textarea').setValue('People, processes, products, and partners.')
    await wrapper.get('form').trigger('submit')

    expect(wrapper.text()).toContain('Submitted')
    expect(wrapper.text()).toContain('People, processes, products, and partners.')
    expect(wrapper.find('textarea').exists()).toBe(false)
  })
})
