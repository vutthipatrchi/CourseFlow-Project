-- Registration-specific fields promised in V2's comment: the profile page
-- lets a signed-in user fill these in themselves, so no separate register
-- flow is needed for them.
ALTER TABLE courseflow.users
    ADD COLUMN IF NOT EXISTS name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS date_of_birth DATE,
    ADD COLUMN IF NOT EXISTS educational_background VARCHAR(255);
