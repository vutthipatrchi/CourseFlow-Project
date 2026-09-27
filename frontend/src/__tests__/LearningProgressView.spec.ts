import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import LearningProgressView from '../views/LearningProgressView.vue'

async function mountView(path = '/learn/course-1') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/learn/:courseId',
        name: 'learning-progress',
        component: LearningProgressView,
      },
    ],
  })
  await router.push(path)
  await router.isReady()

  return mount(LearningProgressView, {
    global: {
      plugins: [router],
      stubs: { AppNavbar: true, AppFooter: true },
    },
  })
}

describe('learning progress', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows course progress and the current lesson', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Service Design Essentials')
    expect(wrapper.text()).toContain('21% Complete')
    expect(wrapper.text()).not.toContain('"videoUrl"')
    expect(wrapper.get('h2').text()).toBe('4 Levels of Service Design in an Organization')
    expect(wrapper.text()).toContain('Pending')
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

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      configurable: true,
      value: 2000,
    })
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 1200 })
    window.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[aria-current="true"]').html()).not.toContain('>i<')
    expect(wrapper.text()).toContain('25% Complete')

    wrapper.unmount()
    const reloaded = await mountView()
    expect(reloaded.text()).toContain('25% Complete')
    expect(reloaded.get('[aria-current="true"]').html()).not.toContain('>i<')
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
