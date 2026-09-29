import { describe, expect, it } from 'vitest'
import { createDemoModules, getDemoLesson, getDemoLessonLabels } from '@/data/demoLessons'
import { demoContentFixtures } from './demoContentFixtures'

describe('demo content returned by the backend', () => {
  it('matches readings under a shared lesson with multiple sub-lessons', () => {
    const content = demoContentFixtures('Design Thinking Fundamentals')
    const reference = {
      title: 'Empathy and Observation',
      lessonTitle: 'Discover',
      lessonPosition: 1,
      subLessonPosition: 2,
    }
    expect(getDemoLesson(content, reference)?.title).toBe('Empathy and Observation')
    expect(getDemoLessonLabels(reference, getDemoLesson(content, reference)).title).toBe(
      'Empathy and Observation',
    )
    expect(
      getDemoLesson(content, {
        title: 'Generating Ideas',
        lessonTitle: 'Define and Ideate',
        lessonPosition: 2,
        subLessonPosition: 2,
      })?.title,
    ).toBe('Generating Ideas')
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

  it('provides all named Service Design seed readings under shared lessons', () => {
    const content = demoContentFixtures('Service Design Essentials')
    for (const name of [
      'Introduction to Service Design',
      'Course Overview',
      'Getting to Know You',
      'What is Service Design ?',
    ]) {
      const lesson = getDemoLesson(content, {
        title: name,
        lessonTitle: 'Introduction to Service Design',
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

  it('builds public previews grouped by lesson name', () => {
    const modules = createDemoModules(demoContentFixtures('Service Design Essentials'))
    expect(modules).toHaveLength(3)
    expect(modules.map((module) => module.title)).toEqual([
      'Introduction to Service Design',
      'Research and Framing',
      'Prototyping and Improvement',
    ])
    expect(modules[0]?.subLessons.map((lesson) => lesson.title)).toEqual([
      'Introduction to Service Design',
      'Course Overview',
      'Getting to Know You',
      'What is Service Design ?',
    ])
    expect(createDemoModules([])).toEqual([])
  })
})
