import type { Course, Module } from '@/types/course'

const modules: Module[] = [
  {
    id: 'module-1',
    title: 'Introduction',
    subLessons: [
      'Welcome to the Course',
      'Course Overview',
      'Getting to Know You',
      'What is Service Design?',
      'Service Design vs. UX vs. UI vs. Design Thinking',
      '4 Levels of Service Design in an Organization',
      'Scope of Service Design',
      'Develop an Entirely New Service - U Drink I Drive',
      'Improving Existing Services - Credit Cards',
      'Improving Existing Services - MK',
      'Levels of Impact',
    ],
  },
  {
    id: 'module-2',
    title: 'Service Design Theories and Principles',
    subLessons: ['Core Theories', 'Design Principles', 'Case Studies'],
  },
  {
    id: 'module-3',
    title: 'Understanding Users and Finding Opportunities',
    subLessons: ['User Research Methods', 'Journey Mapping', 'Opportunity Spotting'],
  },
  {
    id: 'module-4',
    title: 'Identifying and Validating Opportunities for Design',
    subLessons: ['Framing the Problem', 'Validation Techniques', 'Prioritization'],
  },
  {
    id: 'module-5',
    title: 'Prototyping',
    subLessons: ['Low-Fidelity Prototypes', 'High-Fidelity Prototypes', 'Testing with Users'],
  },
  {
    id: 'module-6',
    title: 'Course Summary',
    subLessons: ['Key Takeaways', 'Next Steps'],
  },
]

const longDescription =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum aenean fermentum, velit vel, scelerisque morbi accumsan. Nec, tellus leo id leo id felis egestas. Quam sit lorem quis vitae ut mus imperdiet. Volutpat placerat dignissim dolor faucibus elit ornare fringilla. Vivamus amet risus ullamcorper auctor nibh. Maecenas morbi nec vestibulum ac tempus vehicula.'

export const courses: Course[] = Array.from({ length: 12 }, (_, index) => ({
  id: `course-${index + 1}`,
  category: 'Course',
  title: 'Service Design Essentials',
  description: 'Lorem ipsum dolor sit amet, conse ctetur adipiscing elit.',
  longDescription,
  imageUrl: '',
  lessonCount: 6,
  hourCount: 6,
  price: 3559,
  modules,
}))
