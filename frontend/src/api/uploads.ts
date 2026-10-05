import client, { toApiError } from './client'
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

export type CourseAssetKind = 'images' | 'previews' | 'resources'

export async function uploadCourseAsset(file: File, kind: CourseAssetKind): Promise<UploadedVideo> {
  const body = new FormData()
  body.append('file', file)
  try {
    const { data } = await client.post<UploadedVideo>('/admin/uploads/course-' + kind, body, {
      timeout: UPLOAD_TIMEOUT_MS,
    })
    return data
  } catch (error) {
    throw new Error(toApiError(error).message)
  }
}

export async function downloadCourseResource(source: string): Promise<void> {
  if (!/^\/api\/uploads\/course-resources\/[a-f0-9-]+\.[a-z0-9]+$/.test(source))
    throw new Error('Invalid course resource URL')
  const { data } = await client.get<Blob>(source.slice('/api'.length), { responseType: 'blob' })
  const objectUrl = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = source.split('/').pop() ?? 'course-resource'
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
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
