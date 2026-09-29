package com.courseflow.assignment;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/assignments")
@Profile("!standalone")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @PostMapping
    public ResponseEntity<AssignmentResponse> create(@Valid @RequestBody CreateAssignmentRequest request) {
        AssignmentResponse response = assignmentService.create(request);
        return ResponseEntity
            .created(URI.create("/api/admin/assignments/" + response.id()))
            .body(response);
    }

    @GetMapping
    public List<AssignmentSummary> findAll() {
        return assignmentService.findAll();
    }

    @GetMapping("/{id}")
    public AssignmentResponse findById(@PathVariable long id) {
        return assignmentService.findById(id);
    }

    @PutMapping("/{id}")
    public AssignmentResponse update(@PathVariable long id, @Valid @RequestBody CreateAssignmentRequest request) {
        return assignmentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        assignmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
