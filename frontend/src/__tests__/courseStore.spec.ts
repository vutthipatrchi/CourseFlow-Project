import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createCourse, listCourses } from '@/api/courses'
import { useCourseStore } from '@/stores/course'
import { makeCourseFixtures } from './courseFixtures'
import type { AdminCoursePayload } from '@/types/course'

vi.mock('@/api/courses')
beforeEach(() => {
  setActivePinia(createPinia())
  vi.resetAllMocks()
})

describe('course collection cache', () => {
  it('loads the complete list after creating from a direct link', async () => {
    const existing = makeCourseFixtures()
    const created = { ...existing[0]!, id: 999, name: 'New course' }
    const payload: AdminCoursePayload = { ...created, lessonItems: created.lessonItems ?? [] }
    vi.mocked(createCourse).mockResolvedValue(created)
    vi.mocked(listCourses).mockResolvedValue([...existing, created])
    const store = useCourseStore()
    await store.add(payload)
    expect(store.loaded).toBe(false)
    await store.load()
    expect(listCourses).toHaveBeenCalledOnce()
    expect(store.courses).toEqual([...existing, created])
    expect(store.loaded).toBe(true)
  })

  it('keeps an already loaded complete list after adding a course', async () => {
    const existing = makeCourseFixtures()
    const created = { ...existing[0]!, id: 999 }
    vi.mocked(listCourses).mockResolvedValue([...existing])
    vi.mocked(createCourse).mockResolvedValue(created)
    const store = useCourseStore()
    await store.load()
    await store.add({ ...created, lessonItems: created.lessonItems ?? [] })
    await store.load()
    expect(listCourses).toHaveBeenCalledOnce()
    expect(store.courses.map((course) => course.id)).toContain(999)
    expect(store.courses).toHaveLength(existing.length + 1)
  })
})
