import { describe, expect, it } from 'vitest'
import { demoCurricula, getDemoLesson } from '@/data/demoLessons'
import { courses } from '@/data/courses'

const expectedCounts: Record<string, number> = {
  'Service Design Essentials': 6,
  'Design Thinking Fundamentals': 8,
  'UX Research Methods': 7,
  'Product Strategy': 9,
  'Digital Marketing Basics': 6,
  'Data Analytics Foundations': 10,
  'Leadership Essentials': 5,
  'Agile Project Management': 8,
  'Software Developer': 6,
  'UX/UI Design Beginner': 6,
}

describe('demo learning material', () => {
  it('covers all 71 seeded lessons with distinct readings and worked exercises', () => {
    expect(Object.keys(demoCurricula).sort()).toEqual(Object.keys(expectedCounts).sort())
    const allLessons = Object.values(demoCurricula).flat()
    expect(allLessons).toHaveLength(71)
    expect(new Set(allLessons.map((lesson) => lesson.example)).size).toBe(71)
    for (const [title, count] of Object.entries(expectedCounts)) {
      const curriculum = demoCurricula[title]!
      expect(curriculum).toHaveLength(count)
      curriculum.forEach((lesson, index) => {
        for (const text of [
          lesson.objective,
          ...lesson.paragraphs,
          lesson.example,
          lesson.exercise,
          lesson.solution,
        ]) {
          expect(text.trim().length).toBeGreaterThan(20)
          expect(text).not.toMatch(/lorem ipsum|example\.com/i)
        }
        const namedSeed = ['Software Developer', 'UX/UI Design Beginner'].includes(title)
        expect(
          getDemoLesson(title, {
            title: namedSeed ? lesson.title : 'Sub-lesson 1',
            lessonTitle: namedSeed ? lesson.title : `Lesson ${index + 1}`,
            lessonPosition: index + 1,
            subLessonPosition: 1,
          }),
        ).toBe(lesson)
      })
    }
  })

  it('matches the Service Design seed welcome without filling extra or custom lessons', () => {
    const seed = {
      title: 'Welcome to the Course',
      lessonTitle: 'Lesson 1',
      lessonPosition: 1,
      subLessonPosition: 1,
    }
    expect(getDemoLesson('Service Design Essentials', seed)?.title).toBe(
      'Introduction to Service Design',
    )
    expect(
      getDemoLesson('Service Design Essentials', { ...seed, title: 'My custom lesson' }),
    ).toBeUndefined()
    expect(
      getDemoLesson('Service Design Essentials', {
        ...seed,
        title: 'Sub-lesson 1',
        lessonTitle: 'My custom module',
      }),
    ).toBeUndefined()
    expect(
      getDemoLesson('Service Design Essentials', { ...seed, subLessonPosition: 2 }),
    ).toBeUndefined()
    expect(getDemoLesson('Unknown course', seed)).toBeUndefined()
    expect(getDemoLesson('constructor', seed)).toBeUndefined()
  })

  it('shows course-specific public outlines without pre-completed demo progress', () => {
    for (const course of courses) {
      expect(course.modules.map((module) => module.title)).toEqual(
        demoCurricula[course.title]!.map((lesson) => lesson.title),
      )
      for (const lesson of course.modules.flatMap((module) => module.subLessons)) {
        expect(lesson.progress).toBe('not-started')
        expect(lesson.demoLesson).toBeDefined()
      }
    }
  })
})
