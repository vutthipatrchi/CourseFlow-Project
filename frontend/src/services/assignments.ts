import type { Assignment } from '@/types/assignment'

let assignments: Assignment[] = Array.from({ length: 8 }, (_, index) => ({
  id: `mock-${index + 1}`,
  detail: 'What are the 4 elements of a good service design?',
  course: 'Service Design Essentials',
  lesson: 'Introduction',
  subLesson: '4 Levels of Service Design',
  createdAt: '2022-02-12T22:30:00',
}))

export function fetchAssignments(): Promise<Assignment[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(assignments.map((assignment) => ({ ...assignment }))), 300)
  })
}

export function createAssignment(
  input: Pick<Assignment, 'detail' | 'course' | 'lesson' | 'subLesson'>,
): Assignment {
  const assignment: Assignment = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  assignments = [assignment, ...assignments]
  return assignment
}
