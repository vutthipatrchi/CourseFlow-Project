package com.courseflow.course;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.courseflow.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(DemoVideoController.class)
@Import(SecurityConfig.class)
class DemoVideoControllerTests {
    @Autowired private MockMvc mvc;
    @MockitoBean private JwtDecoder decoder;

    @Test
    void anonymousVisitorCanStreamTheBackendSampleVideo() throws Exception {
        mvc.perform(get("/api/catalog/demo-video").header("Range", "bytes=0-3"))
            .andExpect(status().isPartialContent())
            .andExpect(header().string("Content-Type", "video/mp4"));
    }
}
