package com.courseflow.promocode;

import static org.assertj.core.api.Assertions.assertThat;

import com.courseflow.course.CourseRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("local")
@EnabledIfSystemProperty(named = "spring.profiles.active", matches = "local")
class PromoCodeRepositoryTests {

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    @Autowired
    private CourseRepository courseRepository;

    private String uniqueCode() {
        return "TEST" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    @Test
    void insertsAndReadsBackAPromoCodeWithNoCourses() {
        var code = uniqueCode();
        var request = new PromoCodeRequest(
            code, BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(200), List.of());

        var created = promoCodeRepository.create(request);

        assertThat(created.code()).isEqualTo(code);
        assertThat(created.courseIds()).isEmpty();
        assertThat(promoCodeRepository.findById(created.id())).isPresent();
    }

    @Test
    void insertsAndReadsBackAPromoCodeWithSpecificCourses() {
        long courseId = courseRepository.findAll().get(0).id();
        var request = new PromoCodeRequest(
            uniqueCode(), BigDecimal.valueOf(500), "percent", BigDecimal.valueOf(10), List.of(courseId));

        var created = promoCodeRepository.create(request);

        assertThat(created.courseIds()).containsExactly(courseId);
    }

    @Test
    void updateReplacesFieldsAndCourseList() {
        long courseId = courseRepository.findAll().get(0).id();
        var created = promoCodeRepository.create(new PromoCodeRequest(
            uniqueCode(), BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(100), List.of()));

        var updated = promoCodeRepository.update(created.id(), new PromoCodeRequest(
            created.code(), BigDecimal.valueOf(1000), "percent", BigDecimal.valueOf(20), List.of(courseId)));

        assertThat(updated).isPresent();
        assertThat(updated.get().discountType()).isEqualTo("percent");
        assertThat(updated.get().courseIds()).containsExactly(courseId);
    }

    @Test
    void updatingAMissingPromoCodeReturnsEmpty() {
        var result = promoCodeRepository.update(-1L, new PromoCodeRequest(
            uniqueCode(), BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(100), List.of()));

        assertThat(result).isEmpty();
    }

    @Test
    void isCodeTakenIsCaseInsensitiveAndExcludesItsOwnId() {
        var created = promoCodeRepository.create(new PromoCodeRequest(
            uniqueCode(), BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(100), List.of()));

        assertThat(promoCodeRepository.isCodeTaken(created.code().toLowerCase(), null)).isTrue();
        assertThat(promoCodeRepository.isCodeTaken(created.code(), created.id())).isFalse();
    }

    @Test
    void deletesPromoCodeSoItNoLongerReadsBack() {
        var created = promoCodeRepository.create(new PromoCodeRequest(
            uniqueCode(), BigDecimal.valueOf(500), "fixed", BigDecimal.valueOf(100), List.of()));

        boolean deleted = promoCodeRepository.delete(created.id());

        assertThat(deleted).isTrue();
        assertThat(promoCodeRepository.findById(created.id())).isEmpty();
    }

    @Test
    void deletingAMissingPromoCodeReturnsFalse() {
        assertThat(promoCodeRepository.delete(-1L)).isFalse();
    }
}
