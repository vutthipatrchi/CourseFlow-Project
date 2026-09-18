package com.courseflow.course;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.courseflow.common.web.ApiExceptionHandler;
import com.courseflow.common.web.ResourceNotFoundException;
import com.courseflow.config.SecurityConfig;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

@WebMvcTest(LessonController.class)
@Import({SecurityConfig.class, ApiExceptionHandler.class})
@ActiveProfiles("test")
class LessonControllerTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private LessonService lessonService;

    @Test
    void listsLessonsWithSubLessonCounts() throws Exception {
        when(lessonService.listByCourse(1L))
                .thenReturn(List.of(new LessonSummaryResponse(10L, "Introduction", 1, 4)));

        mvc.perform(get("/api/admin/courses/1/lessons").with(jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].name").value("Introduction"))
                .andExpect(jsonPath("$[0].subLessonCount").value(4));
    }

    @Test
    void createsLessonWithSubLessons() throws Exception {
        var request = new CreateLessonRequest(
                "Introduction",
                List.of(new SubLessonWriteRequest(null, "Welcome to the Course", "https://cdn.example/a.mp4")));
        var response = new LessonDetailResponse(
                10L,
                1L,
                "Introduction",
                1,
                List.of(new SubLessonResponse(100L, "Welcome to the Course", "https://cdn.example/a.mp4", 1)));
        when(lessonService.create(eq(1L), any())).thenReturn(response);

        mvc.perform(post("/api/admin/courses/1/lessons")
                        .with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/admin/lessons/10"))
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.subLessons[0].name").value("Welcome to the Course"));
    }

    @Test
    void rejectsBlankLessonName() throws Exception {
        var request = new CreateLessonRequest(
                "",
                List.of(new SubLessonWriteRequest(null, "Welcome", "https://cdn.example/a.mp4")));

        mvc.perform(post("/api/admin/courses/1/lessons")
                        .with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }

    @Test
    void rejectsMissingVideoUrl() throws Exception {
        var request = new CreateLessonRequest(
                "Introduction", List.of(new SubLessonWriteRequest(null, "Welcome", "")));

        mvc.perform(post("/api/admin/courses/1/lessons")
                        .with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors['subLessons[0].videoUrl']").exists());
    }

    @Test
    void getsLessonDetail() throws Exception {
        when(lessonService.get(10L))
                .thenReturn(new LessonDetailResponse(
                        10L,
                        1L,
                        "Introduction",
                        1,
                        List.of(new SubLessonResponse(100L, "Welcome", "https://cdn.example/a.mp4", 1))));

        mvc.perform(get("/api/admin/lessons/10").with(jwt()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Introduction"))
                .andExpect(jsonPath("$.subLessons[0].id").value(100));
    }

    @Test
    void updatesLessonAndSubLessons() throws Exception {
        var request = new UpdateLessonRequest(
                "Introduction",
                List.of(new SubLessonWriteRequest(100L, "Welcome", "https://cdn.example/a.mp4")));
        when(lessonService.update(eq(10L), any()))
                .thenReturn(new LessonDetailResponse(
                        10L,
                        1L,
                        "Introduction",
                        1,
                        List.of(new SubLessonResponse(100L, "Welcome", "https://cdn.example/a.mp4", 1))));

        mvc.perform(put("/api/admin/lessons/10")
                        .with(jwt())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10));
    }

    @Test
    void deletesLesson() throws Exception {
        mvc.perform(delete("/api/admin/lessons/10").with(jwt())).andExpect(status().isNoContent());
        verify(lessonService).delete(10L);
    }

    @Test
    void returns404WhenLessonMissing() throws Exception {
        when(lessonService.get(999L)).thenThrow(new ResourceNotFoundException("Lesson 999 not found"));

        mvc.perform(get("/api/admin/lessons/999").with(jwt()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Lesson 999 not found"));
    }

    @Test
    void requiresAuthentication() throws Exception {
        mvc.perform(get("/api/admin/courses/1/lessons")).andExpect(status().isUnauthorized());
    }
}
