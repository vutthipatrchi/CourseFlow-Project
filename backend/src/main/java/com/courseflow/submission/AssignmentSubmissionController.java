package com.courseflow.submission;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/assignments")
@Profile("!standalone")
public class AssignmentSubmissionController {

    private final AssignmentSubmissionService service;

    public AssignmentSubmissionController(AssignmentSubmissionService service) {
        this.service = service;
    }

    @GetMapping
    public List<MyAssignmentView> findMyAssignments(@AuthenticationPrincipal Jwt jwt) {
        return service.findMyAssignments(jwt.getSubject());
    }

    @PostMapping("/{id}/submissions")
    public MyAssignmentView submit(
            @PathVariable long id,
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody SubmitAssignmentRequest request) {
        return service.submit(id, jwt.getSubject(), request.answer());
    }
}
