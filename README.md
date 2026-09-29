# CourseFlow

Vue 3 + TypeScript frontend and Java 21 + Spring Boot backend in one repository.

## Requirements

- Node.js 22.18+ on the 22.x line (use `.nvmrc`) and npm.
- JDK 21 with `JAVA_HOME` set and Java on `PATH`.
- Docker Compose, only when using the local PostgreSQL profile.
- Maven is downloaded by the committed Maven Wrapper.

## Run locally

Open two terminals from the repository root.

Frontend:

```powershell
cd frontend
npm ci
npm run dev
```

Backend (PowerShell):

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

On macOS/Linux use `sh ./mvnw spring-boot:run` in `backend/`.
Open http://localhost:5173. The frontend sends `/api/*` through the Vite proxy
to http://localhost:8080. The default `standalone` profile runs without a
database and exposes only the health endpoint. Start the `local` profile to
enable the PostgreSQL-backed admin course and payment APIs. Clerk handles
sign-up and sign-in in the frontend, while Spring Security validates Clerk JWTs
for protected admin endpoints.

Create `frontend/.env.local` and add the Clerk publishable key:

```properties
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_key
```

Copy `backend/.env.properties.example` to `backend/.env.properties` and set the
Clerk JWKS URL plus database values. Both local environment files are ignored
by Git. Admin course routes require a signed-in Clerk session, and frontend API
requests send the Clerk bearer token to Spring Boot.

## Local PostgreSQL and migrations

From the repository root:

```powershell
Copy-Item .env.example .env
docker compose up -d --wait db
cd backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local"
```

Flyway runs all migrations in `backend/src/main/resources/db/migration/`,
including the course and lesson tables plus local seed data.
Add each schema change as a new migration; do not edit migrations already applied.
Docker keeps data in the `postgres_data` volume. `docker compose down` stops
services and retains that data.

The `local` profile also loads `backend/src/main/resources/db/seed/`, which
seeds demo course/lesson/sub-lesson data used by the admin assignments create
form's sub-lesson dropdown. The default `standalone` profile has no database
and no course data, so that dropdown is empty until you run with `local`.

The root `.env` is read by Docker Compose, not Spring Boot. If you change the
database name, port or credentials, also set `DB_URL`, `DB_USERNAME`, and
`DB_PASSWORD` in the backend terminal. `SERVER_PORT` defaults to 8080; update
the Vite proxy if you change it. Never place secrets in frontend code or `VITE_*`
variables, because those are visible to browser users.

### Using Supabase instead of local Postgres

To point the `local` profile at a hosted Supabase database instead of the
Docker container, copy `backend/.env.properties.example` to
`backend/.env.properties` (gitignored) and fill in the connection string from
Supabase → Project Settings → Database → Connection string. Spring Boot loads
this file automatically via `spring.config.import` if it exists, so no shell
env vars are needed.

## Payment setup (Opn Payments / Omise)

The checkout supports card tokenization and PromptPay QR payments. Add the
following values to `backend/.env.properties`:

```properties
OMISE_PUBLIC_KEY=pkey_test_...
OMISE_SECRET_KEY=skey_test_...
CHECKOUT_BASE_URL=http://localhost:5173
```

Use a matching test-key pair while developing; test mode does not move real
money. `CHECKOUT_BASE_URL` is the frontend origin that Opn returns to after
3-D Secure authentication. Set it to the production HTTPS origin when
deploying.

Configure the Opn webhook endpoint as
`https://your-api-host.example/api/webhooks/opn`. The webhook handler does not
trust the posted status: it retrieves the charge from Opn with the secret key,
checks amount and currency, deduplicates event IDs, and only then activates the
subscription. Keep `OMISE_SECRET_KEY` on the backend only.

Checkout, payment status, QR image, and subscription requests require the
signed-in user's Clerk bearer token. The backend owns the course price and
promotion calculation, binds each order to the Clerk user ID, and reuses an
open order to prevent duplicate charges. Payment creation also requires a UUID
`Idempotency-Key`. Unknown provider outcomes enter review and are reconciled by
the webhook and scheduled recovery job instead of being submitted again.

Card details are tokenized directly by Opn in the browser and card charges
request 3-D Secure authentication. PromptPay QR images are proxied by the
backend so the Save QR image action can download the provider-generated PNG
without exposing provider credentials.

## Checks

```powershell
cd frontend
npm run lint
npm run format:check
npm run test:unit
npm run build
cd ../backend
.\mvnw.cmd verify
```

`npm run build` includes TypeScript checking. Use `npm run format` to format
frontend source and `npm run test:watch` for interactive tests.
With PostgreSQL running, verify database startup and migrations using
`.\mvnw.cmd test "-Dspring.profiles.active=local"`.

CI runs these checks on pull requests to `main` and pushes to `main` using
Node 22 and Java 21; its database check uses a PostgreSQL service.

## Layout and collaboration

- `frontend/`: Vue, Router, Pinia, Vite, Vitest, ESLint and Prettier.
- `backend/`: Spring MVC, validation, JDBC, PostgreSQL and Flyway.
- `docs/api.md`: initial API contract and production routing requirements.
- `docs/branch-protection.md`: GitHub settings for protected `main`.

Create short-lived `feat/...`, `fix/...`, or `chore/...` branches from `main`.
Use descriptive commits such as `feat: add course list` and merge through a
reviewed PR with passing CI. Prefer squash merging. Keep `main` buildable.

Before production deployment, configure the database profile and secrets,
route `/api/*` to the Java service, and serve `frontend/dist` with SPA fallback.
The `local` profile and example passwords are for local development only.
