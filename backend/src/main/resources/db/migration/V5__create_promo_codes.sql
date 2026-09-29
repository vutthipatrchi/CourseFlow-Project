CREATE TABLE courseflow.promo_codes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL,
    minimum_purchase NUMERIC(12,2) NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('fixed', 'percent')),
    discount_value NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Case-insensitive uniqueness: "NEWYEAR200" and "newyear200" are the same code.
CREATE UNIQUE INDEX idx_promo_codes_code_ci ON courseflow.promo_codes (UPPER(code));

-- No rows here for a given promo code means "All courses".
CREATE TABLE courseflow.promo_code_courses (
    promo_code_id BIGINT NOT NULL REFERENCES courseflow.promo_codes (id) ON DELETE CASCADE,
    course_id BIGINT NOT NULL REFERENCES courseflow.courses (id) ON DELETE CASCADE,
    PRIMARY KEY (promo_code_id, course_id)
);
