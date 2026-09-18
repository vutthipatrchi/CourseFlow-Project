-- CourseRepository.replaceLessons deletes and re-inserts lessons on every course save,
-- so this cascade removes a course's sub-lessons and assignments whenever it is edited.
CREATE TABLE courseflow.sub_lessons (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lesson_id BIGINT NOT NULL REFERENCES courseflow.course_lessons (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (lesson_id, position)
);

CREATE TABLE courseflow.assignments (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sub_lesson_id BIGINT NOT NULL REFERENCES courseflow.sub_lessons (id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_sub_lesson_id ON courseflow.assignments (sub_lesson_id);
