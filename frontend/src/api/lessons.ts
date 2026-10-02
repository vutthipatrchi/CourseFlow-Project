import client from './client'
import type { CreateLessonPayload, LessonDetail, UpdateLessonPayload } from '../types/lesson'

export async function fetchLesson(lessonId: number): Promise<LessonDetail> {
  const { data } = await client.get<LessonDetail>(`/admin/lessons/${lessonId}`)
  return data
}

export async function createLesson(
  courseId: number,
  payload: CreateLessonPayload,
): Promise<LessonDetail> {
  const { data } = await client.post<LessonDetail>(`/admin/courses/${courseId}/lessons`, payload)
  return data
}

export async function updateLesson(
  lessonId: number,
  payload: UpdateLessonPayload,
): Promise<LessonDetail> {
  const { data } = await client.put<LessonDetail>(`/admin/lessons/${lessonId}`, payload)
  return data
}

export async function deleteLesson(lessonId: number): Promise<void> {
  await client.delete(`/admin/lessons/${lessonId}`)
}
