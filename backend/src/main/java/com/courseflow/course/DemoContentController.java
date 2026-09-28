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
@RequestMapping("/api/catalog/demo-content")
@Profile("!standalone")
public class DemoContentController {
    private final DemoContentRepository content;

    public DemoContentController(DemoContentRepository content) {
        this.content = content;
    }

    @GetMapping
    public ResponseEntity<List<DemoContentRepository.DemoContentRow>> list(
        @RequestParam String courseTitle
    ) {
        if (courseTitle.isBlank() || courseTitle.length() > 255) {
            throw new IllegalArgumentException("Course title must be between 1 and 255 characters");
        }
        var rows = content.listByTitle(courseTitle);
        var preview = java.util.stream.IntStream.range(0, rows.size())
            .mapToObj(index -> index == 0 ? rows.get(index) : rows.get(index).withoutReading())
            .toList();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(preview);
    }
}
