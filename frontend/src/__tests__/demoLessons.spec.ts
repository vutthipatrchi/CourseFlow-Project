import { describe, expect, it } from 'vitest'
import { createDemoModules, getDemoLesson, getDemoLessonLabels } from '@/data/demoLessons'
import { demoContentFixtures } from './demoContentFixtures'

describe('demo content returned by the backend', () => {
  it('keeps the reading attached to its stored lesson name after reordering', () => {
    const content = demoContentFixtures('Design Thinking Fundamentals')
    const reference = {
      title: 'Sub-lesson 1',
      lessonTitle: 'Lesson 2',
      lessonPosition: 3,
      subLessonPosition: 2,
    }
    expect(getDemoLesson(content, reference)?.title).toBe('Empathy and Observation')
    expect(getDemoLessonLabels(reference, getDemoLesson(content, reference)).title).toBe(
      'Empathy and Observation',
    )
    expect(getDemoLesson(content, { ...reference, lessonTitle: 'Lesson 3' })?.title).toBe(
      'Problem Framing',
    )
    expect(getDemoLesson(content, { ...reference, lessonTitle: 'Custom module' })).toBeUndefined()
    expect(getDemoLesson([], reference)).toBeUndefined()
  })

  it('provides all named Service Design seed readings after reordering', () => {
    const content = demoContentFixtures('Service Design Essentials')
    for (const [index, name] of [
      'Welcome to the Course',
      'Course Overview',
      'Getting to Know You',
      'What is Service Design ?',
    ].entries()) {
      const lesson = getDemoLesson(content, {
        title: name,
        lessonTitle: 'Lesson 1',
        lessonPosition: 4,
        subLessonPosition: index + 1,
      })
      expect(lesson).toBe(content[index]?.reading)
    }
    expect(
      getDemoLesson(content, {
        title: 'My custom lesson',
        lessonTitle: 'Lesson 1',
        lessonPosition: 4,
        subLessonPosition: 1,
      }),
    ).toBeUndefined()
  })

  it('builds public previews only from backend rows', () => {
    const modules = createDemoModules(demoContentFixtures('Service Design Essentials'))
    expect(modules).toHaveLength(1)
    expect(modules[0]?.subLessons.map((lesson) => lesson.title)).toEqual([
      'Introduction to Service Design',
      'Course Overview',
      'Getting to Know You',
      'What is Service Design ?',
    ])
    expect(createDemoModules([])).toEqual([])
  })
})
