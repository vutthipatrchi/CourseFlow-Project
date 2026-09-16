package com.courseflow.assignment;

import static org.assertj.core.api.Assertions.assertThat;

import com.courseflow.course.SubLessonOptionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("local")
@EnabledIfSystemProperty(named = "spring.profiles.active", matches = "local")
class AssignmentRepositoryTests {

    @Autowired
    private AssignmentRepository assignmentRepository;

    @Autowired
    private SubLessonOptionRepository subLessonOptionRepository;

    @Test
    void insertsAndReadsBackAssignmentWithContext() {
        Long subLessonId = subLessonOptionRepository.findAll().get(0).subLessonId();
        var request = new CreateAssignmentRequest(subLessonId, "Repository round-trip test", 5, "draft");

        AssignmentResponse inserted = assignmentRepository.insert(request, "draft");

        var found = assignmentRepository.findAllWithContext().stream()
            .filter(summary -> summary.id().equals(inserted.id()))
            .findFirst()
            .orElseThrow();

        assertThat(found.description()).isEqualTo("Repository round-trip test");
        assertThat(found.durationDays()).isEqualTo(5);
        assertThat(found.status()).isEqualTo("draft");
    }
}
