package com.courseflow.assignment;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.courseflow.common.web.ResourceNotFoundException;
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
        var request = new CreateAssignmentRequest(1L, "Write a short essay", null);
        var response = new AssignmentResponse(10L, 1L, "Write a short essay", null, OffsetDateTime.now());
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
        var request = new CreateAssignmentRequest(1L, "", null);

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
            null, OffsetDateTime.now());
        when(assignmentService.findAll()).thenReturn(List.of(summary));

        mvc.perform(get("/api/admin/assignments").with(jwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].courseName").value("Introduction to Web Development"));
    }

    @Test
    void returnsOneAssignmentById() throws Exception {
        var response = new AssignmentResponse(10L, 1L, "Write a short essay", null, OffsetDateTime.now());
        when(assignmentService.findById(10L)).thenReturn(response);

        mvc.perform(get("/api/admin/assignments/10").with(jwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.description").value("Write a short essay"));
    }

    @Test
    void returns404WhenAssignmentToFetchIsMissing() throws Exception {
        when(assignmentService.findById(999L))
            .thenThrow(new ResourceNotFoundException("Assignment 999 not found"));

        mvc.perform(get("/api/admin/assignments/999").with(jwt()))
            .andExpect(status().isNotFound());
    }

    @Test
    void updatesAssignmentAndReturnsIt() throws Exception {
        var request = new CreateAssignmentRequest(1L, "Updated description", null);
        var response = new AssignmentResponse(10L, 1L, "Updated description", null, OffsetDateTime.now());
        when(assignmentService.update(eq(10L), any())).thenReturn(response);

        mvc.perform(put("/api/admin/assignments/10")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.description").value("Updated description"));
    }

    @Test
    void returns404WhenUpdatingMissingAssignment() throws Exception {
        var request = new CreateAssignmentRequest(1L, "Updated description", null);
        when(assignmentService.update(eq(999L), any()))
            .thenThrow(new ResourceNotFoundException("Assignment 999 not found"));

        mvc.perform(put("/api/admin/assignments/999")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound());
    }

    @Test
    void deletesAssignmentAndReturns204() throws Exception {
        doNothing().when(assignmentService).delete(10L);

        mvc.perform(delete("/api/admin/assignments/10").with(jwt()))
            .andExpect(status().isNoContent());
    }

    @Test
    void returns404WhenDeletingMissingAssignment() throws Exception {
        doThrow(new ResourceNotFoundException("Assignment 999 not found"))
            .when(assignmentService).delete(999L);

        mvc.perform(delete("/api/admin/assignments/999").with(jwt()))
            .andExpect(status().isNotFound());
    }
}
