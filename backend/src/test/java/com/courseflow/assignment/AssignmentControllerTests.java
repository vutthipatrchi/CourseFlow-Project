package com.courseflow.assignment;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.courseflow.config.SecurityConfig;
import tools.jackson.databind.ObjectMapper;
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

@WebMvcTest(AssignmentController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class AssignmentControllerTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private AssignmentService assignmentService;

    @Test
    void createsAssignmentAndReturns201WithLocation() throws Exception {
        var request = new CreateAssignmentRequest(1L, "Write a short essay");
        var response = new AssignmentResponse(10L, 1L, "Write a short essay", OffsetDateTime.now());
        when(assignmentService.create(any())).thenReturn(response);

        mvc.perform(post("/api/admin/assignments")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/api/admin/assignments/10"))
            .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    void rejectsBlankDescription() throws Exception {
        var request = new CreateAssignmentRequest(1L, "");

        mvc.perform(post("/api/admin/assignments")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.description").exists());
    }

    @Test
    void returnsAllAssignments() throws Exception {
        var summary = new AssignmentSummary(
            1L, "Write a short essay",
            "Introduction to Web Development", "HTML Basics", "Structuring a Page",
            OffsetDateTime.now());
        when(assignmentService.findAll()).thenReturn(List.of(summary));

        mvc.perform(get("/api/admin/assignments").with(jwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].courseName").value("Introduction to Web Development"));
    }
}
