CREATE TABLE courseflow.subscription_lesson_progress (
    subscription_id UUID NOT NULL REFERENCES courseflow.subscriptions(id) ON DELETE CASCADE,
    sub_lesson_id BIGINT NOT NULL REFERENCES courseflow.sub_lessons(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (subscription_id, sub_lesson_id)
);

CREATE INDEX subscription_lesson_progress_sub_lesson_idx
    ON courseflow.subscription_lesson_progress(sub_lesson_id);
