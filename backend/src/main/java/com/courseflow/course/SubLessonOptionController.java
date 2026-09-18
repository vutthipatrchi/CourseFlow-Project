package com.courseflow.course;

import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/sub-lessons")
@Profile("!standalone")
public class SubLessonOptionController {

    private final SubLessonOptionRepository subLessonOptionRepository;

    public SubLessonOptionController(SubLessonOptionRepository subLessonOptionRepository) {
        this.subLessonOptionRepository = subLessonOptionRepository;
    }

    @GetMapping
    public List<SubLessonOption> findAll() {
        return subLessonOptionRepository.findAll();
    }
}
