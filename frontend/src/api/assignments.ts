import client from './client'
import type {
  Assignment,
  AssignmentDetail,
  CreateAssignmentPayload,
  SubLessonOption,
} from '@/types/assignment'

export async function listAssignments(): Promise<Assignment[]> {
  const { data } = await client.get<Assignment[]>('/admin/assignments')
  return data
}

export async function createAssignment(payload: CreateAssignmentPayload): Promise<Assignment> {
  const { data } = await client.post<Assignment>('/admin/assignments', payload)
  return data
}

export async function getAssignment(id: number): Promise<AssignmentDetail> {
  const { data } = await client.get<AssignmentDetail>(`/admin/assignments/${id}`)
  return data
}

export async function updateAssignment(
  id: number,
  payload: CreateAssignmentPayload,
): Promise<AssignmentDetail> {
  const { data } = await client.put<AssignmentDetail>(`/admin/assignments/${id}`, payload)
  return data
}

export async function deleteAssignment(id: number): Promise<void> {
  await client.delete(`/admin/assignments/${id}`)
}

export async function listSubLessonOptions(): Promise<SubLessonOption[]> {
  const { data } = await client.get<SubLessonOption[]>('/admin/sub-lessons')
  return data
}
