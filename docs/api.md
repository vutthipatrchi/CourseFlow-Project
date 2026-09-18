# API baseline

The frontend calls relative `/api` URLs. Vite proxies them to
`http://localhost:8080` during development. Production hosting must route
`/api/*` to the backend and serve the frontend build separately.

## GET /api/health

Returns HTTP 200 and `{"status":"UP","application":"CourseFlow"}`.
This is a liveness check, not a database readiness check.

## Admin courses

These endpoints are available when the backend runs with a database-enabled
profile such as `local`:

- `GET /api/admin/courses` lists courses and their lessons.
- `GET /api/admin/courses/{id}` returns one course.
- `POST /api/admin/courses` creates a course.
- `PUT /api/admin/courses/{id}` replaces the editable course data and lessons.
- `DELETE /api/admin/courses/{id}` deletes a course and its lessons.

Create and update requests contain the editable course fields and a
`lessonItems` array. Price and monetary amounts must be non-negative. A
percentage discount cannot exceed 100. Promo fields are required when
`hasPromo` is true.

The current UI stores uploaded file names in `imageName`, `videoName`, and
`resourceName`; binary file upload/storage is not part of these JSON endpoints.
Authentication and authorization still need to be added before production.
