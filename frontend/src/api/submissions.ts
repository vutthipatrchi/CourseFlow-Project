import client from './client'
import type { MyAssignment } from '@/types/submission'

export async function listMyAssignments(): Promise<MyAssignment[]> {
  const { data } = await client.get<MyAssignment[]>('/me/assignments')
  return data
}

export async function submitAssignment(id: number, answer: string): Promise<MyAssignment> {
  const { data } = await client.post<MyAssignment>(`/me/assignments/${id}/submissions`, { answer })
  return data
}
