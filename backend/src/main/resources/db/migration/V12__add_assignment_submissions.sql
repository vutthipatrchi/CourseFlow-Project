-- Optional suggested number of days to finish the assignment. It is only a hint: courses are
-- self-paced, so nothing is enforced and an assignment never becomes overdue.
ALTER TABLE courseflow.assignments
    ADD COLUMN duration_days INT CHECK (duration_days IS NULL OR duration_days > 0);

-- student_subject is the Clerk JWT subject, matching courseflow.orders.customer_subject's
-- convention of identifying a student without a courseflow.users join.
CREATE TABLE courseflow.assignment_submissions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    assignment_id BIGINT NOT NULL REFERENCES courseflow.assignments (id) ON DELETE CASCADE,
    student_subject VARCHAR(255) NOT NULL,
    answer TEXT NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (assignment_id, student_subject)
);

CREATE INDEX idx_assignment_submissions_student ON courseflow.assignment_submissions (student_subject);
