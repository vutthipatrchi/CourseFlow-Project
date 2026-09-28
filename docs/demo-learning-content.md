# Demo learning content

The backend stores Thai reading material for all 10 seeded course titles (71
main lessons), plus three named sub-lessons in the first Service Design lesson.
Each reading has a learning objective, two explanatory paragraphs, an example,
a practice question, and a suggested answer. This is locally authored practice
content, not a full instructor-reviewed curriculum or a video library.

- Content: `backend/src/main/resources/db/migration/V13__add_demo_lesson_content.sql`.
- The public `GET /api/catalog/demo-content?courseTitle=...` endpoint returns
  the first reading as a free sample and only titles for the remaining outline.
  The authenticated `GET /api/me/courses/{courseId}/demo-content` endpoint
  returns full readings only after the backend confirms an active subscription.
  A failed request shows an error, not hardcoded content.
- Reading and answer disclosure: `frontend/src/components/course/LessonReading.vue`.
- Public course detail pages expose the first reading as a free sample.
- The first Module Samples entry opens the same free reading and test clip inline.
  Other entries show their titles without exposing the reading or answer.
  Closing the sample or its parent module removes the video player. Public
  previews do not create or change enrolled-course progress.
- Purchased course pages attach the readings after the existing subscription and
  progress requests succeed. Completion still uses the existing backend API.
- The original generic seed lesson labels become descriptive labels in the learner
  UI. Database IDs, lesson ordering, and stored names are not modified.
- Named lessons match by course title and lesson title. The original
  `Lesson N` / `Sub-lesson 1` placeholders use the `N` in the stored lesson
  name, so reordering a lesson or its sub-lesson keeps the reading. The first Service Design
  lesson also includes readings for its four named seed sub-lessons.
  Unknown/custom lessons remain unfilled.
- Exercises in the reading are self-check activities; there is no answer submission
  or grading for these exercises. Separate assignment cards in the course player
  and My Assignments load and submit through the assignment API.
- Available video URLs render with native controls. For recognized demo lessons,
  empty and `example.com` seed URLs use the backend's `/api/catalog/demo-video` clip.
  The same clip is reused across demo lessons and clearly labeled as test footage.
  Actual video URLs take precedence; failed actual videos are not silently replaced.
  Custom lessons without a video or recognized reading remain unfilled.
- Public course detail pages include the same test clip for signed-out playback
  testing. The asset ships with the backend; playback does not fetch from MDN.
  Source and license notes are in `frontend/public/videos/README.md`.
- Readings remain usable when a video fails. Completion is an explicit learner
  action and is not triggered by playing or reaching the end of the test clip.

Migration V13 stores these readings in PostgreSQL. Start the backend with its
database-backed `local` profile to serve them; the default `standalone` profile
has no course-content API. Existing admin courses that have been renamed or
substantially restructured require an explicit content mapping. The public
catalog retains its existing demo IDs; it is not a database-backed list of all
ten courses.

Run `npm run test:unit`, `npm run lint`, `npm run format:check`, and `npm run build`
from `frontend/`. Run `./mvnw verify` from `backend/`, then the local-profile
tests with PostgreSQL to check the migration and stored content.
