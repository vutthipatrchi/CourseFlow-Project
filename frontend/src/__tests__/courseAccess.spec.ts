import { describe, expect, it } from 'vitest'
import {
  findCheckoutCourseByTitle,
  isEnrolledInCourseTitle,
  learningPathForSubscription,
} from '@/lib/courseAccess'
import type { CheckoutCourse, SubscriptionView } from '@/api/payments'
import { checkoutCourseFixture } from './checkoutCourseFixture'

const subscriptions: SubscriptionView[] = [
  {
    id: 'sub-1',
    courseId: 1,
    courseTitle: 'Service Design Essentials',
    reference: 'ref-1',
    activatedAt: '2026-01-01T00:00:00Z',
    completedLessons: 0,
    totalLessons: 10,
    progressPercent: 0,
    status: 'in-progress',
  },
]

const catalog: CheckoutCourse[] = [
  checkoutCourseFixture({ id: 1, name: 'Service Design Essentials' }),
  checkoutCourseFixture({ id: 9, name: 'Software Developer' }),
]

describe('courseAccess', () => {
  it('matches enrollment by course title', () => {
    expect(isEnrolledInCourseTitle(subscriptions, 'Service Design Essentials')).toBe(true)
    expect(isEnrolledInCourseTitle(subscriptions, 'Software Developer')).toBe(false)
  })

  it('finds the checkout course used for payment', () => {
    expect(findCheckoutCourseByTitle(catalog, 'Software Developer')).toEqual(
      checkoutCourseFixture({ id: 9, name: 'Software Developer' }),
    )
    expect(findCheckoutCourseByTitle(catalog, 'Missing Course')).toBeNull()
  })

  it('builds the enrolled course player path', () => {
    expect(learningPathForSubscription(9)).toBe('/courses/course-9/learn/sub-1-1')
  })
})
