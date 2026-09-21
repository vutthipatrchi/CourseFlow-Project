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
        return assignmentRepository.insert(request);
    }

    public List<AssignmentSummary> findAll() {
        return assignmentRepository.findAllWithContext();
    }

    public AssignmentResponse findById(long id) {
        return assignmentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment " + id + " not found"));
    }

    public AssignmentResponse update(long id, CreateAssignmentRequest request) {
        if (!assignmentRepository.subLessonExists(request.subLessonId())) {
            throw new ResourceNotFoundException("Sub-lesson " + request.subLessonId() + " not found");
        }
        return assignmentRepository.update(id, request)
            .orElseThrow(() -> new ResourceNotFoundException("Assignment " + id + " not found"));
    }

    public void delete(long id) {
        if (!assignmentRepository.deleteById(id)) {
            throw new ResourceNotFoundException("Assignment " + id + " not found");
        }
    }
}
