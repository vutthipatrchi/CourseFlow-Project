-- Existing anonymous orders stay unclaimed; ownership must never be guessed.
ALTER TABLE courseflow.orders ADD COLUMN customer_subject VARCHAR(255);
ALTER TABLE courseflow.orders ADD COLUMN promotion_code VARCHAR(30);
ALTER TABLE courseflow.orders ADD COLUMN course_title TEXT;
UPDATE courseflow.orders o SET course_title = c.name FROM courseflow.courses c WHERE c.id = o.course_id;
ALTER TABLE courseflow.orders ALTER COLUMN course_title SET NOT NULL;
ALTER TABLE courseflow.orders ALTER COLUMN access_token_hash DROP NOT NULL;

CREATE UNIQUE INDEX orders_customer_course_open_idx
    ON courseflow.orders(customer_subject, course_id)
    WHERE customer_subject IS NOT NULL AND status IN ('pending_payment', 'payment_review', 'paid');

ALTER TABLE courseflow.payments ADD COLUMN authorize_url TEXT;
ALTER TABLE courseflow.payments ADD COLUMN last_checked_at TIMESTAMPTZ;
CREATE INDEX payments_reconciliation_idx ON courseflow.payments(last_checked_at NULLS FIRST)
    WHERE status IN ('creating', 'pending', 'review');

-- Keep migration metadata compatible with existing databases while preventing
-- public-schema APIs from exposing it.
REVOKE ALL ON TABLE public.flyway_schema_history FROM PUBLIC;
