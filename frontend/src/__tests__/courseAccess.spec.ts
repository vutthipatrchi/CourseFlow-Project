import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSessionToken } from '@/api/sessionToken'
import { getCheckoutCourses, getCourseEnrollments } from '@/api/payments'
import {
  findCheckoutCourseByTitle,
  getCourseAccess,
  isEnrolledInCourseTitle,
  learningPathForSubscription,
} from '@/lib/courseAccess'
import type { CheckoutCourse, SubscriptionView } from '@/api/payments'
import { checkoutCourseFixture } from './checkoutCourseFixture'

vi.mock('@/api/sessionToken')
vi.mock('@/api/payments')

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

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(getSessionToken).mockResolvedValue('signed-in-session')
  vi.mocked(getCheckoutCourses).mockResolvedValue(catalog)
  vi.mocked(getCourseEnrollments).mockResolvedValue(subscriptions)
})

describe('courseAccess', () => {
  it('allows a guest to select a known course without requesting private enrollments', async () => {
    vi.mocked(getSessionToken).mockResolvedValue(null)
    expect(await getCourseAccess(catalog[0]!.name, catalog[0])).toEqual({
      enrolled: false,
      checkoutCourse: catalog[0],
      subscriptionCourseId: null,
    })
    expect(getCourseEnrollments).not.toHaveBeenCalled()
  })

  it('still resolves the public catalog for a guest when only the title is known', async () => {
    vi.mocked(getSessionToken).mockResolvedValue(null)
    expect((await getCourseAccess('Software Developer')).checkoutCourse).toEqual(catalog[1])
    expect(getCourseEnrollments).not.toHaveBeenCalled()
  })

  it('recognizes a purchased course for a signed-in user', async () => {
    expect(await getCourseAccess(catalog[0]!.name, catalog[0])).toEqual({
      enrolled: true,
      checkoutCourse: catalog[0],
      subscriptionCourseId: 1,
    })
  })

  it('does not turn session lookup failures into guest access', async () => {
    vi.mocked(getSessionToken).mockRejectedValue(new Error('Session unavailable'))
    await expect(getCourseAccess(catalog[0]!.name, catalog[0])).rejects.toThrow(
      'Session unavailable',
    )
    expect(getCourseEnrollments).not.toHaveBeenCalled()
  })

  it('preserves enrollment errors for signed-in users', async () => {
    vi.mocked(getCourseEnrollments).mockRejectedValue(new Error('Enrollment unavailable'))
    await expect(getCourseAccess(catalog[0]!.name, catalog[0])).rejects.toThrow(
      'Enrollment unavailable',
    )
  })
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
