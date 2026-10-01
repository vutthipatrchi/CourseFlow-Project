# Subscribe, Catalog and Payment config baseline

Test date: 2026-10-01 (user timezone: Asia/Bangkok).

## Live backend reads

Target: https://courseflow-project-backend.vercel.app

Five sequential GETs per public endpoint from the development machine, consuming
the response body. Catalog was tested before config. No authentication was used;
no orders, tokens or charges were created. Raw results are in
[subscribe-performance-live.json](./subscribe-performance-live.json).

| Endpoint | Sample 1 | Sample 2 | Sample 3 | Sample 4 | Sample 5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| GET /api/catalog/courses | 14073 ms | 183 ms | 164 ms | 162 ms | 132 ms |
| GET /api/payments/config | 137 ms | 134 ms | 130 ms | 126 ms | 121 ms |

All ten reads returned HTTP 200. Catalog returned 10 courses (1,907 bytes), and
payment config reported enabled. Responses carried Cache-Control:
no-cache, no-store, max-age=0, must-revalidate and x-vercel-cache: MISS.
The unauthenticated GET /api/me/subscriptions returned 401 in 147 ms.

Catalog's first sample spent 14,054 ms waiting for response headers, with the
body fully consumed at 14,073 ms. Subsequent catalog reads took 132?183 ms.
This reproduces the first-request symptom but does not isolate its cause:
connection setup, hosting/application startup, connection-pool/database wakeup,
and SQL all remain possible contributors. No correlated backend logs were
available, and this was not a controlled cold-start experiment. Config was
measured after catalog, so its 121?137 ms results do not establish cold latency.
Five samples are a spot check, not a load test or percentile estimate.

## Frontend integration characterization

The new subscribePerformance.spec.ts mounts the real SubscribeCard, and in one
scenario the real CourseDetailView with its real SubscribeCard. API helpers and
Axios interceptors are real. Only Clerk token lookup, transport responses and
time are simulated. Layout components are stubbed. This is a component test,
not a signed-in production browser test. The numbers below are simulated time.

| Scenario | Observed result |
| --- | --- |
| Catalog 15 s, subscriptions 0.5 s | Subscribe enables at 15 s; 2 requests; no timeout |
| Full detail page: detail 0.2 s, access reads 0.5 s | Ready at 0.7 s; 6 requests: detail 1, demo 1, catalog list 2, subscriptions 2 |
| Three legacy subscriptions missing progress; subscriptions 15 s, progress stalls | Subscribe waits 45 s; 5 requests: catalog 1, subscriptions 1, progress 3; each progress request times out after its own 30 s deadline |
| Subscriptions already include progress | 2 requests, no extra progress reads |
| Catalog stalls beyond 30 s | Subscribe disabled with retry; no automatic retry |
| Three concurrent catalog calls plus one later repeat | 4 HTTP requests and 4 token lookups; no cache or request sharing |
| Three concurrent config calls plus one later repeat | 4 HTTP requests and 4 token lookups; no cache or request sharing |
| Clerk token lookup never resolves | Public catalog/config fail at 10 s before any transport request |
| Guest: catalog succeeds, subscriptions returns 401 | Subscribe remains disabled and displays a generic price-load error; this is an auth-flow issue, not timeout |

The backend in this checkout already computes progress in findSubscriptions.
Extra progress reads apply to missing/legacy response fields, not every current
response. The duplicate catalog/subscription reads are from the parent page and
card each calling getCourseAccess. Payment config currently has one production
caller (checkout initialization); repeated-call tests establish missing cache,
not that a single checkout necessarily sends four config requests.

## Recommended next changes, in order

1. Share the access result between CourseDetailView and SubscribeCard. With the
   same scenario this should remove two of the six API calls. Use the already
   loaded course for its ID/price, avoiding another full catalog fetch where
   possible. Enrollment failures must not be treated as an unpurchased course.
2. Use a lightweight enrollment lookup for access checks, without waiting on
   learning progress. Keep progress hydration on views that display it.
3. Add in-flight sharing and a short-lived cache for public catalog/config reads.
   Never cache charge writes or private enrollment across users. The backend
   must continue calculating the authoritative checkout price/promotion.
4. Remove the dependency on session-token lookup for endpoints explicitly public,
   and handle the signed-out Subscribe path explicitly.
5. Correlate a slow first catalog request with backend timing/startup logs before
   changing SQL, pool or hosting settings. Frontend caching helps repeat loads
   but does not solve the first request's underlying 14 second delay.

## Verification and scope

Command (from frontend):

    npm.cmd run test:unit -- src/__tests__/subscribePerformance.spec.ts src/__tests__/SubscribeCard.spec.ts src/__tests__/courseAccess.spec.ts src/__tests__/catalogCourses.spec.ts src/__tests__/paymentsSubscriptions.spec.ts

Result: 5 files, 18 tests passed (9 new characterization scenarios).

The baseline task added tests and measurement artifacts only. Production application logic
and deployed settings were not changed. Authenticated production subscription
latency, browser rendering time, cold config latency and concurrent-load behavior
were not measured.

## Implemented improvements (local source, pending deployment)

1. CourseDetailView loads the course once, checks access once, and passes the
   course/access/loading/error state to SubscribeCard. The card performs no
   network reads. Retrying access retries only the enrollment read. Course IDs
   identify enrollment even if a purchased course has been renamed.
2. GET /api/me/enrollments returns only courseId and courseTitle for the JWT
   subject's active subscriptions, with Cache-Control: no-store. Its SQL joins
   subscriptions to orders and does not join lessons or progress tables.
   getCourseAccess uses this endpoint; My Courses retains getSubscriptions and
   its progress hydration. Private enrollment is never cached in the browser.
3. Public catalog-list and payment-config reads share in-flight requests and
   cache successful results in memory for 60 seconds from completion. Errors
   are evicted. Each reader receives a copy, so caller mutation cannot corrupt
   the cached value. Successful admin course/lesson writes invalidate the cache,
   including reads already in flight. Writes, orders and payment status are not
   cached. Course detail still loads its individual endpoint directly.

### Before / after in the component regression suite

| Scenario | Baseline | After |
| --- | --- | --- |
| Detail page plus Subscribe | 6 requests | 3 requests: course detail, demo content, enrollments |
| Access request with three legacy enrollments and stalled progress | 5 requests, 45 simulated seconds on the standalone card | No progress reads; 3 total page requests and approximately 15 simulated seconds with a 15 second enrollment response |
| Three concurrent public reads plus a repeat within TTL | 4 requests | 1 request |
| First read after TTL expires | New request | New request; concurrent callers share it |

These are controlled frontend scenarios, not post-deployment latency claims.
The first production catalog response previously measured at 14.073 seconds
still requires startup/database timing investigation; browser caching does not
speed up an uncached first request. The public API token dependency and signed-out
Subscribe behavior identified above were outside requested steps 1?3 and remain.

### Deployment and price correctness

Deploy the backend enrollment endpoint before or together with the frontend.
There is no fallback to the older progress-heavy endpoint if enrollments is
missing. No database migration is needed. Another administrator's edits may
remain visible in a different browser's cache for up to 60 seconds. Checkout
continues to POST /orders and use its authoritative price/promotion response;
public cached catalog prices are display data only. Payment idempotency and
recovery code were not changed by this optimization.

### Verification after implementation

- Frontend production build and TypeScript check passed.
- Oxlint and ESLint passed for the eight frontend files changed in this step.
- Full frontend suite: 156 passed, 2 failed (158 total). The two existing failures
  in unchanged CourseDetailView.spec.ts still expect obsolete fixture titles:
  Development Tools and Design Foundations. The Subscribe, performance, checkout,
  subscription-progress and timeout tests passed.
- PaymentControllerTests and PaymentServiceTests: 23 passed, zero failures/skips,
  including JWT ownership/no-store enrollment response, invalid identity rejection,
  server-authoritative checkout amount, idempotency and lost-response recovery.
- New enrollment SQL was compiled and reviewed against the existing schema;
  it was not benchmarked against a live database. Production timings above are
  the pre-change baseline; no production deployment or real charge was performed.
- git diff --check passed.
