CREATE TABLE courseflow.courses (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    learning_time INTEGER CHECK (learning_time IS NULL OR learning_time > 0),
    category VARCHAR(120),
    has_promo BOOLEAN NOT NULL DEFAULT FALSE,
    promo_code VARCHAR(120),
    minimum_purchase NUMERIC(12, 2) CHECK (minimum_purchase IS NULL OR minimum_purchase >= 0),
    discount NUMERIC(12, 2) CHECK (discount IS NULL OR discount >= 0),
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    summary TEXT,
    description TEXT,
    image_name VARCHAR(255),
    video_name VARCHAR(255),
    resource_name VARCHAR(255),
    accent VARCHAR(20) NOT NULL DEFAULT '#dce8fb',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT courses_percentage_discount_check
        CHECK (discount_type <> 'percentage' OR discount <= 100),
    CONSTRAINT courses_promo_fields_check
        CHECK (
            has_promo = FALSE
            OR (promo_code IS NOT NULL AND minimum_purchase IS NOT NULL AND discount IS NOT NULL AND discount_type IS NOT NULL)
        )
);

CREATE TABLE courseflow.course_lessons (
    id BIGSERIAL PRIMARY KEY,
    course_id BIGINT NOT NULL REFERENCES courseflow.courses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL CHECK (position > 0),
    sub_lessons INTEGER NOT NULL DEFAULT 0 CHECK (sub_lessons >= 0),
    UNIQUE (course_id, position)
);

CREATE INDEX course_lessons_course_id_idx ON courseflow.course_lessons(course_id);

INSERT INTO courseflow.courses (name, price, accent, created_at, updated_at)
VALUES
    ('Service Design Essentials', 3559, '#dce8fb', '2022-02-12 22:30:00+07', '2022-02-12 22:30:00+07'),
    ('Design Thinking Fundamentals', 2990, '#fce4cf', '2022-03-18 09:15:00+07', '2022-03-22 14:45:00+07'),
    ('UX Research Methods', 3190, '#d9f0e3', '2022-05-07 13:20:00+07', '2022-05-10 11:00:00+07'),
    ('Product Strategy', 3990, '#ede0f3', '2022-06-21 15:30:00+07', '2022-06-25 10:10:00+07'),
    ('Digital Marketing Basics', 2550, '#fff0bd', '2022-07-04 08:45:00+07', '2022-07-11 16:00:00+07'),
    ('Data Analytics Foundations', 4590, '#d9ebef', '2022-08-16 12:00:00+07', '2022-08-20 17:15:00+07'),
    ('Leadership Essentials', 2790, '#fde1e1', '2022-09-02 10:30:00+07', '2022-09-08 13:25:00+07'),
    ('Agile Project Management', 3590, '#e2e4fa', '2022-10-14 09:00:00+07', '2022-10-18 15:40:00+07');

INSERT INTO courseflow.course_lessons (course_id, name, position, sub_lessons)
SELECT course.id, 'Lesson ' || lesson.position, lesson.position, 1
FROM courseflow.courses course
CROSS JOIN LATERAL generate_series(
    1,
    CASE course.name
        WHEN 'Service Design Essentials' THEN 6
        WHEN 'Design Thinking Fundamentals' THEN 8
        WHEN 'UX Research Methods' THEN 7
        WHEN 'Product Strategy' THEN 9
        WHEN 'Digital Marketing Basics' THEN 6
        WHEN 'Data Analytics Foundations' THEN 10
        WHEN 'Leadership Essentials' THEN 5
        ELSE 8
    END
) AS lesson(position);
