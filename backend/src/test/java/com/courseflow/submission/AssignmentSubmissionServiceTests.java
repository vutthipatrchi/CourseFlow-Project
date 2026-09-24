package com.courseflow.submission;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.courseflow.common.web.ResourceNotFoundException;
import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class AssignmentSubmissionServiceTests {

    private static final Instant NOW = Instant.parse("2026-09-24T10:00:00Z");
    private static final OffsetDateTime NOW_ODT = OffsetDateTime.ofInstant(NOW, ZoneOffset.UTC);

    private final AssignmentSubmissionRepository repository = mock(AssignmentSubmissionRepository.class);
    private final AssignmentSubmissionService service =
        new AssignmentSubmissionService(repository, Clock.fixed(NOW, ZoneOffset.UTC));

    private MyAssignmentRow row(long id, OffsetDateTime dueAt, String answer) {
        return new MyAssignmentRow(id, "Question " + id, 1L, "Course", "Lesson", 7L, "Sub-lesson",
            dueAt == null ? null : 2, dueAt, answer, answer == null ? null : NOW_ODT);
    }

    @Test
    void statusIsSubmittedWhenAnAnswerExistsEvenIfPastDue() {
        when(repository.findMyAssignments("u1"))
            .thenReturn(List.of(row(1, NOW_ODT.minusDays(3), "my answer")));

        assertThat(service.findMyAssignments("u1")).singleElement()
            .satisfies(view -> assertThat(view.status()).isEqualTo("submitted"));
    }

    @Test
    void statusIsOverdueWhenUnsubmittedAndPastDue() {
        when(repository.findMyAssignments("u1"))
            .thenReturn(List.of(row(1, NOW_ODT.minusMinutes(1), null)));

        assertThat(service.findMyAssignments("u1").get(0).status()).isEqualTo("overdue");
    }

    @Test
    void statusIsPendingWhenUnsubmittedAndNotYetDue() {
        when(repository.findMyAssignments("u1"))
            .thenReturn(List.of(row(1, NOW_ODT.plusDays(1), null)));

        assertThat(service.findMyAssignments("u1").get(0).status()).isEqualTo("pending");
    }

    @Test
    void statusIsPendingWhenThereIsNoDeadline() {
        when(repository.findMyAssignments("u1")).thenReturn(List.of(row(1, null, null)));

        assertThat(service.findMyAssignments("u1").get(0).status()).isEqualTo("pending");
    }

    @Test
    void submitSavesTheAnswerAndReturnsTheRefreshedAssignment() {
        when(repository.isSubscribedToAssignment(5L, "u1")).thenReturn(true);
        when(repository.findMyAssignmentById(5L, "u1"))
            .thenReturn(Optional.of(row(5, NOW_ODT.plusDays(1), "done")));

        MyAssignmentView view = service.submit(5L, "u1", "done");

        verify(repository).upsertSubmission(5L, "u1", "done");
        assertThat(view.status()).isEqualTo("submitted");
        assertThat(view.subLessonId()).isEqualTo(7L);
    }

    @Test
    void submitIsRejectedWithoutAnActiveSubscription() {
        when(repository.isSubscribedToAssignment(5L, "u1")).thenReturn(false);

        assertThatThrownBy(() -> service.submit(5L, "u1", "done"))
            .isInstanceOf(ResourceNotFoundException.class);
        verify(repository, never()).upsertSubmission(5L, "u1", "done");
    }
}
