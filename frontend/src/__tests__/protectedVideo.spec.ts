import { afterEach, describe, expect, it, vi } from 'vitest'
import { authorizeVideoPlayback, isProtectedVideoUrl } from '@/api/uploads'

vi.mock('@clerk/vue', () => ({ getToken: vi.fn<() => Promise<string>>(async () => 'test-token') }))

afterEach(() => vi.unstubAllGlobals())

describe('uploaded lesson video access', () => {
  it('recognizes only local uploaded video URLs', () => {
    expect(isProtectedVideoUrl('/api/uploads/videos/lesson.mp4')).toBe(true)
    expect(isProtectedVideoUrl('https://cdn.example.com/lesson.mp4')).toBe(false)
  })

  it('gets a scoped playback cookie from the backend before the browser streams the video', async () => {
    const fetchVideo = vi.fn<() => Promise<Response>>(async () => new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchVideo)

    await authorizeVideoPlayback('/api/uploads/videos/lesson.mp4')
    expect(fetchVideo).toHaveBeenCalledWith('/api/uploads/videos/lesson.mp4/access', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
      credentials: 'same-origin',
    })
  })
})
