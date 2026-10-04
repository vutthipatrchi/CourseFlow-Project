import client from './client'
import type { DemoLesson } from '@/types/course'

export type DemoContentRow = {
  lessonName: string
  subLessonName: string
  title: string
  reading: DemoLesson | null
}

export async function getPublicDemoContent(courseTitle: string): Promise<DemoContentRow[]> {
  const { data } = await client.get<DemoContentRow[]>('/catalog/demo-content', {
    params: { courseTitle },
  })
  return data
}

export async function getEnrolledDemoContent(courseId: number): Promise<DemoContentRow[]> {
  const { data } = await client.get<DemoContentRow[]>(`/me/courses/${courseId}/demo-content`)
  return data
}
