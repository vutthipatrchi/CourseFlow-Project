import { getSessionToken } from '@/api/sessionToken'
import {
  getCheckoutCourses,
  getCourseEnrollments,
  type CheckoutCourse,
  type CourseEnrollment,
} from '@/api/payments'

export function isEnrolledInCourseTitle(
  subscriptions: CourseEnrollment[],
  courseTitle: string,
): boolean {
  return subscriptions.some((subscription) => subscription.courseTitle === courseTitle)
}

export function findSubscriptionByTitle<T extends CourseEnrollment>(
  subscriptions: T[],
  courseTitle: string,
): T | null {
  return subscriptions.find((subscription) => subscription.courseTitle === courseTitle) ?? null
}

export function findCheckoutCourseByTitle(
  catalog: CheckoutCourse[],
  courseTitle: string,
): CheckoutCourse | null {
  return catalog.find((course) => course.name === courseTitle) ?? null
}

export type CourseAccess = {
  enrolled: boolean
  checkoutCourse: CheckoutCourse | null
  /** Numeric DB course id from an active subscription, when enrolled. */
  subscriptionCourseId: number | null
}

export function learningPathForSubscription(courseId: number): string {
  return `/courses/course-${courseId}/learn/sub-1-1`
}

export async function getCourseAccess(
  courseTitle: string,
  knownCourse?: CheckoutCourse,
): Promise<CourseAccess> {
  // Guests can start checkout; the payment route handles sign-in and its return URL.
  // Session failures still propagate so an unavailable session is not treated as a guest.
  const token = await getSessionToken(new AbortController().signal)
  const [enrollments, checkoutCourse] = await Promise.all([
    token ? getCourseEnrollments() : Promise.resolve<CourseEnrollment[]>([]),
    knownCourse ??
      getCheckoutCourses().then((catalog) => findCheckoutCourseByTitle(catalog, courseTitle)),
  ])
  const enrollment = checkoutCourse
    ? enrollments.find((item) => item.courseId === checkoutCourse.id)
    : findSubscriptionByTitle(enrollments, courseTitle)
  return {
    enrolled: Boolean(enrollment),
    checkoutCourse,
    subscriptionCourseId: enrollment?.courseId ?? null,
  }
}
