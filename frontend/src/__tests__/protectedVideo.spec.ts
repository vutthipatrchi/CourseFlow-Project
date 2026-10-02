import { afterEach, describe, expect, it, vi } from 'vitest'
import { authorizeVideoPlayback, isProtectedVideoUrl } from '@/api/uploads'
import client from '@/api/client'
import type { AxiosAdapter } from 'axios'

vi.mock('@clerk/vue', () => ({ getToken: vi.fn<() => Promise<string>>(async () => 'test-token') }))

const originalAdapter = client.defaults.adapter
afterEach(() => {
  client.defaults.adapter = originalAdapter
})

describe('uploaded lesson video access', () => {
  it('recognizes only local uploaded video URLs', () => {
    expect(isProtectedVideoUrl('/api/uploads/videos/lesson.mp4')).toBe(true)
    expect(isProtectedVideoUrl('https://cdn.example.com/lesson.mp4')).toBe(false)
  })

  it('gets a scoped playback cookie from the backend before the browser streams the video', async () => {
    const adapter = vi.fn<AxiosAdapter>(async (config) => ({
      data: undefined,
      status: 204,
      statusText: 'No Content',
      headers: {},
      config,
    }))
    client.defaults.adapter = adapter

    await authorizeVideoPlayback('/api/uploads/videos/lesson.mp4')
    expect(adapter).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: '/api',
        url: '/uploads/videos/lesson.mp4/access',
        method: 'post',
        headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
      }),
    )
  })

  it('does not authorize an external video URL', async () => {
    await expect(authorizeVideoPlayback('https://cdn.example.com/lesson.mp4')).rejects.toThrow(
      'Invalid lesson video URL',
    )
  })
})
