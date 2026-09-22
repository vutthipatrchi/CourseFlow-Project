package com.courseflow.payment;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.courseflow.config.SecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(PaymentController.class)
@ActiveProfiles("test")
@Import(SecurityConfig.class)
class PaymentControllerTests {
    @Autowired private MockMvc mvc;
    @MockitoBean private PaymentService payments;
    @MockitoBean private JwtDecoder decoder;

    @Test
    void anonymousCustomersCannotCreateOrders() throws Exception {
        mvc.perform(post("/api/orders").contentType(MediaType.APPLICATION_JSON).content("{\"courseId\":1}"))
            .andExpect(status().isUnauthorized());
        verify(payments, never()).createOrder(any(), any(), any());
    }

    @Test
    void identityComesFromJwtRatherThanPostedUserId() throws Exception {
        mvc.perform(post("/api/orders").with(jwt().jwt(j -> j.subject("user_buyer")))
            .contentType(MediaType.APPLICATION_JSON).content("{\"courseId\":1,\"customerSubject\":\"user_other\"}"))
            .andExpect(status().isOk());
        verify(payments).createOrder("user_buyer", 1L, null);
    }

    @Test
    void webhookAcceptsTypedJsonWithoutAUserSession() throws Exception {
        mvc.perform(post("/api/webhooks/opn").contentType(MediaType.APPLICATION_JSON)
            .content("{\"id\":\"evnt_test_123\",\"key\":\"charge.complete\",\"data\":{\"id\":\"chrg_test_123\",\"status\":\"successful\"}}"))
            .andExpect(status().isNoContent());
        verify(payments).handleWebhook("evnt_test_123", "charge.complete", "chrg_test_123");
    }

    @Test
    void malformedWebhookAndInvalidPromotionAreRejected() throws Exception {
        mvc.perform(post("/api/webhooks/opn").contentType(MediaType.APPLICATION_JSON).content("{\"id\":\"fake\"}"))
            .andExpect(status().isBadRequest());
        mvc.perform(post("/api/orders").with(jwt()).contentType(MediaType.APPLICATION_JSON)
            .content("{\"courseId\":1,\"promotionCode\":\"<script>\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void subscriptionsAreScopedToSignedInBuyer() throws Exception {
        mvc.perform(get("/api/me/subscriptions").with(jwt().jwt(j -> j.subject("user_buyer"))))
            .andExpect(status().isOk());
        verify(payments).subscriptions("user_buyer");
    }
}