package com.courseflow.course;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@Profile("!standalone")
public class LessonController {

    private final LessonService lessonService;

    public LessonController(LessonService lessonService) {
        this.lessonService = lessonService;
    }

    @GetMapping("/courses/{courseId}/lessons")
    public List<LessonSummaryResponse> listByCourse(@PathVariable Long courseId) {
        return lessonService.listByCourse(courseId);
    }

    @PostMapping("/courses/{courseId}/lessons")
    public ResponseEntity<LessonDetailResponse> create(
            @PathVariable Long courseId, @Valid @RequestBody CreateLessonRequest request) {
        LessonDetailResponse created = lessonService.create(courseId, request);
        return ResponseEntity.created(URI.create("/api/admin/lessons/" + created.id())).body(created);
    }

    @GetMapping("/lessons/{lessonId}")
    public LessonDetailResponse get(@PathVariable Long lessonId) {
        return lessonService.get(lessonId);
    }

    @PutMapping("/lessons/{lessonId}")
    public LessonDetailResponse update(
            @PathVariable Long lessonId, @Valid @RequestBody UpdateLessonRequest request) {
        return lessonService.update(lessonId, request);
    }

    @DeleteMapping("/lessons/{lessonId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long lessonId) {
        lessonService.delete(lessonId);
    }
}
