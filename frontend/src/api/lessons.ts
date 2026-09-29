import { getToken } from '@clerk/vue'
import type { CreateLessonPayload, LessonDetail, UpdateLessonPayload } from '../types/lesson'

async function authHeaders(): Promise<HeadersInit> {
  const token = await getToken()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

async function readError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string }
    return data.message ?? response.statusText
  } catch {
    return response.statusText
  }
}

export async function fetchLesson(lessonId: number): Promise<LessonDetail> {
  const response = await fetch(`/api/admin/lessons/${lessonId}`, {
    headers: await authHeaders(),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as LessonDetail
}

export async function createLesson(
  courseId: number,
  payload: CreateLessonPayload,
): Promise<LessonDetail> {
  const response = await fetch(`/api/admin/courses/${courseId}/lessons`, {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as LessonDetail
}

export async function updateLesson(
  lessonId: number,
  payload: UpdateLessonPayload,
): Promise<LessonDetail> {
  const response = await fetch(`/api/admin/lessons/${lessonId}`, {
    method: 'PUT',
    headers: await authHeaders(),
    body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error(await readError(response))
  return (await response.json()) as LessonDetail
}

export async function deleteLesson(lessonId: number): Promise<void> {
  const response = await fetch(`/api/admin/lessons/${lessonId}`, {
    method: 'DELETE',
    headers: await authHeaders(),
  })
  if (!response.ok) throw new Error(await readError(response))
}
