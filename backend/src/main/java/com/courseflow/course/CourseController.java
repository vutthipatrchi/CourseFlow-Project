package com.courseflow.course;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/courses")
@Profile("!standalone")
public class CourseController {
    private final CourseRepository courses;

    public CourseController(CourseRepository courses) {
        this.courses = courses;
    }

    @GetMapping
    public List<Course> list() {
        return courses.findAll();
    }

    @GetMapping("/{id}")
    public Course get(@PathVariable long id) {
        return courses.findById(id).orElseThrow(() -> new CourseNotFoundException(id));
    }

    @PostMapping
    public ResponseEntity<Course> create(@Valid @RequestBody CourseRequest request) {
        var course = courses.create(request);
        return ResponseEntity.created(URI.create("/api/admin/courses/" + course.id())).body(course);
    }

    @PutMapping("/{id}")
    public Course update(@PathVariable long id, @Valid @RequestBody CourseRequest request) {
        return courses.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        courses.delete(id);
        return ResponseEntity.noContent().build();
    }
}
