CREATE TABLE courseflow.wishlist_items (
    customer_subject TEXT NOT NULL CHECK (length(customer_subject) > 0),
    course_id BIGINT NOT NULL REFERENCES courseflow.courses(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (customer_subject, course_id)
);
CREATE INDEX wishlist_items_course_id_idx ON courseflow.wishlist_items(course_id);
