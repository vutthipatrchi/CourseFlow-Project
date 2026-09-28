package com.courseflow.course;

import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.courseflow.config.SecurityConfig;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(DemoContentController.class)
@ActiveProfiles("test")
@Import(SecurityConfig.class)
class DemoContentControllerTests {
    @Autowired private MockMvc mvc;
    @MockitoBean private DemoContentRepository content;
    @MockitoBean private JwtDecoder decoder;

    @Test
    void anonymousVisitorsOnlyReceiveTheFirstReadingAndTheRemainingOutline() throws Exception {
        var reading = new DemoContentRepository.DemoReading(
            "Course Overview", "Understand the course", List.of("First", "Second"),
            "An example", "A question", "A suggested answer");
        var first = new DemoContentRepository.DemoContentRow("Lesson 1", "Course Overview", "Course Overview", reading);
        var locked = new DemoContentRepository.DemoContentRow("Lesson 2", "Private lesson", "Private lesson", reading);
        when(content.listByTitle("Service Design Essentials")).thenReturn(List.of(first, locked));

        mvc.perform(get("/api/catalog/demo-content")
                .param("courseTitle", "Service Design Essentials"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].lessonName").value("Lesson 1"))
            .andExpect(jsonPath("$[0].subLessonName").value("Course Overview"))
            .andExpect(jsonPath("$[0].reading.paragraphs[1]").value("Second"))
            .andExpect(jsonPath("$[1].title").value("Private lesson"))
            .andExpect(jsonPath("$[1].reading").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void rejectsBlankCourseTitleBeforeLookingUpContent() throws Exception {
        mvc.perform(get("/api/catalog/demo-content").param("courseTitle", "  "))
            .andExpect(status().isBadRequest());
        verifyNoInteractions(content);
    }
}
