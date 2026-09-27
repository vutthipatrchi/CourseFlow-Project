# Demo learning content

The frontend includes Thai reading material for all 10 seeded course titles (71
lessons). Each lesson has a learning objective, two explanatory paragraphs, an
example, a practice question, and a suggested answer. This is locally authored
practice content, not a full instructor-reviewed curriculum or a video library.

- Content: `frontend/src/data/demoLessons.ts`.
- Reading and answer disclosure: `frontend/src/components/course/LessonReading.vue`.
- Public course detail pages expose the first reading as a free sample.
- Each Module Samples entry also opens its own demo reading and test clip inline.
  Closing a sample or its parent module removes the video player. These public
  previews do not create or change enrolled-course progress.
- Purchased course pages attach the readings after the existing subscription and
  progress requests succeed. Completion still uses the existing backend API.
- The original generic seed lesson labels become descriptive labels in the learner
  UI. Database IDs, lesson ordering, and stored names are not modified.
- Named lessons match by course title and lesson title. Positional matching is
  limited to the original `Lesson N` / `Sub-lesson 1` seed placeholders, plus the
  first Service Design welcome lesson. Unknown/custom lessons remain unfilled.
- Exercises in the reading are self-check activities; there is no answer submission
  or grading. The separate existing My Assignments demo remains local mock data.
- Available video URLs render with native controls. For recognized demo lessons,
  empty and `example.com` seed URLs use the bundled `/videos/demo-flower.mp4` clip.
  The same clip is reused across demo lessons and clearly labeled as test footage.
  Actual video URLs take precedence; failed actual videos are not silently replaced.
  Custom lessons without a video or recognized reading remain unfilled.
- Public course detail pages include the same test clip for signed-out playback
  testing. The asset ships with the frontend; playback does not fetch from MDN.
  Source and license notes are in `frontend/public/videos/README.md`.
- Readings remain usable when a video fails. Completion is an explicit learner
  action and is not triggered by playing or reaching the end of the test clip.

No migration or database write is needed for these readings. Existing admin
courses that have been renamed or substantially restructured require an explicit
content mapping. The public catalog retains its existing demo IDs; it is not a
database-backed list of all ten courses.

Run `npm run test:unit`, `npm run lint`, `npm run format:check`, and `npm run build`
from `frontend/` to check changes.
