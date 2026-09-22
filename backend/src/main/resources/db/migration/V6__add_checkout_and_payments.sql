UPDATE courseflow.courses
SET has_promo = TRUE,
    promo_code = 'COURSE200',
    minimum_purchase = 0,
    discount = 200,
    discount_type = 'fixed',
    updated_at = NOW()
WHERE id = 1 AND has_promo = FALSE;

CREATE TABLE courseflow.orders (
    id UUID PRIMARY KEY,
    reference VARCHAR(24) NOT NULL UNIQUE,
    course_id BIGINT NOT NULL REFERENCES courseflow.courses(id),
    access_token_hash CHAR(64) NOT NULL,
    subtotal_satang BIGINT NOT NULL CHECK (subtotal_satang > 0),
    discount_satang BIGINT NOT NULL DEFAULT 0 CHECK (discount_satang >= 0),
    total_satang BIGINT NOT NULL CHECK (total_satang > 0),
    currency CHAR(3) NOT NULL DEFAULT 'thb',
    status VARCHAR(24) NOT NULL CHECK (status IN ('pending_payment', 'paid', 'expired', 'cancelled', 'payment_review')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE courseflow.payments (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES courseflow.orders(id),
    provider VARCHAR(24) NOT NULL DEFAULT 'omise',
    provider_charge_id VARCHAR(80) UNIQUE,
    idempotency_key UUID NOT NULL,
    method VARCHAR(24) NOT NULL CHECK (method IN ('card', 'promptpay')),
    amount_satang BIGINT NOT NULL CHECK (amount_satang > 0),
    currency CHAR(3) NOT NULL,
    status VARCHAR(24) NOT NULL CHECK (status IN ('creating', 'pending', 'successful', 'failed', 'expired', 'review')),
    qr_image_url TEXT,
    failure_message TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (order_id, idempotency_key)
);

CREATE INDEX payments_order_id_idx ON courseflow.payments(order_id);

CREATE TABLE courseflow.subscriptions (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL UNIQUE REFERENCES courseflow.orders(id),
    course_id BIGINT NOT NULL REFERENCES courseflow.courses(id),
    status VARCHAR(16) NOT NULL CHECK (status IN ('active', 'cancelled')),
    activated_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE courseflow.webhook_events (
    event_id VARCHAR(80) PRIMARY KEY,
    event_key VARCHAR(80) NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);
