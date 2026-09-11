# API baseline

The frontend calls relative `/api` URLs. Vite proxies them to
`http://localhost:8080` during development. Production hosting must route
`/api/*` to the backend and serve the frontend build separately.

## GET /api/health

Returns HTTP 200 and `{"status":"UP","application":"CourseFlow"}`.
This is a liveness check, not a database readiness check.

Business endpoints, authentication and the course data model will be added
with their features. No public user or course APIs exist yet.
