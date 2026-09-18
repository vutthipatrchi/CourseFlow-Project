export interface SubLessonFormItem {
  id?: number
  name: string
  videoUrl: string
  localKey: string
}

export interface LessonDetail {
  id: number
  courseId: number
  name: string
  position: number
  subLessons: Array<{
    id: number
    name: string
    videoUrl: string
    position: number
  }>
}

export interface CreateLessonPayload {
  name: string
  subLessons: Array<{ name: string; videoUrl: string }>
}

export interface UpdateLessonPayload {
  name: string
  subLessons: Array<{ id?: number; name: string; videoUrl: string }>
}

function newLocalKey() {
  return `sl-${crypto.randomUUID()}`
}

export function emptySubLesson(): SubLessonFormItem {
  return { name: '', videoUrl: '', localKey: newLocalKey() }
}

export function toFormSubLessons(
  subLessons: LessonDetail['subLessons'],
): SubLessonFormItem[] {
  return subLessons.map((item) => ({
    id: item.id,
    name: item.name,
    videoUrl: item.videoUrl ?? '',
    localKey: newLocalKey(),
  }))
}
