package com.courseflow.course;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class CourseNotFoundException extends RuntimeException {
    public CourseNotFoundException(long id) {
        super("Course " + id + " was not found");
    }
}
