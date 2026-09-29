import {
  getCheckoutCourses,
  getSubscriptions,
  type CheckoutCourse,
  type SubscriptionView,
} from '@/api/payments'

export function isEnrolledInCourseTitle(
  subscriptions: SubscriptionView[],
  courseTitle: string,
): boolean {
  return subscriptions.some((subscription) => subscription.courseTitle === courseTitle)
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
}

export async function getCourseAccess(courseTitle: string): Promise<CourseAccess> {
  const [subscriptions, catalog] = await Promise.all([getSubscriptions(), getCheckoutCourses()])
  return {
    enrolled: isEnrolledInCourseTitle(subscriptions, courseTitle),
    checkoutCourse: findCheckoutCourseByTitle(catalog, courseTitle),
  }
}
