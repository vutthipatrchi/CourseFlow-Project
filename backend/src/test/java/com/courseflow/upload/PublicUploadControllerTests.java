package com.courseflow.upload;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.courseflow.config.SecurityConfig;
import jakarta.servlet.http.Cookie;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PublicUploadController.class)
@ActiveProfiles("test")
@Import({SecurityConfig.class, VideoTicketService.class})
class PublicUploadControllerTests {
    @Autowired private MockMvc mvc;
    @MockitoBean private LocalVideoStorage storage;
    @MockitoBean private VideoAccessRepository access;
    @MockitoBean private JwtDecoder decoder;
    @TempDir Path temp;

    @Test
    void anonymousVisitorCannotGetAccessOrDownloadUploadedLessonVideo() throws Exception {
        mvc.perform(post("/api/uploads/videos/lesson.mp4/access"))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/uploads/videos/lesson.mp4"))
            .andExpect(status().isNotFound());
        verifyNoInteractions(access, storage);
    }

    @Test
    void learnerWithoutSubscriptionCannotDownloadUploadedLessonVideo() throws Exception {
        when(storage.resolvePublicFile("videos/lesson.mp4"))
            .thenReturn(Files.writeString(temp.resolve("lesson.mp4"), "video-data"));
        mvc.perform(post("/api/uploads/videos/lesson.mp4/access")
                .with(jwt().jwt(j -> j.subject("other_user"))))
            .andExpect(status().isNotFound());
        org.mockito.Mockito.verify(access).hasActiveSubscription("other_user", "lesson.mp4");
    }

    @Test
    void subscribedLearnerCanDownloadTheVideo() throws Exception {
        Path file = Files.writeString(temp.resolve("lesson.mp4"), "video-data");
        when(access.hasActiveSubscription("buyer", "lesson.mp4")).thenReturn(true);
        when(storage.resolvePublicFile("videos/lesson.mp4")).thenReturn(file);
        when(storage.probeContentType(file)).thenReturn("video/mp4");

        Cookie cookie = mvc.perform(post("/api/uploads/videos/lesson.mp4/access")
                .with(jwt().jwt(j -> j.subject("buyer"))))
            .andExpect(status().isNoContent())
            .andReturn().getResponse().getCookie(VideoTicketService.COOKIE_NAME);

        mvc.perform(get("/api/uploads/videos/lesson.mp4").cookie(cookie))
            .andExpect(status().isOk())
            .andExpect(content().bytes("video-data".getBytes()));
        mvc.perform(get("/api/uploads/videos/lesson.mp4").cookie(cookie)
                .header("Range", "bytes=0-4"))
            .andExpect(status().isPartialContent())
            .andExpect(content().bytes("video".getBytes()));
        mvc.perform(get("/api/uploads/videos/other.mp4").cookie(cookie))
            .andExpect(status().isNotFound());
    }

    @Test
    void revokingTheSubscriptionStopsAnIssuedTicket() throws Exception {
        when(storage.resolvePublicFile("videos/lesson.mp4"))
            .thenReturn(Files.writeString(temp.resolve("lesson.mp4"), "video-data"));
        when(access.hasActiveSubscription("buyer", "lesson.mp4")).thenReturn(true, false);
        Cookie cookie = mvc.perform(post("/api/uploads/videos/lesson.mp4/access")
                .with(jwt().jwt(j -> j.subject("buyer"))))
            .andExpect(status().isNoContent())
            .andReturn().getResponse().getCookie(VideoTicketService.COOKIE_NAME);

        mvc.perform(get("/api/uploads/videos/lesson.mp4").cookie(cookie))
            .andExpect(status().isNotFound());
    }

    @Test
    void adminCanPreviewUploadedVideoBeforeItIsAttachedToALesson() throws Exception {
        Path file = Files.writeString(temp.resolve("new.mp4"), "video-data");
        when(storage.resolvePublicFile("videos/new.mp4")).thenReturn(file);
        when(storage.probeContentType(file)).thenReturn("video/mp4");

        Cookie cookie = mvc.perform(post("/api/uploads/videos/new.mp4/access")
                .with(jwt().jwt(j -> j.claim("metadata", Map.of("role", "admin")))))
            .andExpect(status().isNoContent())
            .andReturn().getResponse().getCookie(VideoTicketService.COOKIE_NAME);
        mvc.perform(get("/api/uploads/videos/new.mp4").cookie(cookie))
            .andExpect(status().isOk());
        verifyNoInteractions(access);
    }
}
