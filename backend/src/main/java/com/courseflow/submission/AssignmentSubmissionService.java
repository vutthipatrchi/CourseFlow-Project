package com.courseflow.submission;

import com.courseflow.common.web.ResourceNotFoundException;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!standalone")
public class AssignmentSubmissionService {

    private final AssignmentSubmissionRepository repository;

    public AssignmentSubmissionService(AssignmentSubmissionRepository repository) {
        this.repository = repository;
    }

    public List<MyAssignmentView> findMyAssignments(String subject) {
        return repository.findMyAssignments(subject).stream().map(this::toView).toList();
    }

    public MyAssignmentView submit(long assignmentId, String subject, String answer) {
        if (!repository.isSubscribedToAssignment(assignmentId, subject)) {
            throw new ResourceNotFoundException("Assignment " + assignmentId + " not found");
        }
        repository.upsertSubmission(assignmentId, subject, answer);
        return repository.findMyAssignmentById(assignmentId, subject)
            .map(this::toView)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment " + assignmentId + " not found"));
    }

    // Courses are self-paced, so there is no deadline and no "overdue": an assignment is pending until answered.
    private MyAssignmentView toView(MyAssignmentRow row) {
        String status = row.answer() != null ? "submitted" : "pending";
        return new MyAssignmentView(row.id(), row.description(), row.courseId(), row.courseName(),
            row.lessonName(), row.lessonPosition(), row.subLessonId(), row.subLessonName(), row.subLessonPosition(),
            row.durationDays(), status, row.answer(), row.submittedAt());
    }
}
