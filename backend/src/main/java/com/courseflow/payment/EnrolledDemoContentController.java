package com.courseflow.payment;

import com.courseflow.course.DemoContentRepository;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("!standalone")
@RequestMapping("/api/me/courses/{courseId}/demo-content")
class EnrolledDemoContentController {
    private final PaymentService payments;
    private final DemoContentRepository content;

    EnrolledDemoContentController(PaymentService payments, DemoContentRepository content) {
        this.payments = payments;
        this.content = content;
    }

    @GetMapping
    ResponseEntity<List<DemoContentRepository.DemoContentRow>> list(
        @PathVariable Long courseId, @AuthenticationPrincipal Jwt jwt
    ) {
        payments.courseProgress(jwt.getSubject(), courseId);
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(content.listByCourseId(courseId));
    }
}
