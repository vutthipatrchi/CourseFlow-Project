import type { DemoLesson } from '@/types/course'

/** Every catalog lesson has a short description. Expand it into a reading long enough to scroll. */
export function buildLessonReading(title: string, description: string): DemoLesson {
  const idea = description.trim().replace(/\.$/, '')
  const ideaSentence = `${idea.charAt(0).toLowerCase()}${idea.slice(1)}`
  return {
    title,
    objective: idea,
    paragraphs: [
      `${title} sits inside a larger course, but this page is only about one idea: ${ideaSentence}. Read it once for the shape of the idea, then again with a real situation in mind. If a sentence sounds familiar and you cannot point to an example, stay on that sentence until you can.`,
      `Start by naming who this lesson is for. In ${title}, the useful person is not “a user” in general. It is someone with a goal, a constraint, and a moment when the idea matters. Write that person down before you look for a technique. A lesson that never names a person turns into a definition you will forget.`,
      `Then separate what you can observe from what you are guessing. ${ideaSentence}. Facts are things you could show someone else: a screen, a sentence a learner said, a number, a step they took. Interpretations are your explanation of those facts. Keep them on different lines. Most weak notes mix the two and then cannot be checked.`,
      `Work through ${title} in three passes. On the first pass, restate the idea without looking at this page. On the second pass, apply it to one situation from this course or from a product you already use. On the third pass, change one detail — the person, the constraint, or the goal — and say whether your conclusion still holds. If it does not, write which part of the idea broke. That third pass is what makes the lesson stick.`,
      `A common miss is to finish ${title} by repeating the title. Another is to jump to a tool, a screen, or a template before you can say what question the lesson answers. A third is to treat the single example below as proof that the same result will happen every time. Use the example to see the shape of a good answer, then build a second one from your own situation.`,
      `You are ready for the next lesson when your notes can stand without this page open. They should name who is involved, what they are trying to do, the choice ${title} suggests, and how you would know the choice worked. If any of those four is missing, the page is still the right place to be.`,
    ],
    example: `A teammate asks what actually changes after ${title}. Start from this idea: ${ideaSentence}. Describe what people do today, what you would change, and one signal you could watch afterward. For instance, if the change is real, a new learner should be able to complete the related step without asking someone to translate the lesson for them. Write that case as situation, idea, and result. Then change one detail, such as the person’s experience or the time they have, and say whether the result still holds.`,
    exercise: `Write a full note on ${title}, not a label. Use several sentences. Include a real situation from this course or from a product you use, the idea in your own words, the decision you would make, and the result you expect to see. Write it before you read a suggested answer. If you get stuck, answer these in order: Who is involved? What are they trying to do? What does this lesson change? How would someone else check that it worked?`,
    solution: `A strong note restates the lesson without copying the heading: ${idea}. It names a concrete situation, the choice you would make because of ${title}, and a check someone else could repeat. Your wording does not need to match a model answer. It does need those three parts. If the check is missing, add one sentence that says how you would know the conclusion is wrong.`,
  }
}
