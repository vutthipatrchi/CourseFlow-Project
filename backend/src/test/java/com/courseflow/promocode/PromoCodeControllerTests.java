package com.courseflow.promocode;

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
import java.math.BigDecimal;
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
import tools.jackson.databind.ObjectMapper;

@WebMvcTest(PromoCodeController.class)
@Import(SecurityConfig.class)
@ActiveProfiles("test")
class PromoCodeControllerTests {

    @Autowired
    private MockMvc mvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PromoCodeService promoCodeService;

    private PromoCode samplePromoCode() {
        return new PromoCode(
            1L, "NEWYEAR200", BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(200),
            List.of(), OffsetDateTime.now(), OffsetDateTime.now());
    }

    @Test
    void createsPromoCodeAndReturns201WithLocation() throws Exception {
        var request = new PromoCodeRequest(
            "NEWYEAR200", BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(200), List.of());
        when(promoCodeService.create(any())).thenReturn(samplePromoCode());

        mvc.perform(post("/api/admin/promo-codes")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location", "/api/admin/promo-codes/1"))
            .andExpect(jsonPath("$.code").value("NEWYEAR200"));
    }

    @Test
    void rejectsBlankCode() throws Exception {
        var request = new PromoCodeRequest(
            "", BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(200), List.of());

        mvc.perform(post("/api/admin/promo-codes")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.code").exists());
    }

    @Test
    void rejectsSpecialCharactersInCode() throws Exception {
        var request = new PromoCodeRequest(
            "NEW YEAR!", BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(200), List.of());

        mvc.perform(post("/api/admin/promo-codes")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.code").exists());
    }

    @Test
    void rejectsPercentDiscountOver100() throws Exception {
        var request = new PromoCodeRequest(
            "SAVE150", BigDecimal.valueOf(500), "percent", BigDecimal.valueOf(150), List.of());

        mvc.perform(post("/api/admin/promo-codes")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void rejectsFixedDiscountAboveMinimumPurchase() throws Exception {
        var request = new PromoCodeRequest(
            "TOOBIG", BigDecimal.valueOf(100), "fixed", BigDecimal.valueOf(150), List.of());

        mvc.perform(post("/api/admin/promo-codes")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest());
    }

    @Test
    void returns400WithFieldErrorWhenCodeIsDuplicate() throws Exception {
        var request = new PromoCodeRequest(
            "NEWYEAR200", BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(200), List.of());
        when(promoCodeService.create(any())).thenThrow(new DuplicatePromoCodeException("NEWYEAR200"));

        mvc.perform(post("/api/admin/promo-codes")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.fieldErrors.code").exists());
    }

    @Test
    void returnsAllPromoCodes() throws Exception {
        when(promoCodeService.findAll()).thenReturn(List.of(samplePromoCode()));

        mvc.perform(get("/api/admin/promo-codes").with(jwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].code").value("NEWYEAR200"));
    }

    @Test
    void returnsOnePromoCodeById() throws Exception {
        when(promoCodeService.findById(1L)).thenReturn(samplePromoCode());

        mvc.perform(get("/api/admin/promo-codes/1").with(jwt()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.code").value("NEWYEAR200"));
    }

    @Test
    void returns404WhenPromoCodeToFetchIsMissing() throws Exception {
        when(promoCodeService.findById(999L))
            .thenThrow(new ResourceNotFoundException("Promo code 999 not found"));

        mvc.perform(get("/api/admin/promo-codes/999").with(jwt()))
            .andExpect(status().isNotFound());
    }

    @Test
    void updatesPromoCodeAndReturnsIt() throws Exception {
        var request = new PromoCodeRequest(
            "NEWYEAR300", BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(300), List.of());
        when(promoCodeService.update(eq(1L), any())).thenReturn(samplePromoCode());

        mvc.perform(put("/api/admin/promo-codes/1")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk());
    }

    @Test
    void returns404WhenUpdatingMissingPromoCode() throws Exception {
        var request = new PromoCodeRequest(
            "NEWYEAR300", BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(300), List.of());
        when(promoCodeService.update(eq(999L), any()))
            .thenThrow(new ResourceNotFoundException("Promo code 999 not found"));

        mvc.perform(put("/api/admin/promo-codes/999")
                .with(jwt())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNotFound());
    }

    @Test
    void deletesPromoCodeAndReturns204() throws Exception {
        doNothing().when(promoCodeService).delete(1L);

        mvc.perform(delete("/api/admin/promo-codes/1").with(jwt()))
            .andExpect(status().isNoContent());
    }

    @Test
    void returns404WhenDeletingMissingPromoCode() throws Exception {
        doThrow(new ResourceNotFoundException("Promo code 999 not found"))
            .when(promoCodeService).delete(999L);

        mvc.perform(delete("/api/admin/promo-codes/999").with(jwt()))
            .andExpect(status().isNotFound());
    }
}
