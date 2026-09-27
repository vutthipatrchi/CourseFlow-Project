package com.courseflow.submission;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.courseflow.common.web.ResourceNotFoundException;
import com.courseflow.config.SecurityConfig;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(AssignmentSubmissionController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class AssignmentSubmissionControllerTests {

    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private AssignmentSubmissionService service;

    private MyAssignmentView view(String status, String answer) {
        return new MyAssignmentView(5L, "What is service design?", 1L, "Service Design Essentials",
            "Lesson 1", 2, 7L, "Sub-lesson 1", 3, 2, status, answer,
            answer == null ? null : OffsetDateTime.now());
    }

    @Test
    void listsTheCallersAssignmentsUsingTheJwtSubject() throws Exception {
        when(service.findMyAssignments("user_1")).thenReturn(List.of(view("pending", null)));

        mvc.perform(get("/api/me/assignments").with(jwt().jwt(token -> token.subject("user_1"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(5))
            .andExpect(jsonPath("$[0].status").value("pending"))
            .andExpect(jsonPath("$[0].subLessonId").value(7))
            .andExpect(jsonPath("$[0].lessonPosition").value(2))
            .andExpect(jsonPath("$[0].subLessonPosition").value(3));
    }

    @Test
    void submitsAnAnswerForTheCaller() throws Exception {
        when(service.submit(eq(5L), eq("user_1"), eq("People, process")))
            .thenReturn(view("submitted", "People, process"));

        mvc.perform(post("/api/me/assignments/5/submissions")
                .with(jwt().jwt(token -> token.subject("user_1")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"answer\":\"People, process\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("submitted"))
            .andExpect(jsonPath("$.answer").value("People, process"));
    }

    @Test
    void rejectsABlankAnswer() throws Exception {
        mvc.perform(post("/api/me/assignments/5/submissions")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"answer\":\"  \"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.answer").exists());
    }

    @Test
    void returns404WhenTheAssignmentIsNotAvailableToTheCaller() throws Exception {
        when(service.submit(eq(9L), eq("user_1"), eq("answer")))
            .thenThrow(new ResourceNotFoundException("Assignment 9 not found"));

        mvc.perform(post("/api/me/assignments/9/submissions")
                .with(jwt().jwt(token -> token.subject("user_1")))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"answer\":\"answer\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void requiresAuthentication() throws Exception {
        mvc.perform(get("/api/me/assignments")).andExpect(status().isUnauthorized());
    }
}
