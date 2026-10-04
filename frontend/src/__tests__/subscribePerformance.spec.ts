import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { getToken } from '@clerk/vue'
import { AxiosError, CanceledError, type AxiosAdapter } from 'axios'
import client from '@/api/client'
import { getCheckoutCourses, getPaymentConfig } from '@/api/payments'
import { invalidatePublicReadCache, PUBLIC_READ_TTL_MS } from '@/api/publicReadCache'
import { getCourseAccess } from '@/lib/courseAccess'
import CourseDetailView from '@/views/CourseDetailView.vue'
import { checkoutCourseFixture } from './checkoutCourseFixture'

// Performance regression: real components/helpers/client, simulated transport
// and clock. These timings are not production measurements.
vi.mock('@clerk/vue', () => ({ getToken: vi.fn<typeof getToken>() }))
const originalAdapter = client.defaults.adapter
const course = checkoutCourseFixture({ id: 9, name: 'Software Developer' })
type Reply = { delay: number; data: unknown; status?: number }
const requests: string[] = []
let wrapper: VueWrapper | undefined

function installTransport(overrides: Record<string, Reply>) {
  const replies: Record<string, Reply> = {
    '/catalog/courses/9': { delay: 0, data: course },
    '/catalog/demo-content': { delay: 0, data: [] },
    ...overrides,
  }
  const adapter: AxiosAdapter = (config) => {
    const url = config.url ?? ''
    requests.push(url)
    const reply = replies[url]
    if (!reply) return Promise.reject(new Error('Unexpected request: ' + url))
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timer)
        config.signal?.removeEventListener?.('abort', onAbort)
        reject(new CanceledError('canceled', config))
      }
      const timer = setTimeout(() => {
        config.signal?.removeEventListener?.('abort', onAbort)
        const response = {
          config,
          data: reply.data,
          status: reply.status ?? 200,
          statusText: '',
          headers: {},
        }
        if (response.status >= 400)
          reject(new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, undefined, response))
        else resolve(response)
      }, reply.delay)
      if (config.signal?.aborted) onAbort()
      else config.signal?.addEventListener?.('abort', onAbort)
    })
  }
  client.defaults.adapter = adapter
}

async function mountSubject() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/courses/:id', component: CourseDetailView },
      { path: '/courses', component: { template: '<div />' } },
      { path: '/my-courses', component: { template: '<div />' } },
      { path: '/payment', name: 'payment', component: { template: '<div />' } },
    ],
  })
  await router.push('/courses/course-9')
  await router.isReady()
  const global = { plugins: [router], stubs: { AppNavbar: true, AppFooter: true, CtaBanner: true } }
  wrapper = mount(CourseDetailView, { global })
  await flushPromises()
  return wrapper
}
function subscribeButton() {
  return wrapper!.findAll('button').find((button) => button.text() === 'Subscribe This Course')!
}
beforeEach(() => {
  vi.useFakeTimers()
  requests.length = 0
  invalidatePublicReadCache()
  vi.mocked(getToken).mockReset().mockResolvedValue('test-session')
})
afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  client.defaults.adapter = originalAdapter
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe('Subscribe / catalog / payment config performance', () => {
  it('uses three page requests and enables Subscribe without waiting for the full catalog', async () => {
    installTransport({
      '/catalog/courses/9': { delay: 200, data: course },
      '/catalog/courses': { delay: 15000, data: [course] },
      '/me/enrollments': { delay: 500, data: [] },
    })
    const backgroundCatalog = getCheckoutCourses()
    await mountSubject()
    await vi.advanceTimersByTimeAsync(200)
    await flushPromises()
    await vi.advanceTimersByTimeAsync(500)
    await flushPromises()
    expect(subscribeButton().attributes('disabled')).toBeUndefined()
    expect(requests.filter((url) => url === '/me/enrollments')).toHaveLength(1)
    expect(requests.filter((url) => url === '/catalog/courses')).toHaveLength(1)
    expect(requests.filter((url) => url !== '/catalog/courses')).toHaveLength(3)
    await vi.advanceTimersByTimeAsync(14300)
    expect(await backgroundCatalog).toEqual([course])
    expect(requests).toHaveLength(4)
  })

  it('does not wait for learning progress when checking enrollment', async () => {
    installTransport({
      '/me/enrollments': {
        delay: 15000,
        data: [1, 2, 3].map((courseId) => ({ courseId, courseTitle: 'Other course' })),
      },
      '/me/subscriptions': { delay: 60000, data: [] },
    })
    await mountSubject()
    await vi.advanceTimersByTimeAsync(15001)
    await flushPromises()
    expect(subscribeButton().attributes('disabled')).toBeUndefined()
    expect(requests).toHaveLength(3)
    expect(requests).not.toContain('/me/subscriptions')
    expect(requests.some((url) => url.endsWith('/progress'))).toBe(false)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('matches enrollment by course ID even after a course title changes', async () => {
    installTransport({
      '/me/enrollments': { delay: 100, data: [{ courseId: 9, courseTitle: 'Previous title' }] },
    })
    await mountSubject()
    await vi.advanceTimersByTimeAsync(101)
    await flushPromises()
    expect(wrapper!.text()).toContain('Already purchased')
    expect(wrapper!.text()).not.toContain('Subscribe This Course')
    expect(requests).toHaveLength(3)
  })

  it('keeps checkout disabled after an enrollment timeout and retries only access', async () => {
    installTransport({ '/me/enrollments': { delay: 60000, data: [] } })
    await mountSubject()
    await vi.advanceTimersByTimeAsync(30001)
    await flushPromises()
    expect(subscribeButton().attributes('disabled')).toBeDefined()
    expect(wrapper!.get('aside [role="alert"]').text()).toContain('Try again')
    installTransport({ '/me/enrollments': { delay: 100, data: [] } })
    await wrapper!.get('aside [role="alert"] button').trigger('click')
    await vi.advanceTimersByTimeAsync(100)
    await flushPromises()
    expect(subscribeButton().attributes('disabled')).toBeUndefined()
    expect(requests.filter((url) => url === '/catalog/courses/9')).toHaveLength(1)
    expect(requests.filter((url) => url === '/me/enrollments')).toHaveLength(2)
    expect(requests).toHaveLength(4)
  })

  it.each([
    ['/catalog/courses', getCheckoutCourses, [course]],
    ['/payments/config', getPaymentConfig, { enabled: true, publicKey: 'pkey_test_fixture' }],
  ] as const)(
    'shares concurrent reads and refreshes expired cache for %s',
    async (url, read, data) => {
      installTransport({ [url]: { delay: 500, data } })
      const concurrent = Promise.all([read(), read(), read()])
      await vi.advanceTimersByTimeAsync(500)
      expect(await concurrent).toEqual([data, data, data])
      expect(await read()).toEqual(data)
      expect(requests).toEqual([url])
      expect(vi.mocked(getToken)).toHaveBeenCalledTimes(1)
      await vi.advanceTimersByTimeAsync(PUBLIC_READ_TTL_MS)
      const refreshed = read()
      await vi.advanceTimersByTimeAsync(500)
      expect(await refreshed).toEqual(data)
      expect(requests).toEqual([url, url])
      expect(vi.getTimerCount()).toBe(0)
    },
  )

  it('does not cache failures and isolates mutations of returned catalog data', async () => {
    installTransport({ '/catalog/courses': { delay: 100, status: 503, data: {} } })
    const failure = getCheckoutCourses().catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(100)
    expect(await failure).toBeInstanceOf(Error)
    installTransport({ '/catalog/courses': { delay: 100, data: [course] } })
    const retry = getCheckoutCourses()
    await vi.advanceTimersByTimeAsync(100)
    const first = await retry
    first[0]!.price = 1
    expect((await getCheckoutCourses())[0]!.price).toBe(course.price)
    expect(requests).toHaveLength(2)
  })

  it('invalidates an in-flight catalog read after an admin course edit', async () => {
    installTransport({
      '/catalog/courses': { delay: 1000, data: [course] },
      '/admin/courses/9': { delay: 100, data: {} },
    })
    const oldRead = getCheckoutCourses()
    await vi.advanceTimersByTimeAsync(1)
    const update = client.put('/admin/courses/9', { name: 'Updated course' })
    await vi.advanceTimersByTimeAsync(100)
    await update
    await vi.advanceTimersByTimeAsync(899)
    await oldRead
    installTransport({
      '/catalog/courses': { delay: 100, data: [{ ...course, name: 'Updated course' }] },
    })
    const freshRead = getCheckoutCourses()
    await vi.advanceTimersByTimeAsync(100)
    expect((await freshRead)[0]!.name).toBe('Updated course')
    expect(requests.filter((url) => url === '/catalog/courses')).toHaveLength(2)
  })

  it('never caches enrollment between users or after purchase', async () => {
    installTransport({
      '/me/enrollments': { delay: 100, data: [{ courseId: 9, courseTitle: course.name }] },
    })
    const enrolled = getCourseAccess(course.name, course)
    await vi.advanceTimersByTimeAsync(100)
    expect((await enrolled).enrolled).toBe(true)
    vi.mocked(getToken).mockResolvedValue('different-user')
    installTransport({ '/me/enrollments': { delay: 100, data: [] } })
    const otherUser = getCourseAccess(course.name, course)
    await vi.advanceTimersByTimeAsync(100)
    expect((await otherUser).enrolled).toBe(false)
    expect(requests).toEqual(['/me/enrollments', '/me/enrollments'])
  })

  it('lets guests start checkout without calling the protected enrollment API', async () => {
    vi.mocked(getToken).mockResolvedValue(null)
    installTransport({ '/me/enrollments': { delay: 100, status: 401, data: {} } })
    await mountSubject()
    await vi.advanceTimersByTimeAsync(101)
    await flushPromises()
    expect(subscribeButton().attributes('disabled')).toBeUndefined()
    expect(requests).not.toContain('/me/enrollments')
    expect(wrapper!.find('aside [role="alert"]').exists()).toBe(false)
    await subscribeButton().trigger('click')
    await flushPromises()
    expect(wrapper!.vm.$route.fullPath).toBe('/payment?courseId=9')
  })

  it('keeps checkout disabled when a signed-in enrollment request is rejected', async () => {
    installTransport({ '/me/enrollments': { delay: 100, status: 401, data: {} } })
    await mountSubject()
    await vi.advanceTimersByTimeAsync(101)
    await flushPromises()
    expect(subscribeButton().attributes('disabled')).toBeDefined()
    expect(wrapper!.get('aside [role="alert"]').text()).toContain('Unable to check course access')
  })
})
