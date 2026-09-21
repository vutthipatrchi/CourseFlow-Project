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
        var request = new CreateAssignmentRequest(subLessonId, "Repository round-trip test");

        AssignmentResponse inserted = assignmentRepository.insert(request);

        var found = assignmentRepository.findAllWithContext().stream()
            .filter(summary -> summary.id().equals(inserted.id()))
            .findFirst()
            .orElseThrow();

        assertThat(found.description()).isEqualTo("Repository round-trip test");
    }

    @Test
    void updatesAssignmentDescription() {
        Long subLessonId = subLessonOptionRepository.findAll().get(0).subLessonId();
        var inserted = assignmentRepository.insert(new CreateAssignmentRequest(subLessonId, "Before update"));

        var updated = assignmentRepository.update(
            inserted.id(), new CreateAssignmentRequest(subLessonId, "After update"));

        assertThat(updated).isPresent();
        assertThat(updated.get().description()).isEqualTo("After update");
        assertThat(assignmentRepository.findById(inserted.id()).orElseThrow().description())
            .isEqualTo("After update");
    }

    @Test
    void updatingAMissingAssignmentReturnsEmpty() {
        var result = assignmentRepository.update(-1L, new CreateAssignmentRequest(1L, "No such row"));

        assertThat(result).isEmpty();
    }

    @Test
    void deletesAssignmentSoItNoLongerReadsBack() {
        Long subLessonId = subLessonOptionRepository.findAll().get(0).subLessonId();
        var inserted = assignmentRepository.insert(new CreateAssignmentRequest(subLessonId, "To be deleted"));

        boolean deleted = assignmentRepository.deleteById(inserted.id());

        assertThat(deleted).isTrue();
        assertThat(assignmentRepository.findById(inserted.id())).isEmpty();
    }

    @Test
    void deletingAMissingAssignmentReturnsFalse() {
        assertThat(assignmentRepository.deleteById(-1L)).isFalse();
    }
}
