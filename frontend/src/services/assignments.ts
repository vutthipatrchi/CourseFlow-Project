import type { Assignment } from '@/types/assignment'

const mockAssignments: Assignment[] = Array.from({ length: 8 }, (_, index) => ({
  id: `mock-${index + 1}`,
  detail: 'What are the 4 elements of a good service design?',
  course: 'Service Design Essentials',
  lesson: 'Introduction',
  subLesson: '4 Levels of Service Design',
  createdAt: '2022-02-12T22:30:00',
}))

export function fetchAssignments(): Promise<Assignment[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockAssignments.map((assignment) => ({ ...assignment }))), 300)
  })
}
