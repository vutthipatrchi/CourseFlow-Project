import client from './client'
import type { Assignment, CreateAssignmentPayload, SubLessonOption } from '@/types/assignment'

export async function listAssignments(): Promise<Assignment[]> {
  const { data } = await client.get<Assignment[]>('/admin/assignments')
  return data
}

export async function createAssignment(payload: CreateAssignmentPayload): Promise<Assignment> {
  const { data } = await client.post<Assignment>('/admin/assignments', payload)
  return data
}

export async function listSubLessonOptions(): Promise<SubLessonOption[]> {
  const { data } = await client.get<SubLessonOption[]>('/admin/sub-lessons')
  return data
}
