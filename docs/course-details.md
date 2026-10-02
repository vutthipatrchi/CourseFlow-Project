# Course details

Course summaries and full descriptions live in `courseflow.courses`. The public catalog endpoints, `GET /api/catalog/courses` and `GET /api/catalog/courses/{courseId}`, return these fields; the frontend displays the API values without a separate catalog copy.

Flyway migration `V19__add_catalog_course_details.sql` fills missing summaries and descriptions for the ten seeded courses. Existing nonblank admin copy is retained, and courses outside the seeded catalog are untouched. Start the backend with the `local` profile to apply pending migrations to its configured database:

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

## PostgreSQL integration test

`CatalogCourseDetailsMigrationTests` is an opt-in test. Point it at a new, empty disposable PostgreSQL database, never a development or production database containing user data. The test first runs migrations through V18, sets up admin-edited and custom course examples, and then applies V19 through Flyway.

From `backend/`, run the following command with the connection values for that test database:

```powershell
.\mvnw.cmd test "-Dtest=CatalogCourseDetailsMigrationTests" "-Dcourseflow.test.catalog-migrations=true" "-Dspring.datasource.url=jdbc:postgresql://127.0.0.1:5432/courseflow_catalog_test" "-Dspring.datasource.username=courseflow" "-Dspring.datasource.password=courseflow_local"
```

The test loads `application-local.properties` directly and does not import `backend/.env.properties`. It verifies public catalog responses against database values for all ten courses, preservation of admin edits, handling of null/empty/whitespace fields, and that rerunning the backfill leaves complete rows unchanged. Each test method rolls back its row changes; the initial migrations and upgrade setup remain in the disposable database. Use a fresh test database for each run.
