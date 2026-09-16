package com.courseflow.assignment;

import com.courseflow.common.web.ResourceNotFoundException;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!standalone")
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;

    public AssignmentService(AssignmentRepository assignmentRepository) {
        this.assignmentRepository = assignmentRepository;
    }

    public AssignmentResponse create(CreateAssignmentRequest request) {
        if (!assignmentRepository.subLessonExists(request.subLessonId())) {
            throw new ResourceNotFoundException("Sub-lesson " + request.subLessonId() + " not found");
        }
        String resolvedStatus = (request.status() == null || request.status().isBlank())
            ? "draft"
            : request.status();
        return assignmentRepository.insert(request, resolvedStatus);
    }

    public List<AssignmentSummary> findAll() {
        return assignmentRepository.findAllWithContext();
    }
}
