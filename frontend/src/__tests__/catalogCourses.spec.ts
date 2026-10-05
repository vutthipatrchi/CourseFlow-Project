import { describe, expect, it } from 'vitest'
import { catalogCourseId, catalogRouteId, toStorefrontCourse } from '@/lib/catalogCourses'
import type { CheckoutCourse } from '@/api/payments'

const sample: CheckoutCourse = {
  id: 9,
  name: 'Software Developer',
  price: 3559,
  category: 'Course',
  summary: 'Build a solid foundation in programming.',
  description: 'Longer storefront description.',
  learningTime: 10,
  lessons: 6,
  imageName: null,
  accent: '#dce8fb',
}

describe('catalogCourses', () => {
  it('uses uploaded cover URLs for the storefront image', () => {
    const imageName = '/api/uploads/course-images/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png'
    expect(toStorefrontCourse({ ...sample, imageName }).imageUrl).toBe(imageName)
  })

  it('parses storefront and numeric course ids', () => {
    expect(catalogCourseId('course-9')).toBe(9)
    expect(catalogCourseId('9')).toBe(9)
    expect(catalogCourseId('course-x')).toBeNull()
    expect(catalogRouteId(9)).toBe('course-9')
  })

  it('maps catalog rows onto storefront course cards', () => {
    const course = toStorefrontCourse(sample)
    expect(course.id).toBe('course-9')
    expect(course.title).toBe('Software Developer')
    expect(course.description).toBe('Build a solid foundation in programming.')
    expect(course.longDescription).toBe('Longer storefront description.')
    expect(course.lessonCount).toBe(6)
    expect(course.hourCount).toBe(10)
    expect(course.modules).toEqual([])
  })

  it('preserves fallback behavior for a newly created course without default copy', () => {
    const course = toStorefrontCourse({
      ...sample,
      name: 'New Course',
      summary: null,
      description: null,
    })
    expect(course.description).toBe('Course details coming soon.')
    expect(course.longDescription).toContain('Browse the sample lessons below')
  })
})
