import type { CheckoutCourse } from '@/api/payments'
import type { Course } from '@/types/course'
import { courseDetails } from '@/data/courseDetails'
import serviceDesignImage from '@/assets/admin/courses/service-design.jpg'
import softwareDeveloperImage from '@/assets/admin/courses/software-developer.jpg'
import uxUiDesignImage from '@/assets/admin/courses/ux-ui-design.jpg'

const imagesByTitle: Record<string, string> = {
  'Service Design Essentials': serviceDesignImage,
  'Software Developer': softwareDeveloperImage,
  'UX/UI Design Beginner': uxUiDesignImage,
  'Design Thinking Fundamentals': serviceDesignImage,
  'UX Research Methods': uxUiDesignImage,
  'Product Strategy': softwareDeveloperImage,
  'Digital Marketing Basics': serviceDesignImage,
  'Data Analytics Foundations': softwareDeveloperImage,
  'Leadership Essentials': uxUiDesignImage,
  'Agile Project Management': softwareDeveloperImage,
}

export function catalogCourseId(routeId: string | string[] | undefined): number | null {
  const raw = Array.isArray(routeId) ? routeId[0] : routeId
  if (!raw) return null
  const matched = /^course-(\d+)$/.exec(raw)
  if (matched) return Number(matched[1])
  const numeric = Number(raw)
  return Number.isSafeInteger(numeric) && numeric > 0 ? numeric : null
}

export function catalogRouteId(courseId: number): string {
  return `course-${courseId}`
}

export function resolveCatalogImage(course: Pick<CheckoutCourse, 'name' | 'imageName'>): string {
  if (course.imageName && /^https?:\/\//.test(course.imageName)) return course.imageName
  return imagesByTitle[course.name] ?? serviceDesignImage
}

export function toStorefrontCourse(course: CheckoutCourse): Course {
  const details = courseDetails[course.name]
  const summary =
    course.summary?.trim() ||
    course.description?.trim() ||
    details?.summary ||
    'Course details coming soon.'
  const longDescription =
    course.description?.trim() ||
    details?.description ||
    course.summary?.trim() ||
    'Browse the sample lessons below, then subscribe to unlock the full course.'
  return {
    id: catalogRouteId(course.id),
    category: course.category?.trim() || 'Course',
    title: course.name,
    description: summary,
    longDescription,
    imageUrl: resolveCatalogImage(course),
    lessonCount: course.lessons,
    hourCount: course.learningTime ?? Math.max(1, course.lessons),
    price: course.price,
    modules: [],
  }
}
