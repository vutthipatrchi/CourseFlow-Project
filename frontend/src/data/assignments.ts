import type { Assignment } from '@/types/course'
import { courses } from '@/data/courses'

export type AssignmentWithContext = Assignment & {
  courseId: string
  courseTitle: string
  moduleTitle: string
  subLessonId: string
  subLessonTitle: string
}

// My Assignments aggregates across a user's enrolled courses - course-1 stands in
// for "enrolled" here since there's no real enrollment/backend data yet.
const enrolledCourseIds = ['course-1']

export const myAssignments: AssignmentWithContext[] = courses
  .filter((course) => enrolledCourseIds.includes(course.id))
  .flatMap((course) =>
    course.modules.flatMap((module) =>
      module.subLessons
        .filter((subLesson) => subLesson.assignment)
        .map((subLesson) => ({
          ...subLesson.assignment!,
          courseId: course.id,
          courseTitle: course.title,
          moduleTitle: module.title,
          subLessonId: subLesson.id,
          subLessonTitle: subLesson.title,
        })),
    ),
  )
