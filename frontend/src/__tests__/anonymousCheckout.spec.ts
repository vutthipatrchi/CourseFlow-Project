import { afterEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { getToken } from '@clerk/vue'
import { AxiosError } from 'axios'
import client from '@/api/client'
import router from '@/router'
import CourseDetailView from '@/views/CourseDetailView.vue'
import { checkoutCourseFixture } from './checkoutCourseFixture'

vi.mock('@clerk/vue', () => ({ getToken: vi.fn<typeof getToken>() }))
const originalAdapter = client.defaults.adapter
afterEach(() => {
  client.defaults.adapter = originalAdapter
  vi.restoreAllMocks()
})

it('takes a guest from Subscribe to sign-in with the selected checkout as the return URL', async () => {
  vi.mocked(getToken).mockResolvedValue(null)
  const course = checkoutCourseFixture({ id: 9, name: 'Software Developer' })
  client.defaults.adapter = async (config) => {
    if (config.url === '/me/enrollments') {
      throw new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, {
        data: {},
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config,
      })
    }
    return {
      data: config.url === '/catalog/demo-content' ? [] : course,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
    }
  }
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  await router.push('/courses/course-9')
  const wrapper = mount(CourseDetailView, {
    global: { plugins: [router], stubs: { AppNavbar: true, AppFooter: true, CtaBanner: true } },
  })
  try {
    await flushPromises()
    const subscribe = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Subscribe This Course')!
    expect(subscribe.attributes('disabled')).toBeUndefined()
    await subscribe.trigger('click')
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('sign-in'))
    expect(router.currentRoute.value.query.redirect).toBe('/payment?courseId=9')
  } finally {
    wrapper.unmount()
  }
})
