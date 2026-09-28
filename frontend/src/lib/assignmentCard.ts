import type { Assignment } from '@/types/course'
import type { MyAssignment } from '@/types/submission'

// Adapts an API assignment to the shape AssignmentCard renders. The card's id is the API id as a string.
export function toCardAssignment(assignment: MyAssignment): Assignment {
  const days = assignment.durationDays
  return {
    id: String(assignment.id),
    question: assignment.description,
    status: assignment.status,
    answer: assignment.answer ?? undefined,
    deadlineLabel: days ? `Assign within ${days} ${days === 1 ? 'day' : 'days'}` : '',
  }
}
