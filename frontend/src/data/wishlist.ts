import { courses } from './courses'

const wishlistCourseIds = ['course-1', 'course-2', 'course-3', 'course-4', 'course-5', 'course-6']

export const wishlistCourses = courses.filter((course) => wishlistCourseIds.includes(course.id))
