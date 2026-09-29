import type { CheckoutCourse } from '@/api/payments'

/** Minimal catalog course for unit tests after CheckoutCourse gained storefront fields. */
export function checkoutCourseFixture(
  overrides: Partial<CheckoutCourse> & Pick<CheckoutCourse, 'id' | 'name'>,
): CheckoutCourse {
  return {
    price: 3559,
    category: 'Course',
    summary: 'Catalog summary',
    description: 'Catalog description',
    learningTime: 8,
    lessons: 6,
    imageName: null,
    accent: '#dce8fb',
    ...overrides,
  }
}
