import type { CourseOption } from '@/types/course'

// No Courses API/endpoint exists yet (checked backend + all branches as of this
// writing). Swap this for the real fetch once the Courses feature lands; keep
// the CourseOption shape so callers don't need to change.
const courseCatalog: CourseOption[] = [
  {
    id: 'service-design-essentials',
    name: 'Service Design Essentials',
    lessons: [
      {
        id: 'introduction',
        name: 'Introduction',
        subLessons: [
          { id: '4-levels-of-service-design', name: '4 Levels of Service Design' },
          { id: 'service-design-principles', name: 'Service Design Principles' },
        ],
      },
      {
        id: 'research-methods',
        name: 'Research Methods',
        subLessons: [
          { id: 'user-interviews', name: 'User Interviews' },
          { id: 'contextual-inquiry', name: 'Contextual Inquiry' },
        ],
      },
    ],
  },
  {
    id: 'ux-research-basics',
    name: 'UX Research Basics',
    lessons: [
      {
        id: 'getting-started',
        name: 'Getting Started',
        subLessons: [{ id: 'what-is-ux-research', name: 'What is UX Research?' }],
      },
    ],
  },
]

export function fetchCourseCatalog(): Promise<CourseOption[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(courseCatalog), 300)
  })
}
