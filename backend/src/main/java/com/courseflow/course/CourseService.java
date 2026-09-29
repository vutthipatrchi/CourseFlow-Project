package com.courseflow.course;

import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!standalone")
public class CourseService {
    private final CourseRepository courses;

    public CourseService(CourseRepository courses) {
        this.courses = courses;
    }

    public List<Course> findAll() {
        return courses.findAll();
    }

    public Course findById(long id) {
        return courses.findById(id).orElseThrow(() -> new CourseNotFoundException(id));
    }

    public Course create(CourseRequest request) {
        return courses.create(request);
    }

    public Course update(long id, CourseRequest request) {
        return courses.update(id, request);
    }

    public void delete(long id) {
        courses.delete(id);
    }
}
