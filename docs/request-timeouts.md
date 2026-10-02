# Backend request timeout audit

The browser now uses `frontend/src/api/client.ts` for every application API
request. Policy constants live in `frontend/src/api/requestPolicy.ts`.

| Operation | Browser deadline | Coverage |
| --- | --- | --- |
| Normal API request | 30 seconds | Catalog/detail, admin courses/lessons/assignments/promo codes, profile, subscriptions, progress, demo content, submissions, checkout/payment status, QR download and video access grants |
| Session token lookup | 10 seconds, within the request deadline | Clerk token lookup before sending an API request |
| Video upload | 5 minutes | Multipart upload to `/api/admin/uploads/videos`; token lookup still has its own 10 second limit |
| Card tokenization | 30 seconds | Existing direct Omise browser SDK call, outside the application API client |

Previously the Axios client used 10 seconds while profile, lessons, the legacy
course store, uploads and video grants used `fetch` with no application timeout.
The normal deadline now allows the observed 14–15 second first response. This
is a waiting budget, not an improvement to backend execution speed.

An AbortController deadline covers token lookup and the transport. Axios' own
transport timeout is also set. Timers and caller abort listeners are removed on
success, failure and cancellation. A token returned after timeout never sends
the request. Callers can pass an AbortSignal to cancel earlier.

Read timeouts show a retry message. Write timeouts explain that the operation
may still be processing. There is no automatic retry in the client, including
payment creation, submissions and uploads. Existing payment status polling
continues to read status after 5 seconds (15 seconds for `review`); it does not
recreate a charge. The existing payment recovery/idempotency flow is retained.
Profile load failures are displayed with a retry button, and saving is disabled
until the existing profile has loaded successfully.

## Backend and platform boundaries

| Boundary | Current implementation | Interpretation |
| --- | --- | --- |
| Hikari connection pool | No explicit timeout override in tracked application properties | Framework/pool defaults or deployment overrides apply. Waiting for a connection is part of the catalog `jdbc.query` timing. |
| PostgreSQL statement execution | No explicit `spring.jdbc.template.query-timeout` in tracked properties | There is no application-defined SQL time limit here. Database/session settings can still impose one. |
| PostgreSQL connection/read | No driver timeout override in tracked properties | The driver documents a default 10 second connect timeout and a disabled socket-read timeout; the deployment's JDBC URL can override these. |
| Clerk JWT key retrieval | Spring Resource Server uses the configured JWKS URL | Its HTTP client/framework settings are separate from browser token lookup. |
| Omise API requests | `co.omise.Client` uses SDK defaults | The separate Java HttpClient timeout used for QR images does not configure charge creation/retrieval. |
| QR image download | Java HttpClient: 10 second connect, 15 seconds per request, up to 3 redirects | This is not a single 15 second budget across the whole redirect chain. |
| Vite proxy | No explicit proxy timeout in `vite.config.ts` | The browser deadline still applies in local development. |
| Production hosting/proxy | Not verifiable from local source | A hosting timeout can return 502/503/504 before the browser deadline. Increasing the browser budget cannot extend that limit. |

Backend/database timeout values were audited, not retuned globally. An aborted
browser request does not guarantee cancellation of server work or rollback of a
write. Before choosing database limits, collect the existing catalog timing
logs and distinguish connection acquisition from SQL execution. Do not treat
controller timing as total HTTP time: it excludes request filters, serialization,
network transfer and platform startup.

Native `<video>` streaming and Clerk's own sign-in/profile-image SDK operations
are separate from application API calls. Media uses browser loading/error events;
the API deadline applies to the playback authorization request, not video duration.
Several views make sequential API calls, so their total page loading time can
exceed one request's 30 second budget.

## Verification

The timeout regression suite covers a 15 second successful read, a stalled
profile load, token lookup that never resolves, late token resolution, combined
auth/transport time, caller cancellation, no duplicate payment write, uploads
lasting beyond 30 seconds, and retained backend validation errors.

For a production investigation, deploy these changes first. Capture a slow
catalog request's client duration and the four logs sharing its `requestId`:
`controller`, `service`, `repository`, and `jdbc.query`. Each duration includes
its nested calls, so do not add the four durations together. Enable the logger
as described in the root README.

References: [Axios cancellation](https://axios-http.com/docs/cancellation),
[Spring JDBC settings](https://docs.spring.io/spring-boot/reference/data/sql.html),
[PostgreSQL driver timeouts](https://jdbc.postgresql.org/documentation/use/).

## Subscribe to payment audit

These are per-request budgets, not an end-to-end checkout deadline. The
following excludes routing, rendering and bank/3-D Secure interaction time.

| Stage | Requests and remaining risk |
| --- | --- |
| Subscribe card | The parent loads course detail, then checks `/me/enrollments` once and shares the result with the card. Progress is not loaded for access checks. Detail and access have separate 30 second deadlines; access failure blocks checkout with retry. |
| Protected page navigation | Token lookup now has the same 10 second bound. Failure redirects to sign-in with the complete destination, including paymentId, preserved. |
| Checkout initialization | Config then order creation are sequential, each with a 30 second deadline: roughly 60 seconds total. Reload checkout is available on initial failure; payment and promotion controls remain disabled until ready. |
| Card confirmation | Browser tokenization allows 30 seconds, followed by a separate 30 second charge request. Bank authentication has its own external lifecycle. |
| PromptPay confirmation | The charge request has a 30 second browser deadline. Backend source creation then charge creation are sequential SDK calls with no explicitly configured overall application budget. |
| QR display | Status lookup then image download can consume two 30 second request budgets. Backend redirects each receive a fresh 15 second image-request timeout. A download failure can now be retried using the same paymentId, without creating a charge. |
| Status confirmation | Polling waits for each response before scheduling the next read (5 seconds, or 15 for review). Transient timeouts keep polling; total confirmation time is not capped. |

Checkout now ignores configuration/order/charge responses after unmount, and
never starts a charge if card tokenization completes after leaving the page.
A charge already sent can still complete on the server; leaving the page does
not cancel the payment. Reopening checkout recovers the persisted order/payment.
Payment POSTs are not automatically retried. A lost charge response puts checkout
in recovery mode; a second timeout during recovery keeps that mode enabled.

The backend reserves the payment before contacting the provider, checks an
idempotency key and existing active payments, and uses review/reconciliation for
unknown outcomes. These safeguards reduce duplicate charge risk; they do not
make provider calls faster. Order creation uses a database advisory lock and
row locks without an explicit application lock timeout. Status lookup may also
wait on provider retrieval. Deployment limits and real provider latency still
need measurement before setting backend budgets.

Validation uses mocked payments, including late token/charge responses, repeated
timeouts during recovery, QR retry and status polling recovery. No real charge
was submitted. These source changes are local until deployed.

### Public read caching

Catalog-list and payment-config reads now use a 60 second in-memory cache and
share in-flight requests. The existing token/transport deadlines apply to cache
misses; failures are not cached. Enrollment, order creation and payment status
are never served from this cache. See [the performance report](./subscribe-performance.md)
for before/after request counts and the new backend deployment dependency.
