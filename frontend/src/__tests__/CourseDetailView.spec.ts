import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import CourseDetailView from '@/views/CourseDetailView.vue'
import ModuleAccordion from '@/components/course/ModuleAccordion.vue'
import { createDemoModules } from '@/data/demoLessons'
import { DEMO_VIDEO_URL } from '@/data/demoVideo'

afterEach(() => vi.restoreAllMocks())

async function mountPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/courses/:id', component: CourseDetailView },
      { path: '/courses', component: { template: '<div>Courses</div>' } },
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
  return { wrapper, router }
}

describe('Module Samples previews', () => {
  it('opens the selected module reading and clip, then stops playback when the module closes', async () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    const { wrapper } = await mountPage()
    const module = wrapper.findAllComponents(ModuleAccordion)[1]!
    const toggle = module.get('button')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    expect(module.find('details').exists()).toBe(false)
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    const sample = module.get('details')
    expect(sample.get('summary').text()).toContain('ดูตัวอย่างบทเรียน')
    expect(sample.find('video').exists()).toBe(false)
    ;(sample.element as HTMLDetailsElement).open = true
    await sample.trigger('toggle')
    expect(sample.get('article h2').text()).toBe('Development Tools')
    expect(sample.get('video').attributes('src')).toBe(DEMO_VIDEO_URL)
    expect(sample.get('article').text()).toContain('Terminal')
    expect(sample.text()).not.toContain('อ่านจบแล้ว')
    await toggle.trigger('click')
    expect(pause).toHaveBeenCalledOnce()
    expect(module.find('video').exists()).toBe(false)
    await toggle.trigger('click')
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
    const module = createDemoModules('Software Developer')[0]!
    const wrapper = mount(ModuleAccordion, {
      props: { module, index: 0, defaultOpen: true, interactive: true },
    })
    await wrapper.get('li button').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['sub-1-1']])
    expect(wrapper.find('details').exists()).toBe(false)
    wrapper.unmount()
  })
})
