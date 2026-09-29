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

export function findSubscriptionByTitle(
  subscriptions: SubscriptionView[],
  courseTitle: string,
): SubscriptionView | null {
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

export async function getCourseAccess(courseTitle: string): Promise<CourseAccess> {
  const [subscriptions, catalog] = await Promise.all([getSubscriptions(), getCheckoutCourses()])
  const subscription = findSubscriptionByTitle(subscriptions, courseTitle)
  return {
    enrolled: Boolean(subscription),
    checkoutCourse: findCheckoutCourseByTitle(catalog, courseTitle),
    subscriptionCourseId: subscription?.courseId ?? null,
  }
}
