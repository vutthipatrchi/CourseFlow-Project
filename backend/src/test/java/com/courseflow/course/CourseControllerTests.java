package com.courseflow.course;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CourseController.class)
@ActiveProfiles("local")
class CourseControllerTests {
    @Autowired
    private MockMvc mvc;

    @MockitoBean
    private CourseRepository courses;

    @Test
    void listsCoursesFromRepository() throws Exception {
        when(courses.findAll()).thenReturn(List.of(sampleCourse()));

        mvc.perform(get("/api/admin/courses"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].id").value(1))
            .andExpect(jsonPath("$[0].name").value("Database Course"))
            .andExpect(jsonPath("$[0].lessons").value(1));
    }

    @Test
    void createsAValidatedCourse() throws Exception {
        when(courses.create(any(CourseRequest.class))).thenReturn(sampleCourse());

        mvc.perform(post("/api/admin/courses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Database Course",
                      "price": 3599,
                      "hasPromo": false,
                      "accent": "#dce8fb",
                      "lessonItems": [{"name": "Introduction", "subLessons": 1}]
                    }
                    """))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/api/admin/courses/1"))
            .andExpect(jsonPath("$.name").value("Database Course"));
    }

    @Test
    void rejectsNegativePriceBeforeCallingRepository() throws Exception {
        mvc.perform(post("/api/admin/courses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "name": "Invalid Course",
                      "price": -1,
                      "hasPromo": false,
                      "lessonItems": []
                    }
                    """))
            .andExpect(status().isBadRequest());

        verify(courses, never()).create(any(CourseRequest.class));
    }

    private Course sampleCourse() {
        var timestamp = OffsetDateTime.parse("2026-09-17T12:00:00+07:00");
        return new Course(
            1,
            "Database Course",
            1,
            BigDecimal.valueOf(3599),
            timestamp,
            timestamp,
            "#dce8fb",
            null,
            10,
            false,
            null,
            null,
            null,
            null,
            "Summary",
            "Description",
            null,
            null,
            null,
            List.of(new CourseLesson(1, "Introduction", 1))
        );
    }
}
