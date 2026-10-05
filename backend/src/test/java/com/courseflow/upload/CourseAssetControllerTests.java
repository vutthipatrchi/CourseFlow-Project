package com.courseflow.upload;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import com.courseflow.config.SecurityConfig;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(CourseAssetController.class)
@ActiveProfiles("test")
@Import(SecurityConfig.class)
class CourseAssetControllerTests {
    @Autowired private MockMvc mvc;
    @MockitoBean private LocalCourseAssetStorage storage;
    @MockitoBean private CourseAssetAccessRepository access;
    @MockitoBean private JwtDecoder decoder;
    @TempDir Path temp;
    private static final String FILE = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    @Test void onlyAdminsCanUploadCourseFiles() throws Exception {
        var file = new MockMultipartFile("file", "notes.pdf", "application/pdf", "notes".getBytes());
        mvc.perform(multipart("/api/admin/uploads/course-resources").file(file)).andExpect(status().isUnauthorized());
        mvc.perform(multipart("/api/admin/uploads/course-resources").file(file).with(jwt())).andExpect(status().isForbidden());
        verifyNoInteractions(storage);
        when(storage.store("resources", file)).thenReturn(new LocalCourseAssetStorage.StoredAsset("/api/uploads/course-resources/" + FILE + ".pdf", "application/pdf", "notes.pdf"));
        mvc.perform(multipart("/api/admin/uploads/course-resources").file(file).with(jwt().jwt(j -> j.claim("metadata", Map.of("role", "admin")))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.url").value("/api/uploads/course-resources/" + FILE + ".pdf"));
    }

    @Test void guestsCanReadCoversAndStreamPreviewsIncludingRanges() throws Exception {
        var file = Files.writeString(temp.resolve("intro.mp4"), "video-data");
        when(storage.resolve("previews", FILE + ".mp4")).thenReturn(file);
        when(storage.contentType("previews", FILE + ".mp4")).thenReturn("video/mp4");
        mvc.perform(get("/api/uploads/course-previews/" + FILE + ".mp4").header("Range", "bytes=0-4"))
            .andExpect(status().isPartialContent()).andExpect(content().bytes("video".getBytes()));
        mvc.perform(head("/api/uploads/course-previews/" + FILE + ".mp4")).andExpect(status().isOk());
        when(storage.resolve("images", FILE + ".png")).thenReturn(file);
        when(storage.contentType("images", FILE + ".png")).thenReturn("image/png");
        mvc.perform(get("/api/uploads/course-images/" + FILE + ".png")).andExpect(status().isOk());
        verifyNoInteractions(access);
    }

    @Test void privateAttachmentsRequireAnActiveSubscriptionOrAdmin() throws Exception {
        String path = "/api/uploads/course-resources/" + FILE + ".pdf";
        mvc.perform(get(path)).andExpect(status().isUnauthorized());
        mvc.perform(get(path).with(jwt().jwt(j -> j.subject("nonbuyer")))).andExpect(status().isNotFound());
        verifyNoInteractions(storage);
        var file = Files.writeString(temp.resolve("notes.pdf"), "notes");
        when(storage.resolve("resources", FILE + ".pdf")).thenReturn(file);
        when(storage.contentType("resources", FILE + ".pdf")).thenReturn("application/pdf");
        when(access.canDownloadResource("buyer", FILE + ".pdf")).thenReturn(true);
        mvc.perform(get(path).with(jwt().jwt(j -> j.subject("buyer"))))
            .andExpect(status().isOk()).andExpect(content().bytes("notes".getBytes()))
            .andExpect(header().string("Cache-Control", "no-store"))
            .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("attachment;")));
        mvc.perform(get(path).with(jwt().jwt(j -> j.claim("metadata", Map.of("role", "admin"))))).andExpect(status().isOk());
    }
}
