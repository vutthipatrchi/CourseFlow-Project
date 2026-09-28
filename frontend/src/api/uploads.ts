import { getToken } from '@clerk/vue'

export type UploadedVideo = {
  url: string
  contentType: string
  originalName: string
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string }
    return data.message ?? response.statusText
  } catch {
    return response.statusText
  }
}

export async function uploadVideo(file: File): Promise<UploadedVideo> {
  const token = await getToken()
  const body = new FormData()
  body.append('file', file)

  const headers: HeadersInit = {}
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch('/api/admin/uploads/videos', {
    method: 'POST',
    headers,
    body,
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as UploadedVideo
}

export function isProtectedVideoUrl(source: string): boolean {
  try {
    const url = new URL(source, window.location.origin)
    return url.origin === window.location.origin && /^\/api\/uploads\/videos\/[^/]+$/.test(url.pathname)
  } catch {
    return false
  }
}

export async function authorizeVideoPlayback(source: string): Promise<void> {
  const token = await getToken()
  if (!token) throw new Error('Sign in to watch this lesson video')
  const url = new URL(source, window.location.origin)
  const response = await fetch(`${url.pathname}/access`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'same-origin',
  })
  if (!response.ok) throw new Error(await readError(response))
}
