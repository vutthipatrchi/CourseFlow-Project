package com.courseflow.payment;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.courseflow.common.web.ResourceNotFoundException;
import com.courseflow.config.SecurityConfig;
import com.courseflow.course.DemoContentRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(EnrolledDemoContentController.class)
@ActiveProfiles("test")
@Import(SecurityConfig.class)
class EnrolledDemoContentControllerTests {
    @Autowired private MockMvc mvc;
    @MockitoBean private PaymentService payments;
    @MockitoBean private DemoContentRepository content;
    @MockitoBean private JwtDecoder decoder;

    @Test
    void retiredTitleBasedEndpointCannotBypassEnrollment() throws Exception {
        mvc.perform(get("/api/learn/demo-content")
                .param("courseTitle", "Service Design Essentials")
                .with(jwt().jwt(j -> j.subject("non_buyer"))))
            .andExpect(status().isForbidden());
        verifyNoInteractions(payments, content);
    }

    @Test
    void anonymousCallerCannotReadFullContent() throws Exception {
        mvc.perform(get("/api/me/courses/1/demo-content"))
            .andExpect(status().isUnauthorized());
        verifyNoInteractions(payments, content);
    }

    @Test
    void callerWithoutAnActiveSubscriptionCannotReadFullContent() throws Exception {
        when(payments.courseProgress("other_user", 1L))
            .thenThrow(new ResourceNotFoundException("Active course subscription not found"));

        mvc.perform(get("/api/me/courses/1/demo-content")
                .with(jwt().jwt(j -> j.subject("other_user"))))
            .andExpect(status().isNotFound());
        verifyNoInteractions(content);
    }

    @Test
    void activeSubscriberCanReadFullContentForTheRequestedCourseId() throws Exception {
        var reading = new DemoContentRepository.DemoReading(
            "Private lesson", "Objective", List.of("First", "Second"),
            "Example", "Exercise", "Private answer");
        when(content.listByCourseId(1L)).thenReturn(List.of(
            new DemoContentRepository.DemoContentRow("Lesson 2", "Private lesson", "Private lesson", reading)));

        mvc.perform(get("/api/me/courses/1/demo-content")
                .with(jwt().jwt(j -> j.subject("buyer"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].reading.solution").value("Private answer"));
        verify(payments).courseProgress("buyer", 1L);
        verify(content).listByCourseId(1L);
    }
}
