import type { DemoContentRow } from '@/api/demoContent'

function row(
  lessonName: string,
  subLessonName: string,
  title: string,
  detail = title,
): DemoContentRow {
  return {
    lessonName,
    subLessonName,
    title,
    reading: {
      title,
      objective: `Learn ${title}`,
      paragraphs: [`${detail}: input, process, output.`, 'Try 60, 75 and 90. Use the Terminal.'],
      example: `Example for ${title}`,
      exercise: `Practice ${title}`,
      solution: `Suggested answer for ${title}`,
    },
  }
}

const softwareDeveloperRows: DemoContentRow[] = [
  row('Getting Started as a Developer', 'Welcome to Software Development', 'Welcome to Software Development'),
  row('Getting Started as a Developer', 'How Software Projects Are Built', 'How Software Projects Are Built'),
  row('Getting Started as a Developer', 'Choosing Your First Language', 'Choosing Your First Language'),
  row('Getting Started as a Developer', 'Setting Up Your Dev Environment', 'Setting Up Your Dev Environment'),
  row('Getting Started as a Developer', 'Your First Program', 'Your First Program'),
  row('Getting Started as a Developer', 'Git Basics for Beginners', 'Git Basics for Beginners'),
  row('Getting Started as a Developer', 'Reading Error Messages', 'Reading Error Messages'),
  row('Getting Started as a Developer', 'Asking Good Questions When Stuck', 'Asking Good Questions When Stuck'),
  row('Programming Fundamentals', 'Variables and Data Types', 'Variables and Data Types'),
  row('Programming Fundamentals', 'Operators and Expressions', 'Operators and Expressions'),
  row('Programming Fundamentals', 'Conditionals and Control Flow', 'Conditionals and Control Flow'),
  row('Programming Fundamentals', 'Loops and Iteration', 'Loops and Iteration'),
  row('Programming Fundamentals', 'Functions and Parameters', 'Functions and Parameters'),
  row('Programming Fundamentals', 'Arrays and Objects', 'Arrays and Objects'),
  row('Building for the Web', 'HTML Structure Essentials', 'HTML Structure Essentials'),
  row('Building for the Web', 'CSS Layout Basics', 'CSS Layout Basics'),
  row('Building for the Web', 'DOM Manipulation', 'DOM Manipulation'),
  row('Building for the Web', 'Working with APIs and JSON', 'Working with APIs and JSON'),
  row('Building for the Web', 'Async Code with Promises', 'Async Code with Promises'),
  row('Application Structure', 'Splitting Code into Modules', 'Splitting Code into Modules'),
  row('Application Structure', 'State and Side Effects', 'State and Side Effects'),
  row('Application Structure', 'Forms and Validation', 'Forms and Validation'),
  row('Application Structure', 'Debugging Strategies', 'Debugging Strategies'),
  row('Quality and Collaboration', 'Writing Readable Code', 'Writing Readable Code'),
  row('Quality and Collaboration', 'Intro to Automated Tests', 'Intro to Automated Tests'),
  row('Quality and Collaboration', 'Code Reviews and Pull Requests', 'Code Reviews and Pull Requests'),
  row('Quality and Collaboration', 'Deploying a Simple App', 'Deploying a Simple App'),
  row('Course Summary', 'Key Takeaways for Junior Developers', 'Key Takeaways for Junior Developers'),
  row('Course Summary', 'Building Your Learning Portfolio', 'Building Your Learning Portfolio'),
]

const uxUiDesignRows: DemoContentRow[] = [
  row('Design Foundations', 'Welcome to UX/UI Design', 'Welcome to UX/UI Design'),
  row('Design Foundations', 'What Designers Actually Do', 'What Designers Actually Do'),
  row('Design Foundations', 'UX vs UI vs Product Design', 'UX vs UI vs Product Design'),
  row('Design Foundations', 'Design Thinking in Practice', 'Design Thinking in Practice'),
  row('Design Foundations', 'Choosing Design Tools', 'Choosing Design Tools'),
  row('Design Foundations', 'Accessibility Mindset from Day One', 'Accessibility Mindset from Day One'),
  row('Design Foundations', 'Collecting Inspiration Without Copying', 'Collecting Inspiration Without Copying'),
  row('Design Foundations', 'Giving and Receiving Critique', 'Giving and Receiving Critique'),
  row('Understanding Users', 'User Research Methods', 'User Research Methods'),
  row('Understanding Users', 'Personas and Jobs to Be Done', 'Personas and Jobs to Be Done'),
  row('Understanding Users', 'User Journey Mapping', 'User Journey Mapping'),
  row('Understanding Users', 'Synthesizing Insights', 'Synthesizing Insights'),
  row('Information Architecture and Flows', 'Sitemaps and Content Inventory', 'Sitemaps and Content Inventory'),
  row('Information Architecture and Flows', 'User Flows', 'User Flows'),
  row('Information Architecture and Flows', 'Wireframing Low-Fidelity Screens', 'Wireframing Low-Fidelity Screens'),
  row('Information Architecture and Flows', 'Empty, Loading, and Error States', 'Empty, Loading, and Error States'),
  row('Visual UI Design', 'Typography for Interfaces', 'Typography for Interfaces'),
  row('Visual UI Design', 'Color, Contrast, and Theme', 'Color, Contrast, and Theme'),
  row('Visual UI Design', 'Spacing, Layout, and Grids', 'Spacing, Layout, and Grids'),
  row('Visual UI Design', 'Components and Design Systems Intro', 'Components and Design Systems Intro'),
  row('Visual UI Design', 'Mobile and Responsive Considerations', 'Mobile and Responsive Considerations'),
  row('Prototyping and Handoff', 'Interactive Prototypes in Figma', 'Interactive Prototypes in Figma'),
  row('Prototyping and Handoff', 'Usability Testing Basics', 'Usability Testing Basics'),
  row('Prototyping and Handoff', 'Turning Feedback into Iterations', 'Turning Feedback into Iterations'),
  row('Prototyping and Handoff', 'Developer Handoff Checklist', 'Developer Handoff Checklist'),
  row('Course Summary', 'Key Takeaways for New Designers', 'Key Takeaways for New Designers'),
  row('Course Summary', 'Building a Beginner Design Portfolio', 'Building a Beginner Design Portfolio'),
]

export function demoContentFixtures(courseTitle: string): DemoContentRow[] {
  switch (courseTitle) {
    case 'Software Developer':
      return softwareDeveloperRows
    case 'UX/UI Design Beginner':
      return uxUiDesignRows
    case 'Service Design Essentials':
      return [
        row(
          'Introduction to Service Design',
          'Introduction to Service Design',
          'Introduction to Service Design',
        ),
        row('Introduction to Service Design', 'Course Overview', 'Course Overview'),
        row('Introduction to Service Design', 'Getting to Know You', 'Getting to Know You'),
        row(
          'Introduction to Service Design',
          'What is Service Design ?',
          'What is Service Design ?',
        ),
        row('Research and Framing', 'Service Design Principles', 'Service Design Principles'),
        row(
          'Research and Framing',
          'User Research and Journey Mapping',
          'User Research and Journey Mapping',
        ),
        row(
          'Research and Framing',
          'Framing and Prioritizing Opportunities',
          'Framing and Prioritizing Opportunities',
        ),
        row('Prototyping and Improvement', 'Service Prototyping', 'Service Prototyping'),
        row(
          'Prototyping and Improvement',
          'Service Blueprint and Improvement',
          'Service Blueprint and Improvement',
        ),
      ]
    case 'Design Thinking Fundamentals':
      return [
        row('Discover', 'Understanding Design Thinking', 'Understanding Design Thinking'),
        row('Discover', 'Empathy and Observation', 'Empathy and Observation'),
        row('Define and Ideate', 'Defining the Problem', 'Defining the Problem'),
        row('Define and Ideate', 'Generating Ideas', 'Generating Ideas'),
        row('Prototype', 'Choosing Experiments', 'Choosing Experiments'),
        row('Prototype', 'Building Low-Cost Prototypes', 'Building Low-Cost Prototypes'),
        row('Test and Share', 'Testing and Iteration', 'Testing and Iteration'),
        row('Test and Share', 'Presenting a Design Story', 'Presenting a Design Story'),
      ]
    default:
      return []
  }
}
