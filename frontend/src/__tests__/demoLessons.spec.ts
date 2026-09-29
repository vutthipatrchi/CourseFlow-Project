import { describe, expect, it } from 'vitest'
import { createDemoModules, getDemoLesson, getDemoLessonLabels } from '@/data/demoLessons'
import { demoContentFixtures } from './demoContentFixtures'

describe('demo content returned by the backend', () => {
  it('matches readings by descriptive lesson and sub-lesson names', () => {
    const content = demoContentFixtures('Design Thinking Fundamentals')
    const reference = {
      title: 'Empathy and Observation',
      lessonTitle: 'Empathy and Observation',
      lessonPosition: 2,
      subLessonPosition: 1,
    }
    expect(getDemoLesson(content, reference)?.title).toBe('Empathy and Observation')
    expect(getDemoLessonLabels(reference, getDemoLesson(content, reference)).title).toBe(
      'Empathy and Observation',
    )
    expect(
      getDemoLesson(content, {
        ...reference,
        title: 'Problem Framing',
        lessonTitle: 'Problem Framing',
      })?.title,
    ).toBe('Problem Framing')
    expect(
      getDemoLesson(content, {
        title: 'Unknown sub-lesson',
        lessonTitle: 'Custom module',
        lessonPosition: 9,
        subLessonPosition: 1,
      }),
    ).toBeUndefined()
    expect(getDemoLesson([], reference)).toBeUndefined()
  })

  it('still resolves legacy Lesson N labels via title fallback', () => {
    const content = demoContentFixtures('Design Thinking Fundamentals')
    const reference = {
      title: 'Sub-lesson 1',
      lessonTitle: 'Lesson 2',
      lessonPosition: 2,
      subLessonPosition: 1,
    }
    // Generic labels alone cannot pick a row; labels helper uses the matched reading title.
    expect(getDemoLesson(content, reference)).toBeUndefined()
    expect(
      getDemoLesson(content, {
        title: 'Empathy and Observation',
        lessonTitle: 'Lesson 2',
        lessonPosition: 2,
        subLessonPosition: 1,
      })?.title,
    ).toBe('Empathy and Observation')
  })

  it('provides all named Service Design seed readings', () => {
    const content = demoContentFixtures('Service Design Essentials')
    for (const name of [
      'Introduction to Service Design',
      'Course Overview',
      'Getting to Know You',
      'What is Service Design ?',
    ]) {
      const lesson = getDemoLesson(content, {
        title: name,
        lessonTitle: name,
        lessonPosition: 1,
        subLessonPosition: 1,
      })
      expect(lesson?.title).toBe(name)
    }
    expect(
      getDemoLesson(content, {
        title: 'My custom lesson',
        lessonTitle: 'Introduction to Service Design',
        lessonPosition: 1,
        subLessonPosition: 1,
      }),
    ).toBeUndefined()
  })

  it('builds public previews only from backend rows', () => {
    const modules = createDemoModules(demoContentFixtures('Service Design Essentials'))
    expect(modules).toHaveLength(4)
    expect(modules.map((module) => module.title)).toEqual([
      'Introduction to Service Design',
      'Course Overview',
      'Getting to Know You',
      'What is Service Design ?',
    ])
    expect(createDemoModules([])).toEqual([])
  })
})
