import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import LearningProgressView from '../views/LearningProgressView.vue'

async function mountView() {
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
  await router.push('/learn/course-1')
  await router.isReady()

  return mount(LearningProgressView, {
    global: {
      plugins: [router],
      stubs: { AppNavbar: true, AppFooter: true },
    },
  })
}

describe('learning progress', () => {
  it('shows course progress and the current lesson', async () => {
    const wrapper = await mountView()

    expect(wrapper.text()).toContain('Service Design Essentials')
    expect(wrapper.text()).toContain('20% Complete')
    expect(wrapper.get('h2').text()).toBe('4 Levels of Service Design in an Organization')
    expect(wrapper.text()).toContain('Pending')
  })

  it('moves to the next lesson', async () => {
    const wrapper = await mountView()

    const nextLesson = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Next Lesson')
    await nextLesson?.trigger('click')

    expect(wrapper.get('h2').text()).toBe('Scope of Service Design')
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
