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

function cloneModules(source: Module[]): Module[] {
  return source.map((module) => ({
    ...module,
    subLessons: module.subLessons.map((item) => ({
      ...item,
      assignment: item.assignment ? { ...item.assignment } : undefined,
    })),
  }))
}

const serviceDesignModules: Module[] = [
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
          status: 'in-progress',
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
          status: 'overdue',
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

const softwareDeveloperModules: Module[] = [
  {
    id: 'module-1',
    title: 'Getting Started as a Developer',
    subLessons: [
      subLesson(
        'sub-1-1',
        'Welcome to Software Development',
        'Sets expectations for the course, the mindset of a beginner developer, and how to practice effectively between lessons.',
        'completed',
      ),
      subLesson(
        'sub-1-2',
        'How Software Projects Are Built',
        'Explains the journey from idea to shipped product: requirements, design, coding, testing, and deployment.',
        'completed',
      ),
      subLesson(
        'sub-1-3',
        'Choosing Your First Language',
        'Compares beginner-friendly languages and explains why we start with JavaScript for web development.',
        'completed',
      ),
      subLesson(
        'sub-1-4',
        'Setting Up Your Dev Environment',
        'Walks through installing an editor, Node.js, a terminal workflow, and useful extensions for day-to-day coding.',
        'completed',
        {
          id: 'sd-assignment-0',
          question: 'List the tools you installed and what each one is used for.',
          status: 'submitted',
          answer:
            'VS Code for editing, Node.js to run JavaScript, Git for version control, and Chrome DevTools for debugging.',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-1-5',
        'Your First Program',
        'Writes a tiny console program, prints values, and introduces saving files and running them from the terminal.',
        'completed',
      ),
      subLesson(
        'sub-1-6',
        'Git Basics for Beginners',
        'Covers init, status, add, commit, and push so you can track changes safely from the first project.',
        'in-progress',
        {
          id: 'sd-assignment-1',
          question: 'Explain the difference between git add and git commit in your own words.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-1-7',
        'Reading Error Messages',
        'Teaches how to calm down, read a stack trace, and use errors as clues instead of blockers.',
        'not-started',
      ),
      subLesson(
        'sub-1-8',
        'Asking Good Questions When Stuck',
        'Shows how to write a clear problem statement with expected vs actual behavior and a minimal example.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-2',
    title: 'Programming Fundamentals',
    subLessons: [
      subLesson(
        'sub-2-1',
        'Variables and Data Types',
        'Introduces strings, numbers, booleans, and why naming variables clearly matters for readable code.',
        'not-started',
      ),
      subLesson(
        'sub-2-2',
        'Operators and Expressions',
        'Covers arithmetic, comparison, and logical operators used in everyday program decisions.',
        'not-started',
      ),
      subLesson(
        'sub-2-3',
        'Conditionals and Control Flow',
        'Builds if/else and switch patterns so programs can react differently to different inputs.',
        'not-started',
        {
          id: 'sd-assignment-2',
          question:
            'Write a short decision tree for a login form (success, wrong password, missing email).',
          status: 'in-progress',
          answer:
            'If email empty → show required. Else if password wrong → show error. Else → redirect home.',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-2-4',
        'Loops and Iteration',
        'Uses for and while loops to process lists of data without repeating code by hand.',
        'not-started',
      ),
      subLesson(
        'sub-2-5',
        'Functions and Parameters',
        'Breaks work into reusable functions and explains arguments, return values, and scope.',
        'not-started',
      ),
      subLesson(
        'sub-2-6',
        'Arrays and Objects',
        'Models real data with arrays and objects, then reads and updates nested values safely.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-3',
    title: 'Building for the Web',
    subLessons: [
      subLesson(
        'sub-3-1',
        'HTML Structure Essentials',
        'Creates semantic page structure with headings, sections, forms, and accessible labels.',
        'not-started',
      ),
      subLesson(
        'sub-3-2',
        'CSS Layout Basics',
        'Uses flexbox and spacing to build clean layouts without fighting the cascade.',
        'not-started',
      ),
      subLesson(
        'sub-3-3',
        'DOM Manipulation',
        'Selects elements, updates text and styles, and responds to user clicks in the browser.',
        'not-started',
      ),
      subLesson(
        'sub-3-4',
        'Working with APIs and JSON',
        'Fetches data from an API, parses JSON, and renders the result on the page.',
        'not-started',
        {
          id: 'sd-assignment-3',
          question: 'Describe one API response field you would display on a course card and why.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-3-5',
        'Async Code with Promises',
        'Explains callbacks vs promises vs async/await and how to handle loading and failed requests.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-4',
    title: 'Application Structure',
    subLessons: [
      subLesson(
        'sub-4-1',
        'Splitting Code into Modules',
        'Organizes a project into folders and modules so features stay easy to find and change.',
        'not-started',
      ),
      subLesson(
        'sub-4-2',
        'State and Side Effects',
        'Separates stored data from UI updates and avoids buggy double-writes.',
        'not-started',
      ),
      subLesson(
        'sub-4-3',
        'Forms and Validation',
        'Builds a form with client-side validation and clear error messages for users.',
        'not-started',
        {
          id: 'sd-assignment-4',
          question: 'List three validation rules you would add to a sign-up form.',
          status: 'overdue',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-4-4',
        'Debugging Strategies',
        'Uses console logging, breakpoints, and reproduction steps to isolate bugs faster.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-5',
    title: 'Quality and Collaboration',
    subLessons: [
      subLesson(
        'sub-5-1',
        'Writing Readable Code',
        'Applies naming, small functions, and comments that explain why, not what.',
        'not-started',
      ),
      subLesson(
        'sub-5-2',
        'Intro to Automated Tests',
        'Writes a first unit test and explains why tests protect future changes.',
        'not-started',
      ),
      subLesson(
        'sub-5-3',
        'Code Reviews and Pull Requests',
        'Shows how to open a PR, leave constructive feedback, and respond to review comments.',
        'not-started',
        {
          id: 'sd-assignment-5',
          question: 'Write a short PR description for a feature that adds a search bar.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-5-4',
        'Deploying a Simple App',
        'Publishes a static frontend and verifies the live URL after deployment.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-6',
    title: 'Course Summary',
    subLessons: [
      subLesson(
        'sub-6-1',
        'Key Takeaways for Junior Developers',
        'Recaps the core skills from fundamentals through shipping a small web app.',
        'not-started',
      ),
      subLesson(
        'sub-6-2',
        'Building Your Learning Portfolio',
        'Outlines how to turn course projects into a portfolio that shows growth to employers.',
        'not-started',
        {
          id: 'sd-assignment-6',
          question: 'Outline three portfolio projects you want to build next and why.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
    ],
  },
]

const uxUiDesignModules: Module[] = [
  {
    id: 'module-1',
    title: 'Design Foundations',
    subLessons: [
      subLesson(
        'sub-1-1',
        'Welcome to UX/UI Design',
        'Introduces the course goals, weekly rhythm, and how critique helps you improve faster.',
        'completed',
      ),
      subLesson(
        'sub-1-2',
        'What Designers Actually Do',
        'Maps day-to-day designer work across research, flows, visuals, prototyping, and handoff.',
        'completed',
      ),
      subLesson(
        'sub-1-3',
        'UX vs UI vs Product Design',
        'Clarifies role boundaries and how teams collaborate when titles overlap.',
        'completed',
      ),
      subLesson(
        'sub-1-4',
        'Design Thinking in Practice',
        'Walks through empathize, define, ideate, prototype, and test with a small product example.',
        'completed',
        {
          id: 'ux-assignment-0',
          question: 'Pick one everyday app and describe a pain point you would redesign first.',
          status: 'submitted',
          answer:
            'A food delivery app checkout: too many steps before payment, so I would simplify address and tip selection.',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-1-5',
        'Choosing Design Tools',
        'Compares Figma and adjacent tools, then sets up files, pages, and components for class projects.',
        'completed',
      ),
      subLesson(
        'sub-1-6',
        'Accessibility Mindset from Day One',
        'Covers contrast, focus states, labels, and why inclusive design is a core skill, not a polish step.',
        'in-progress',
        {
          id: 'ux-assignment-1',
          question: 'List three accessibility checks you will apply to every screen you design.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-1-7',
        'Collecting Inspiration Without Copying',
        'Shows how to build a mood board and extract patterns ethically from references.',
        'not-started',
      ),
      subLesson(
        'sub-1-8',
        'Giving and Receiving Critique',
        'Practices feedback that is specific, kind, and actionable for design reviews.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-2',
    title: 'Understanding Users',
    subLessons: [
      subLesson(
        'sub-2-1',
        'User Research Methods',
        'Introduces interviews, surveys, and usability sessions and when each method fits.',
        'not-started',
      ),
      subLesson(
        'sub-2-2',
        'Personas and Jobs to Be Done',
        'Turns research notes into personas and job statements that guide design decisions.',
        'not-started',
      ),
      subLesson(
        'sub-2-3',
        'User Journey Mapping',
        'Plots emotions, actions, and pain points across an end-to-end experience.',
        'not-started',
        {
          id: 'ux-assignment-2',
          question: 'Map one journey step that frustrates users and propose a design opportunity.',
          status: 'in-progress',
          answer:
            'Finding the cancel button is hard after checkout; opportunity: place account actions in a clearer settings menu.',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-2-4',
        'Synthesizing Insights',
        'Clusters findings into themes and writes problem statements teams can act on.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-3',
    title: 'Information Architecture and Flows',
    subLessons: [
      subLesson(
        'sub-3-1',
        'Sitemaps and Content Inventory',
        'Organizes product content so users can find what they need without hunting.',
        'not-started',
      ),
      subLesson(
        'sub-3-2',
        'User Flows',
        'Draws the path a user takes to complete a key task before designing screens.',
        'not-started',
      ),
      subLesson(
        'sub-3-3',
        'Wireframing Low-Fidelity Screens',
        'Sketches structure first so layout decisions stay cheap to change.',
        'not-started',
        {
          id: 'ux-assignment-3',
          question:
            'Sketch a 3-screen wireflow for signing up and explain your navigation choices.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-3-4',
        'Empty, Loading, and Error States',
        'Designs the often-missed states that make products feel reliable.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-4',
    title: 'Visual UI Design',
    subLessons: [
      subLesson(
        'sub-4-1',
        'Typography for Interfaces',
        'Chooses type scales, hierarchy, and readable line lengths for screens.',
        'not-started',
      ),
      subLesson(
        'sub-4-2',
        'Color, Contrast, and Theme',
        'Builds a simple palette with semantic colors for success, warning, and error.',
        'not-started',
      ),
      subLesson(
        'sub-4-3',
        'Spacing, Layout, and Grids',
        'Uses consistent spacing tokens and grids to keep screens calm and aligned.',
        'not-started',
        {
          id: 'ux-assignment-4',
          question: 'Explain how you would use an 8px spacing system on a settings page.',
          status: 'overdue',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-4-4',
        'Components and Design Systems Intro',
        'Creates reusable buttons, inputs, and cards so designs stay consistent as they grow.',
        'not-started',
      ),
      subLesson(
        'sub-4-5',
        'Mobile and Responsive Considerations',
        'Adapts layouts for small screens without losing hierarchy or tap targets.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-5',
    title: 'Prototyping and Handoff',
    subLessons: [
      subLesson(
        'sub-5-1',
        'Interactive Prototypes in Figma',
        'Connects frames into a clickable prototype for stakeholder demos and testing.',
        'not-started',
      ),
      subLesson(
        'sub-5-2',
        'Usability Testing Basics',
        'Runs a lightweight test script and captures observations instead of opinions.',
        'not-started',
      ),
      subLesson(
        'sub-5-3',
        'Turning Feedback into Iterations',
        'Prioritizes issues by severity and updates the design without rewriting everything.',
        'not-started',
        {
          id: 'ux-assignment-5',
          question: 'Summarize two usability findings and the change you would make for each.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
      subLesson(
        'sub-5-4',
        'Developer Handoff Checklist',
        'Prepares specs, assets, and edge cases so engineering can implement accurately.',
        'not-started',
      ),
    ],
  },
  {
    id: 'module-6',
    title: 'Course Summary',
    subLessons: [
      subLesson(
        'sub-6-1',
        'Key Takeaways for New Designers',
        'Recaps research, flows, UI craft, and testing as one continuous design loop.',
        'not-started',
      ),
      subLesson(
        'sub-6-2',
        'Building a Beginner Design Portfolio',
        'Shows how to present process, not just final screenshots, in a first portfolio case study.',
        'not-started',
        {
          id: 'ux-assignment-6',
          question: 'Outline one case study section list you would include in your portfolio.',
          status: 'pending',
          deadlineLabel: 'Assign within 2 days',
        },
      ),
    ],
  },
]

type CourseTemplate = {
  title: string
  description: string
  longDescription: string
  imageUrl: string
  hourCount: number
  modules: Module[]
}

const courseTemplates: CourseTemplate[] = [
  {
    title: 'Service Design Essentials',
    description: 'Learn the fundamentals of service design and apply them to real businesses.',
    longDescription:
      'This course teaches you how to design services end to end—from understanding users and mapping journeys to framing opportunities, prototyping ideas, and validating them with real feedback. You will work through practical case studies and leave with a repeatable service design process you can use on product and business teams.',
    imageUrl: serviceDesignImage,
    hourCount: 8,
    modules: serviceDesignModules,
  },
  {
    title: 'Software Developer',
    description: 'Build a solid foundation in programming and modern software development.',
    longDescription:
      'Start your path as a software developer with practical lessons on programming fundamentals, web technologies, application structure, testing, and collaboration. Each module includes hands-on sub-lessons and short assignments so you learn by building, debugging, and shipping small projects.',
    imageUrl: softwareDeveloperImage,
    hourCount: 10,
    modules: softwareDeveloperModules,
  },
  {
    title: 'UX/UI Design Beginner',
    description: 'Get started designing intuitive, user-friendly digital products from scratch.',
    longDescription:
      'Learn UX and UI from the ground up: research, journeys, information architecture, visual design, prototyping, and handoff. The course is built for beginners who want structured practice, critique-ready assignments, and a clear path to a first portfolio case study.',
    imageUrl: uxUiDesignImage,
    hourCount: 9,
    modules: uxUiDesignModules,
  },
  {
    title: 'UX/UI Design Beginner',
    description: 'Get started designing intuitive, user-friendly digital products from scratch.',
    longDescription:
      'Learn UX and UI from the ground up: research, journeys, information architecture, visual design, prototyping, and handoff. The course is built for beginners who want structured practice, critique-ready assignments, and a clear path to a first portfolio case study.',
    imageUrl: uxUiDesignImage,
    hourCount: 9,
    modules: uxUiDesignModules,
  },
  {
    title: 'Service Design Essentials',
    description: 'Learn the fundamentals of service design and apply them to real businesses.',
    longDescription:
      'This course teaches you how to design services end to end—from understanding users and mapping journeys to framing opportunities, prototyping ideas, and validating them with real feedback. You will work through practical case studies and leave with a repeatable service design process you can use on product and business teams.',
    imageUrl: serviceDesignImage,
    hourCount: 8,
    modules: serviceDesignModules,
  },
  {
    title: 'Software Developer',
    description: 'Build a solid foundation in programming and modern software development.',
    longDescription:
      'Start your path as a software developer with practical lessons on programming fundamentals, web technologies, application structure, testing, and collaboration. Each module includes hands-on sub-lessons and short assignments so you learn by building, debugging, and shipping small projects.',
    imageUrl: softwareDeveloperImage,
    hourCount: 10,
    modules: softwareDeveloperModules,
  },
]

export const courses: Course[] = Array.from({ length: 12 }, (_, index) => {
  const template = courseTemplates[index % courseTemplates.length]!
  const modules = cloneModules(template.modules)
  return {
    id: `course-${index + 1}`,
    category: 'Course',
    title: template.title,
    description: template.description,
    longDescription: template.longDescription,
    imageUrl: template.imageUrl,
    lessonCount: modules.length,
    hourCount: template.hourCount,
    price: 3559,
    modules,
  }
})
