import type { DemoContentRow } from '@/api/demoContent'
import type { DemoLesson, Module } from '@/types/course'

type LessonReference = {
  title: string
  lessonTitle: string
  lessonPosition: number
  subLessonPosition: number
}

const normalize = (value: string) => value.trim().toLowerCase()

/** Match the names stored on seeded lessons, which remain stable when positions change. */
export function getDemoLesson(content: DemoContentRow[], reference: LessonReference) {
  const lessonName = normalize(reference.lessonTitle)
  const subLessonName = normalize(reference.title)
  const exact = content.find(
    (row) =>
      normalize(row.lessonName) === lessonName && normalize(row.subLessonName) === subLessonName,
  )
  if (exact) return exact.reading ?? undefined

  const named = content.find((row) => normalize(row.title) === subLessonName)
  if (named) return named.reading ?? undefined

  // Some existing courses use "Introduction" for the first Service Design lesson.
  if (lessonName === 'introduction') {
    const original = content.find(
      (row) =>
        normalize(row.lessonName) === 'lesson 1' && normalize(row.subLessonName) === subLessonName,
    )
    if (original) return original.reading ?? undefined
  }

  // The newer storefront seeds name the lesson and sub-lesson identically.
  return (
    content.find(
      (row) =>
        normalize(row.lessonName) === normalize(row.subLessonName) &&
        normalize(row.subLessonName) === subLessonName,
    )?.reading ?? undefined
  )
}

export function createDemoModules(content: DemoContentRow[]): Module[] {
  const modules: Module[] = []
  for (const row of content) {
    let module = modules.find((item) => item.id === row.lessonName)
    if (!module) {
      module = { id: row.lessonName, title: row.title, subLessons: [] }
      modules.push(module)
    }
    module.subLessons.push({
      id: `${row.lessonName}-${row.subLessonName}`,
      title: row.title,
      description: row.reading?.objective ?? '',
      videoUrl: '',
      demoLesson: row.reading ?? undefined,
      progress: 'not-started',
    })
  }
  return modules
}

/** Keep custom server labels; replace only the seed's generic labels. */
export function getDemoLessonLabels(reference: LessonReference, lesson?: DemoLesson) {
  return {
    title:
      lesson && /^Sub-lesson \d+$/i.test(reference.title.trim()) ? lesson.title : reference.title,
    lessonTitle:
      lesson && /^Lesson \d+$/i.test(reference.lessonTitle.trim())
        ? lesson.title
        : reference.lessonTitle,
  }
}
