package com.courseflow.course;

import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learn/demo-content")
@Profile("!standalone")
public class LearningDemoContentController {
    private final DemoContentRepository content;

    public LearningDemoContentController(DemoContentRepository content) {
        this.content = content;
    }

    @GetMapping
    public ResponseEntity<List<DemoContentRepository.DemoContentRow>> list(
        @RequestParam String courseTitle
    ) {
        if (courseTitle.isBlank() || courseTitle.length() > 255) {
            throw new IllegalArgumentException("Course title must be between 1 and 255 characters");
        }
        return ResponseEntity.ok()
            .cacheControl(CacheControl.noStore())
            .body(content.listByTitle(courseTitle));
    }
}
