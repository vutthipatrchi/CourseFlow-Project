import client from './client'
import { UPLOAD_TIMEOUT_MS } from './requestPolicy'

export type UploadedVideo = {
  url: string
  contentType: string
  originalName: string
}

export async function uploadVideo(file: File): Promise<UploadedVideo> {
  const body = new FormData()
  body.append('file', file)
  const { data } = await client.post<UploadedVideo>('/admin/uploads/videos', body, {
    timeout: UPLOAD_TIMEOUT_MS,
  })
  return data
}

export function isProtectedVideoUrl(source: string): boolean {
  try {
    const url = new URL(source, window.location.origin)
    return (
      url.origin === window.location.origin && /^\/api\/uploads\/videos\/[^/]+$/.test(url.pathname)
    )
  } catch {
    return false
  }
}

export async function authorizeVideoPlayback(source: string): Promise<void> {
  if (!isProtectedVideoUrl(source)) throw new Error('Invalid lesson video URL')
  const url = new URL(source, window.location.origin)
  // Same-origin cookies are sent and accepted by Axios' browser transport.
  await client.post(`${url.pathname.slice('/api'.length)}/access`)
}
