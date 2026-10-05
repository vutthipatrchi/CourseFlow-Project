package com.courseflow.wishlist;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.courseflow.config.SecurityConfig;
import com.courseflow.common.web.ResourceNotFoundException;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(WishlistController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class WishlistControllerTests {
    @Autowired private MockMvc mvc;
    @MockitoBean private WishlistRepository repository;

    @Test
    void requiresAuthenticationForAllOperations() throws Exception {
        mvc.perform(get("/api/me/wishlist")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/me/wishlist/1")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/me/wishlist/1")).andExpect(status().isUnauthorized());
        verifyNoInteractions(repository);
    }

    @Test
    void usesOnlyAuthenticatedSubjectForReadsAndWrites() throws Exception {
        when(repository.findAll("user_a")).thenReturn(List.of());
        mvc.perform(get("/api/me/wishlist?userId=user_b").with(jwt().jwt(j -> j.subject("user_a"))))
            .andExpect(status().isOk()).andExpect(content().json("[]"))
            .andExpect(header().string("Cache-Control", "no-store"));
        mvc.perform(put("/api/me/wishlist/1?userId=user_b").with(jwt().jwt(j -> j.subject("user_a"))))
            .andExpect(status().isNoContent());
        mvc.perform(delete("/api/me/wishlist/1?userId=user_b").with(jwt().jwt(j -> j.subject("user_a"))))
            .andExpect(status().isNoContent());
        verify(repository).findAll("user_a");
        verify(repository).add("user_a", 1L);
        verify(repository).remove("user_a", 1L);
    }

    @Test
    void missingCourseReturns404() throws Exception {
        doThrow(new ResourceNotFoundException("Course not found")).when(repository).add("user_a", 99L);
        mvc.perform(put("/api/me/wishlist/99").with(jwt().jwt(j -> j.subject("user_a"))))
            .andExpect(status().isNotFound());
    }
}
