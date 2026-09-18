-- Minimal users table linked to Clerk identities. Registration-specific
-- fields (name, date of birth, education background, etc.) are intentionally
-- left out here; add them in a later migration once that flow is built.
CREATE TABLE IF NOT EXISTS courseflow.users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
