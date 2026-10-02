export type CourseDetailContent = {
  summary: string
  description: string
}

// Default copy for the seeded catalog. Admin-authored descriptions take precedence.
export const courseDetails: Record<string, CourseDetailContent> = {
  'Service Design Essentials': {
    summary:
      'Learn to design better services by understanding people, mapping journeys, and testing ideas.',
    description:
      'Explore service design from the first customer interaction to the processes that support it behind the scenes. Learn how service design connects with UX, UI, and design thinking, then use research and journey maps to identify unmet needs and opportunities.\n\nPractice turning insights into service concepts, creating service blueprints, and testing prototypes with feedback. This course suits beginners, designers, and people working on customer experiences who want a practical process for improving an existing service or planning a new one.',
  },
  'Software Developer': {
    summary: 'Build a foundation in programming, web development, testing, and collaboration.',
    description:
      'Start with the tools and habits of software development, including editor setup, Git, and debugging. Work through variables, data types, control flow, functions, and data structures before connecting HTML, CSS, and JavaScript to build a small web application.\n\nExplore APIs, application structure, testing, and code review, with practice exercises that help you explain and improve your code. This course is designed for beginners and aspiring developers who want a structured path toward building projects and a learning portfolio.',
  },
  'UX/UI Design Beginner': {
    summary:
      'Learn user research, interface design, and prototyping to create intuitive digital products.',
    description:
      'Learn how UX and UI work together to solve user problems. Start with design foundations and research, then turn your findings into personas, journeys, information architecture, user flows, and wireframes. Develop your visual design skills through typography, color, spacing, accessibility, and reusable components.\n\nUse Figma prototypes to explore interactions, collect usability feedback, and refine your designs before preparing a developer handoff. This course suits beginners and aspiring product designers who want to practice the design process and outline their first portfolio case study.',
  },
  'Design Thinking Fundamentals': {
    summary:
      'Turn user needs into practical ideas through research, ideation, prototyping, and testing.',
    description:
      'Discover a practical approach to solving problems with the people who experience them. Learn to observe and interview users, separate assumptions from evidence, and frame a focused problem before generating and comparing possible solutions.\n\nCreate simple prototypes that answer a specific question, plan useful tests, and use feedback to decide what to improve next. This course suits beginners, designers, and teams who want to apply the empathize, define, ideate, prototype, and test cycle to everyday product and service challenges.',
  },
  'UX Research Methods': {
    summary:
      'Plan user research, conduct interviews and usability tests, and turn findings into design decisions.',
    description:
      'Learn to choose research methods that match the question your team needs to answer. Explore research planning, participant selection, interviews, surveys, and usability testing, with an emphasis on neutral questions, careful observation, and responsible handling of participant information.\n\nPractice organizing research notes, identifying patterns, and communicating findings with evidence and limitations. This course suits designers, product teams, and beginners who want to understand user needs and make more informed decisions about what to build or improve.',
  },
  'Product Strategy': {
    summary:
      'Define a clear product direction, prioritize opportunities, and measure progress toward meaningful goals.',
    description:
      'Learn to connect customer problems with a product direction your team can act on. Explore product vision, user segmentation, market and competitor analysis, and value propositions to decide which audience to serve and which opportunities deserve attention.\n\nPractice setting goals, prioritizing work, shaping a roadmap, and selecting metrics and experiments to check your assumptions. This course suits aspiring product managers, founders, and cross-functional teams who want to explain product trade-offs and connect everyday decisions to a shared strategy.',
  },
  'Digital Marketing Basics': {
    summary:
      'Understand your audience, plan digital campaigns, and use results to improve your marketing.',
    description:
      'Build a foundation in digital marketing by connecting audience needs with clear campaign goals and messages. Explore content, search, social media, email, and paid channels, and learn to choose a channel based on the people you want to reach and the action you want them to take.\n\nPractice planning a campaign, choosing relevant metrics, and interpreting results without confusing clicks with business outcomes. This course suits beginners, small business owners, and people starting a marketing role who want a practical way to plan and review digital marketing activity.',
  },
  'Data Analytics Foundations': {
    summary:
      'Turn raw data into useful insights with clear questions, careful analysis, and effective charts.',
    description:
      'Learn an analysis process that begins with a question and ends with a conclusion supported by evidence. Explore data types, collection, cleaning, summaries, and basic statistical reasoning, including how missing values, outliers, and sampling choices affect what you can conclude.\n\nPractice comparing groups, looking for relationships, choosing charts, and reporting findings with units, time periods, and limitations. This course suits beginners and people who work with reports or spreadsheets and want to make clearer, more reliable decisions from data.',
  },
  'Leadership Essentials': {
    summary:
      'Develop practical skills in communication, feedback, delegation, and team leadership.',
    description:
      'Learn how to help a team work toward a shared outcome with clear goals and expectations. Practice active listening, asking useful questions, and giving feedback about observable behavior and its effect, then explore coaching and delegation with clear decision boundaries.\n\nWork through ways to handle disagreements, support teammates, and reflect on how the team works. This course suits new managers, team leads, and people preparing for leadership responsibilities who want practical communication habits they can apply in everyday conversations.',
  },
  'Agile Project Management': {
    summary:
      'Plan and deliver work in small increments with clear priorities, team feedback, and continuous improvement.',
    description:
      'Explore how agile teams organize work around useful outcomes and adapt as they learn. Learn the foundations of Scrum and Kanban, define actionable user stories, prioritize a backlog, and plan manageable increments with a clear definition of done.\n\nPractice coordinating work, making blockers visible, reviewing results, and using retrospectives to choose improvements for the next cycle. This course suits project coordinators, product teams, and beginners who want a practical introduction to collaborative planning and iterative delivery.',
  },
}
