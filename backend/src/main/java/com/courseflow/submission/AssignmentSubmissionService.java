package com.courseflow.submission;

import com.courseflow.common.web.ResourceNotFoundException;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!standalone")
public class AssignmentSubmissionService {

    private final AssignmentSubmissionRepository repository;
    private final Clock clock;

    @Autowired
    public AssignmentSubmissionService(AssignmentSubmissionRepository repository) {
        this(repository, Clock.systemUTC());
    }

    AssignmentSubmissionService(AssignmentSubmissionRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    public List<MyAssignmentView> findMyAssignments(String subject) {
        OffsetDateTime now = OffsetDateTime.now(clock);
        return repository.findMyAssignments(subject).stream().map(row -> toView(row, now)).toList();
    }

    public MyAssignmentView submit(long assignmentId, String subject, String answer) {
        if (!repository.isSubscribedToAssignment(assignmentId, subject)) {
            throw new ResourceNotFoundException("Assignment " + assignmentId + " not found");
        }
        repository.upsertSubmission(assignmentId, subject, answer);
        return repository.findMyAssignmentById(assignmentId, subject)
            .map(row -> toView(row, OffsetDateTime.now(clock)))
            .orElseThrow(() -> new ResourceNotFoundException("Assignment " + assignmentId + " not found"));
    }

    private MyAssignmentView toView(MyAssignmentRow row, OffsetDateTime now) {
        String status;
        if (row.answer() != null) {
            status = "submitted";
        } else if (row.dueAt() != null && row.dueAt().isBefore(now)) {
            status = "overdue";
        } else {
            status = "pending";
        }
        return new MyAssignmentView(row.id(), row.description(), row.courseId(), row.courseName(),
            row.lessonName(), row.lessonPosition(), row.subLessonId(), row.subLessonName(), row.subLessonPosition(),
            row.durationDays(), row.dueAt(), status, row.answer(), row.submittedAt());
    }
}
