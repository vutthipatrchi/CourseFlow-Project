# Course uploads and free enrollment

## Course files

The admin course form uploads selected files before saving the course. The existing
`imageName`, `videoName`, and `resourceName` fields now contain server URLs.
Opening an existing course without selecting replacement files preserves those URLs.
A failed upload keeps the form open and stops course creation/update; retrying reuses
files already uploaded successfully.

| File | Upload endpoint | Allowed types | Maximum size | Read access |
| --- | --- | --- | --- | --- |
| Cover | POST /api/admin/uploads/course-images | JPG, JPEG, PNG | 5 MB | Public |
| Preview | POST /api/admin/uploads/course-previews | MP4, WebM, MOV, M4V | 200 MB | Public |
| Attachment | POST /api/admin/uploads/course-resources | PDF, TXT, CSV, ZIP, DOC(X), XLS(X), PPT(X) | 25 MB | Admin or active course enrollment |

Each upload accepts multipart field `file` and returns `url`, `contentType`,
and `originalName`. Only administrators may upload. Files receive generated names
under `COURSEFLOW_UPLOAD_DIR` (default: `uploads` relative to the backend).
This directory must be retained across restarts/deployments and shared when running
multiple API instances, as with existing lesson video storage.

GET/HEAD of the returned cover and preview URLs work without login; videos support
range requests. Attachments use authenticated requests and are sent as downloads.
The purchased course page provides **Download course materials**. A public catalog
URL does not grant attachment access. Existing protected lesson video endpoints
continue to require their playback tickets.

Old filename-only values cannot be restored automatically: edit the course and
select the original files to upload them. Replaced and unattached files are retained;
automatic removal of orphaned uploads is not included.

## Zero-total checkout

Migration `V20__allow_zero_total_orders.sql` permits zero subtotal/total on orders;
provider payment amounts must still be positive. Existing migrations are unchanged.

POST `/api/orders` calculates the total from server-side prices and promotions.
Discounts are capped at the subtotal. A zero-total quote remains pending until the
student explicitly confirms enrollment. `OrderCreated` includes the order `status`.

POST `/api/orders/{orderId}/complete-free` requires the order owner's JWT. It checks
the stored total is zero and the pending order is unexpired, then marks the order paid
and creates the subscription in one transaction. Repeating the request returns the
same completed order. Reopening checkout also recovers it without duplicate orders
or subscriptions. No provider payment is created, even when payment keys are absent.

The checkout hides payment details for a zero-total order and shows **Enroll for free**.
After confirmation it opens the purchased course. Positive totals retain the normal
card/PromptPay flow. Invalid promotions and expired orders do not grant access.
