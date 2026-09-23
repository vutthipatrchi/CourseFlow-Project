import type { Course, Module, SubLesson } from '@/types/course'
import serviceDesignImage from '@/assets/admin/courses/service-design.jpg'
import softwareDeveloperImage from '@/assets/admin/courses/software-developer.jpg'
import uxUiDesignImage from '@/assets/admin/courses/ux-ui-design.jpg'

const subLesson = (
  id: string,
  title: string,
  description: string,
  progress: SubLesson['progress'],
  assignment?: SubLesson['assignment'],
): SubLesson => ({
  id,
  title,
  description,
  videoUrl: '',
  progress,
  assignment,
})

const modules: Module[] = [
  {
    id: 'module-1',
    title: 'Introduction',
    subLessons: [
      subLesson(
        'sub-1-1',
        'Welcome to the Course',
        'A quick welcome from the instructor covering what to expect, how the course is structured, and how to get the most out of it.',
        'completed',
      ),
      subLesson(
        'sub-1-2',
        'Course Overview',
        'A walkthrough of the modules ahead, from foundational theory to hands-on prototyping, so you know where each topic fits.',
        'completed',
      ),
      subLesson(
        'sub-1-3',
        'Getting to Know You',
        'A short reflection on your own background and goals for taking this course, to help frame the examples that follow.',
        'completed',
      ),
      subLesson(
        'sub-1-4',
        'What is Service Design?',
        'Defines service design as a discipline and introduces the mindset of designing around the full customer experience, not just a single touchpoint.',
        'completed',
        {
          id: 'assignment-0',
          question: 'Give a real-world example of a service and identify its key touchpoints.',
          status: 'submitted',
          answer:
            'A coffee shop app: touchpoints include browsing the menu, placing an order, payment, pickup notification, and post-purchase feedback.',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-1-5',
        'Service Design vs. UX vs. UI vs. Design Thinking',
        'Clarifies how service design overlaps with and differs from UX, UI, and design thinking, and when each discipline leads the work.',
        'completed',
      ),
      subLesson(
        'sub-1-6',
        '4 Levels of Service Design in an Organization',
        'Breaks down how service design shows up at the product, service, business, and societal level within an organization.',
        'in-progress',
        {
          id: 'assignment-1',
          question: 'What are the 4 elements of service design?',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-1-7',
        'Scope of Service Design',
        'Maps out what falls inside and outside the scope of a service design engagement, from research to implementation.',
        'not-started',
      ),
      subLesson(
        'sub-1-8',
        'Develop an Entirely New Service - U Drink I Drive',
        'A case study on building a brand-new service from scratch, using U Drink I Drive as the working example.',
        'not-started',
      ),
      subLesson(
        'sub-1-9',
        'Improving Existing Services - Credit Cards',
        'A case study on redesigning an existing service, looking at pain points in a typical credit card experience.',
        'not-started',
      ),
      subLesson(
        'sub-1-10',
        'Improving Existing Services - MK Levels of Impact',
        'A second case study on improving an existing service, using MK to illustrate impact at different levels of the organization.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-2',
    title: 'Service Design Theories and Principles',
    subLessons: [
      subLesson(
        'sub-2-1',
        'Core Theories',
        'Covers the foundational theories service design draws from, including systems thinking and human-centered design.',
        'not-started',
      ),
      subLesson(
        'sub-2-2',
        'Design Principles',
        'Introduces the core principles that guide good service design decisions, from co-creation to holistic thinking.',
        'not-started',
        {
          id: 'assignment-2',
          question: 'Summarize the design principles covered and give one real-world example.',
          status: 'submitted',
          answer:
            'Applied human-centered design to redesign the registration form, reducing steps from 6 to 3.',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-2-3',
        'Case Studies',
        'Reviews real case studies that show these theories and principles applied in practice.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-3',
    title: 'Understanding Users and Finding Opportunities',
    subLessons: [
      subLesson(
        'sub-3-1',
        'User Research Methods',
        'Covers common research methods for understanding users, including interviews, surveys, and contextual inquiry.',
        'not-started',
      ),
      subLesson(
        'sub-3-2',
        'Journey Mapping',
        'Shows how to build a user journey map to visualize the end-to-end experience across a service.',
        'not-started',
      ),
      subLesson(
        'sub-3-3',
        'Opportunity Spotting',
        'Teaches how to turn research findings into concrete opportunities for improving or creating a service.',
        'not-started',
        {
          id: 'assignment-3',
          question:
            'Pick one opportunity you found from user research and explain why it stands out.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
    ],
  },
  {
    id: 'module-4',
    title: 'Identifying and Validating Opportunities for Design',
    subLessons: [
      subLesson(
        'sub-4-1',
        'Framing the Problem',
        'Walks through how to frame a design problem clearly before jumping to solutions.',
        'not-started',
      ),
      subLesson(
        'sub-4-2',
        'Validation Techniques',
        'Covers techniques for validating whether an opportunity is worth pursuing before investing in a full solution.',
        'not-started',
      ),
      subLesson(
        'sub-4-3',
        'Prioritization',
        'Introduces frameworks for prioritizing opportunities based on impact and feasibility.',
        'not-started',
        {
          id: 'assignment-4',
          question: 'Prioritize the opportunities you identified and explain your reasoning.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
    ],
  },
  {
    id: 'module-5',
    title: 'Prototyping',
    subLessons: [
      subLesson(
        'sub-5-1',
        'Low-Fidelity Prototypes',
        'Shows how to quickly sketch and test ideas using low-fidelity prototypes before investing in detail.',
        'not-started',
      ),
      subLesson(
        'sub-5-2',
        'High-Fidelity Prototypes',
        'Covers how to build more polished, high-fidelity prototypes once a direction has been validated.',
        'not-started',
      ),
      subLesson(
        'sub-5-3',
        'Testing with Users',
        'Walks through how to run a usability test with real users and gather actionable feedback.',
        'not-started',
        {
          id: 'assignment-5',
          question: 'Summarize the feedback from testing your prototype with at least one user.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
    ],
  },
  {
    id: 'module-6',
    title: 'Course Summary',
    subLessons: [
      subLesson(
        'sub-6-1',
        'Key Takeaways',
        'Recaps the key takeaways from the course, tying the theory back to the case studies covered earlier.',
        'not-started',
      ),
      subLesson(
        'sub-6-2',
        'Next Steps',
        'Suggests next steps for continuing to build your service design skills after finishing this course.',
        'not-started',
        {
          id: 'assignment-6',
          question: 'Outline your next steps for applying what you learned in this course.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
    ],
  },
]

const longDescription =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Elementum aenean fermentum, velit vel, scelerisque morbi accumsan. Nec, tellus leo id leo id felis egestas. Quam sit lorem quis vitae ut mus imperdiet. Volutpat placerat dignissim dolor faucibus elit ornare fringilla. Vivamus amet risus ullamcorper auctor nibh. Maecenas morbi nec vestibulum ac tempus vehicula.'

const courseTemplates = [
  {
    title: 'Service Design Essentials',
    description: 'Learn the fundamentals of service design and apply them to real businesses.',
    imageUrl: serviceDesignImage,
  },
  {
    title: 'Software Developer',
    description: 'Build a solid foundation in programming and modern software development.',
    imageUrl: softwareDeveloperImage,
  },
  {
    title: 'UX/UI Design Beginner',
    description: 'Get started designing intuitive, user-friendly digital products from scratch.',
    imageUrl: uxUiDesignImage,
  },
  {
    title: 'UX/UI Design Beginner',
    description: 'Get started designing intuitive, user-friendly digital products from scratch.',
    imageUrl: uxUiDesignImage,
  },
  {
    title: 'Service Design Essentials',
    description: 'Learn the fundamentals of service design and apply them to real businesses.',
    imageUrl: serviceDesignImage,
  },
  {
    title: 'Software Developer',
    description: 'Build a solid foundation in programming and modern software development.',
    imageUrl: softwareDeveloperImage,
  },
]

export const courses: Course[] = Array.from({ length: 12 }, (_, index) => {
  const template = courseTemplates[index % courseTemplates.length]!
  return {
    id: `course-${index + 1}`,
    category: 'Course',
    title: template.title,
    description: template.description,
    longDescription,
    imageUrl: template.imageUrl,
    lessonCount: 6,
    hourCount: 6,
    price: 3559,
    modules,
  }
})
