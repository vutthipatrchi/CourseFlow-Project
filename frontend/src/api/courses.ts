import client from './client'
import type { AdminCourse, AdminCoursePayload } from '@/types/course'

const coursePath = '/admin/courses'

export async function listCourses(): Promise<AdminCourse[]> {
  const { data } = await client.get<AdminCourse[]>(coursePath)
  return data
}

export async function getCourse(id: number): Promise<AdminCourse> {
  const { data } = await client.get<AdminCourse>(`${coursePath}/${id}`)
  return data
}

export async function createCourse(payload: AdminCoursePayload): Promise<AdminCourse> {
  const { data } = await client.post<AdminCourse>(coursePath, payload)
  return data
}

export async function updateCourse(id: number, payload: AdminCoursePayload): Promise<AdminCourse> {
  const { data } = await client.put<AdminCourse>(`${coursePath}/${id}`, payload)
  return data
}

export async function deleteCourse(id: number): Promise<void> {
  await client.delete(`${coursePath}/${id}`)
}
