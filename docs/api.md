# API baseline

The frontend calls relative `/api` URLs. Vite proxies them to
`http://localhost:8080` during development. Production hosting must route
`/api/*` to the backend and serve the frontend build separately.

## GET /api/health

Returns HTTP 200 and `{"status":"UP","application":"CourseFlow"}`.
This is a liveness check, not a database readiness check.

Business endpoints, authentication and the course data model will be added
with their features. No public user or course APIs exist yet.

## Admin assignments

These endpoints require the `local` (or another database-backed) profile —
they are unavailable when running with the default `standalone` profile.
No authentication exists yet; these are open. Admin authentication (Clerk)
is planned as a later feature.

### GET /api/admin/sub-lessons

Returns every sub-lesson with its lesson and course context, for populating
the "create assignment" form's sub-lesson picker.

```json
[
  {
    "subLessonId": 1,
    "subLessonName": "Structuring a Page",
    "lessonName": "HTML Basics",
    "courseName": "Introduction to Web Development"
  }
]
```

### POST /api/admin/assignments

Creates an assignment attached to a sub-lesson.

Request body:

```json
{
  "subLessonId": 1,
  "description": "Write a short essay",
  "durationDays": 3,
  "status": "draft"
}
```

`status` is optional and defaults to `"draft"` when omitted or blank; the
only other allowed value is `"published"`.

Responses:

- `201 Created` with a `Location` header and the created assignment:

  ```json
  {
    "id": 10,
    "subLessonId": 1,
    "description": "Write a short essay",
    "durationDays": 3,
    "status": "draft",
    "createdAt": "2026-09-16T10:00:00Z"
  }
  ```

- `400 Bad Request` when validation fails:

  ```json
  {
    "message": "Validation failed",
    "fieldErrors": { "description": "must not be blank" }
  }
  ```

- `404 Not Found` when `subLessonId` does not reference an existing sub-lesson:

  ```json
  { "message": "Sub-lesson 999 not found" }
  ```

### GET /api/admin/assignments

Returns every assignment with its course/lesson/sub-lesson context, newest
first.

```json
[
  {
    "id": 10,
    "description": "Write a short essay",
    "durationDays": 3,
    "status": "draft",
    "courseName": "Introduction to Web Development",
    "lessonName": "HTML Basics",
    "subLessonName": "Structuring a Page",
    "createdAt": "2026-09-16T10:00:00Z"
  }
]
```
