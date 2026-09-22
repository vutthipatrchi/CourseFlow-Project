package com.courseflow.payment;

import static org.assertj.core.api.Assertions.assertThat;

import com.courseflow.course.Course;
import com.courseflow.course.CourseRepository;
import com.courseflow.promocode.PromoCodeRepository;
import com.courseflow.promocode.PromoCodeRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("local")
@Transactional
@EnabledIfSystemProperty(named = "spring.profiles.active", matches = "local")
class PaymentPromotionRepositoryTests {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private PromoCodeRepository promoCodeRepository;

    @Autowired
    private CourseRepository courseRepository;

    private Course firstCourse;
    private Course secondCourse;

    @BeforeEach
    void loadCourses() {
        var courses = courseRepository.findAll();
        assertThat(courses).hasSizeGreaterThanOrEqualTo(2);
        firstCourse = courses.get(0);
        secondCourse = courses.get(1);
    }

    @Test
    void appliesAdminFixedPromotionToAllCoursesCaseInsensitively() {
        String code = uniqueCode();
        promoCodeRepository.create(new PromoCodeRequest(
            code, BigDecimal.ZERO, "fixed", BigDecimal.valueOf(200), List.of()));

        long discount = paymentRepository.findPromotionDiscount(firstCourse.id(), code.toLowerCase());

        assertThat(discount).isEqualTo(20_000);
    }

    @Test
    void appliesAdminPercentPromotionToAnIncludedCourse() {
        String code = uniqueCode();
        promoCodeRepository.create(new PromoCodeRequest(
            code, BigDecimal.ZERO, "percent", BigDecimal.valueOf(20), List.of(firstCourse.id())));

        long discount = paymentRepository.findPromotionDiscount(firstCourse.id(), code);
        long expectedSatang = firstCourse.price()
            .multiply(BigDecimal.valueOf(20))
            .setScale(0, RoundingMode.HALF_UP)
            .longValueExact();

        assertThat(discount).isEqualTo(expectedSatang);
    }

    @Test
    void rejectsAdminPromotionForACourseOutsideItsScope() {
        String code = uniqueCode();
        promoCodeRepository.create(new PromoCodeRequest(
            code, BigDecimal.ZERO, "fixed", BigDecimal.valueOf(100), List.of(secondCourse.id())));

        assertThat(paymentRepository.findPromotionDiscount(firstCourse.id(), code)).isZero();
    }

    @Test
    void rejectsAdminPromotionBelowItsMinimumPurchase() {
        String code = uniqueCode();
        promoCodeRepository.create(new PromoCodeRequest(
            code, firstCourse.price().add(BigDecimal.ONE), "fixed", BigDecimal.valueOf(100), List.of()));

        assertThat(paymentRepository.findPromotionDiscount(firstCourse.id(), code)).isZero();
    }

    @Test
    void keepsLegacyCoursePromotionWorking() {
        assertThat(paymentRepository.findPromotionDiscount(1L, "course200")).isEqualTo(20_000);
    }

    private String uniqueCode() {
        return "PAY" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();
    }
}
