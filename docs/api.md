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

## Admin assignments

These endpoints require the `local` (or another database-backed) profile —
they are unavailable when running with the default `standalone` profile.
All of them require a valid Clerk-issued bearer token (any signed-in user;
the backend has no admin-role check yet).

### GET /api/admin/sub-lessons

Returns every sub-lesson with its lesson and course context, for populating
the "create assignment" form's sub-lesson picker.

```json
[
  {
    "subLessonId": 1,
    "subLessonName": "Sub-lesson 1",
    "lessonName": "Lesson 1",
    "courseName": "Service Design Essentials"
  }
]
```

### POST /api/admin/assignments

Creates an assignment attached to a sub-lesson.

Request body:

```json
{
  "subLessonId": 1,
  "description": "Write a short essay"
}
```

Responses:

- `201 Created` with a `Location` header and the created assignment:

  ```json
  {
    "id": 10,
    "subLessonId": 1,
    "description": "Write a short essay",
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
    "courseName": "Service Design Essentials",
    "lessonName": "Lesson 1",
    "subLessonName": "Sub-lesson 1",
    "createdAt": "2026-09-16T10:00:00Z"
  }
]
```

### GET /api/admin/assignments/{id}

Returns one assignment. Response body is the same shape as the `POST`
response above. `404 Not Found` (`{ "message": "Assignment 999 not found" }`)
when `id` does not exist.

### PUT /api/admin/assignments/{id}

Updates an assignment's sub-lesson and description. Same request body and
validation as `POST`, same success response shape. `404 Not Found` when
either `id` or the request's `subLessonId` does not exist.

### DELETE /api/admin/assignments/{id}

Deletes an assignment. `204 No Content` on success, `404 Not Found` when
`id` does not exist.

## Admin promo codes

Same auth requirement as admin assignments (a valid Clerk bearer token;
no admin-role check yet) and same profile restriction (`local` or another
database-backed profile).

`courseIds` is a list of course ids the promo applies to; an **empty
list means "all courses"**.

### GET /api/admin/promo-codes

Returns every promo code, newest first.

```json
[
  {
    "id": 1,
    "code": "NEWYEAR200",
    "minimumPurchase": 500,
    "discountType": "fixed",
    "discountValue": 200,
    "courseIds": [],
    "createdAt": "2026-09-16T10:00:00Z",
    "updatedAt": "2026-09-16T10:00:00Z"
  }
]
```

### GET /api/admin/promo-codes/{id}

Returns one promo code, same shape as above. `404 Not Found` when `id`
does not exist.

### POST /api/admin/promo-codes

Creates a promo code.

Request body:

```json
{
  "code": "NEWYEAR200",
  "minimumPurchase": 500,
  "discountType": "fixed",
  "discountValue": 200,
  "courseIds": []
}
```

- `code`: letters and numbers only, required.
- `discountType`: `"fixed"` or `"percent"`.
- `discountValue`: must be greater than 0; a `"percent"` value cannot
  exceed 100; a `"fixed"` value cannot exceed `minimumPurchase`.
- `courseIds`: omit or send `[]` for "all courses".

Responses:

- `201 Created` with a `Location` header and the created promo code.
- `400 Bad Request` for validation failures or a duplicate code
  (case-insensitive), both shaped like:

  ```json
  { "message": "Promo code \"NEWYEAR200\" already exists", "fieldErrors": { "code": "..." } }
  ```

### PUT /api/admin/promo-codes/{id}

Updates a promo code. Same request body and validation as `POST`, same
success response shape. `404 Not Found` when `id` does not exist.

### DELETE /api/admin/promo-codes/{id}

Deletes a promo code. `204 No Content` on success, `404 Not Found` when
`id` does not exist.

## Payment checkout

Payment endpoints are enabled when the backend runs with a database profile.
All monetary values are integer satang and the backend calculates the final
amount from its own course and promotion records.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/payments/config` | Return provider availability and the publishable key used for browser tokenization. |
| `POST` | `/api/orders` | Return a server-priced checkout for the signed-in buyer, reusing an open order when possible. |
| `POST` | `/api/orders/{orderId}/payments/card` | Charge a provider card token. |
| `POST` | `/api/orders/{orderId}/payments/promptpay` | Create a provider PromptPay charge and QR image. |
| `GET` | `/api/payments/{paymentId}` | Refresh a charge from the provider and return its verified status. |
| `GET` | `/api/payments/{paymentId}/qr` | Download the provider QR image through the authenticated proxy. |
| `GET` | `/api/me/subscriptions` | List paid course subscriptions owned by the signed-in buyer. |
| `POST` | `/api/webhooks/opn` | Receive an Opn event and reconcile it after retrieving the charge from Opn. |

Send the Clerk bearer token on order, payment, status, QR, and subscription
requests. Send a UUID as `Idempotency-Key` on both payment-creation endpoints.
Card requests contain only `{ "cardToken": "tokn_test_..." }`; raw card numbers
and security codes must never reach this API.

The backend binds orders and subscriptions to the Clerk JWT subject. It trusts
only its own course and promotion records for the amount, verifies provider
amount/currency/metadata before activating access, and never resubmits a charge
whose provider outcome is unknown. Webhooks and the scheduled reconciliation
job recover those attempts safely.
