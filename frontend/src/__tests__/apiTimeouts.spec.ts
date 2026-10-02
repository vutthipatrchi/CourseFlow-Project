import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getToken } from '@clerk/vue'
import { AxiosError, CanceledError, type AxiosAdapter } from 'axios'
import client, { toApiError } from '@/api/client'
import { uploadVideo } from '@/api/uploads'
import { loadProfile, profileLoading, profileError } from '@/profile/profileStore'

vi.mock('@clerk/vue', () => ({ getToken: vi.fn<typeof getToken>() }))
const originalAdapter = client.defaults.adapter

function delayedAdapter(delay: number, data: unknown = []): AxiosAdapter {
  return (config) =>
    new Promise((resolve, reject) => {
      const onAbort = () => {
        clearTimeout(timer)
        config.signal?.removeEventListener?.('abort', onAbort)
        reject(new CanceledError('canceled', config))
      }
      const timer = setTimeout(() => {
        config.signal?.removeEventListener?.('abort', onAbort)
        resolve({ data, status: 200, statusText: 'OK', headers: {}, config })
      }, delay)
      if (config.signal?.aborted) onAbort()
      else config.signal?.addEventListener?.('abort', onAbort)
    })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(getToken).mockReset().mockResolvedValue('session-token')
})
afterEach(() => {
  client.defaults.adapter = originalAdapter
  vi.useRealTimers()
})

describe('backend request deadlines', () => {
  it('allows the observed 15 second catalog response and cleans up its deadline', async () => {
    client.defaults.adapter = delayedAdapter(15_000, [{ id: 1 }])
    const response = client.get('/catalog/courses')
    await vi.advanceTimersByTimeAsync(15_000)
    expect((await response).data).toEqual([{ id: 1 }])
    expect(vi.getTimerCount()).toBe(0)
  })

  it('ends a stalled profile request and clears the page loading state', async () => {
    client.defaults.adapter = delayedAdapter(60_000)
    const failure = loadProfile().catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(await failure).toMatchObject({ message: 'Loading took too long. Please try again.' })
    expect(profileLoading.value).toBe(false)
    expect(profileError.value).toContain('Loading took too long')
    expect(vi.getTimerCount()).toBe(0)
  })

  it('bounds a stalled token lookup and never sends a late request', async () => {
    let resolveToken!: (token: string) => void
    vi.mocked(getToken).mockReturnValue(
      new Promise((resolve) => {
        resolveToken = resolve
      }),
    )
    const adapter = vi.fn<AxiosAdapter>(delayedAdapter(0))
    client.defaults.adapter = adapter
    const failure = client.get('/me/profile').catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(10_000)
    expect(await failure).toMatchObject({ code: 'AUTH_TIMEOUT' })
    resolveToken('late-token')
    await vi.advanceTimersByTimeAsync(1)
    expect(adapter).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('includes token lookup in the overall deadline', async () => {
    vi.mocked(getToken).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve('session-token'), 8_000)
        }),
    )
    client.defaults.adapter = delayedAdapter(25_000)
    const failure = client.get('/me/subscriptions').catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(await failure).toMatchObject({ code: 'ECONNABORTED' })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('honors caller cancellation without labelling it a timeout', async () => {
    client.defaults.adapter = delayedAdapter(60_000)
    const controller = new AbortController()
    const failure = client
      .get('/me/assignments', { signal: controller.signal })
      .catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(1)
    controller.abort()
    expect(await failure).toMatchObject({ code: 'ERR_CANCELED', message: 'Request canceled.' })
    expect(vi.getTimerCount()).toBe(0)
  })

  it('never retries a timed out payment write and warns that the result may be unknown', async () => {
    const adapter = vi.fn<AxiosAdapter>(delayedAdapter(60_000))
    client.defaults.adapter = adapter
    const failure = client
      .post('/orders/123/payments/promptpay', undefined, {
        headers: { 'Idempotency-Key': 'same-attempt' },
      })
      .catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(await failure).toMatchObject({
      message: expect.stringContaining('Check the latest status before trying again'),
    })
    expect(adapter).toHaveBeenCalledTimes(1)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('allows a video upload longer than the normal deadline and keeps multipart data', async () => {
    const adapter = vi.fn<AxiosAdapter>(
      delayedAdapter(45_000, { url: '/api/uploads/videos/lesson.mp4' }),
    )
    client.defaults.adapter = adapter
    const upload = uploadVideo(new File(['video'], 'lesson.mp4', { type: 'video/mp4' }))
    await vi.advanceTimersByTimeAsync(45_000)
    expect(await upload).toMatchObject({ url: '/api/uploads/videos/lesson.mp4' })
    const config = adapter.mock.calls[0]![0]
    expect(config.timeout).toBe(300_000)
    expect(config.data).toBeInstanceOf(FormData)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('preserves backend validation details', async () => {
    client.defaults.adapter = async (config) => {
      throw new AxiosError('Bad Request', 'ERR_BAD_REQUEST', config, undefined, {
        config,
        status: 400,
        statusText: 'Bad Request',
        headers: {},
        data: { message: 'Invalid input', fieldErrors: { name: 'Required' } },
      })
    }
    const error = await client.post('/admin/courses', {}).catch((failure: unknown) => failure)
    expect(toApiError(error)).toEqual({
      message: 'Invalid input',
      fieldErrors: { name: 'Required' },
    })
    expect(vi.getTimerCount()).toBe(0)
  })
})
