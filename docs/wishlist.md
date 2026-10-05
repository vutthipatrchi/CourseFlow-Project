# Wishlist

Wishlist entries are persisted in PostgreSQL by verified Clerk JWT subject. They do not require a local profile row, and the API never accepts a user ID from the client.

- `GET /api/me/wishlist`: the signed-in user's courses, newest first, with `Cache-Control: no-store`.
- `PUT /api/me/wishlist/{courseId}`: save a course; repeated saves are idempotent. Returns 204, or 404 if the course does not exist.
- `DELETE /api/me/wishlist/{courseId}`: remove only the caller's entry; repeated deletes return 204.

All endpoints require authentication (401 for anonymous requests). Course deletion cascades to wishlist entries. The UI reloads saved state from the API, clears it immediately on account changes, and reports success only after persistence completes.

Start the database-backed backend with the `local` profile to apply Flyway migration `V21__create_wishlist_items.sql`:

```powershell
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

The default standalone profile has no database. For PostgreSQL integration tests, explicitly supply a disposable database (the test excludes the app's secrets file):

```powershell
.\mvnw.cmd test "-Dtest=WishlistRepositoryTests" "-Dcourseflow.test.wishlist=true" "-Dspring.datasource.url=jdbc:postgresql://127.0.0.1:5432/wishlist_test" "-Dspring.datasource.username=courseflow" "-Dspring.datasource.password=courseflow_local"
```
