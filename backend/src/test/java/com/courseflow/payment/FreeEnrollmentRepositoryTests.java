package com.courseflow.payment;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import com.courseflow.course.CourseRepository;
import com.courseflow.course.CourseRequest;
import com.courseflow.promocode.PromoCodeRepository;
import com.courseflow.promocode.PromoCodeRequest;
import com.courseflow.upload.CourseAssetAccessRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest(properties = {
    "spring.config.location=classpath:application-local.properties",
    "spring.flyway.locations=classpath:db/migration",
    "spring.flyway.validate-on-migrate=true",
    "spring.flyway.out-of-order=false"
})
@ActiveProfiles("local")
@EnabledIfSystemProperty(named = "spring.profiles.active", matches = "local")
@Transactional
class FreeEnrollmentRepositoryTests {
    @Autowired private PaymentService service;
    @Autowired private PaymentRepository payments;
    @Autowired private CourseRepository courses;
    @Autowired private PromoCodeRepository promotions;
    @Autowired private CourseAssetAccessRepository assets;
    @Autowired private JdbcTemplate jdbc;
    @MockitoBean private PaymentGateway gateway;
    @MockitoBean private JwtDecoder decoder;
    private Long courseId;
    private static final String RESOURCE = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.pdf";

    @BeforeEach
    void createCourse() {
        courseId = courses.create(new CourseRequest("Free enrollment " + UUID.randomUUID(),
            BigDecimal.valueOf(100), 1, "Course", false, "", null, null, null, "Summary", "Description",
            null, null, "/api/uploads/course-resources/" + RESOURCE, "#dce8fb",
            List.of(new CourseRequest.LessonRequest(null, "Introduction", 0)))).id();
    }

    @Test
    void freeCourseIsActivatedOnlyOnConfirmationAndRetriesDoNotDuplicateIt() {
        jdbc.update("UPDATE courseflow.courses SET price = 0 WHERE id = ?", courseId);
        var order = service.createOrder("free_student", courseId, "");
        assertThat(order.totalSatang()).isZero();
        assertThat(order.status()).isEqualTo("pending_payment");
        assertThat(service.enrollments("free_student")).isEmpty();
        assertThat(assets.canDownloadResource("free_student", RESOURCE)).isFalse();

        assertThat(service.completeFreeOrder(order.orderId(), "free_student").status()).isEqualTo("paid");
        assertThat(service.completeFreeOrder(order.orderId(), "free_student").status()).isEqualTo("paid");
        assertThat(service.createOrder("free_student", courseId, "").orderId()).isEqualTo(order.orderId());
        assertThat(service.enrollments("free_student")).hasSize(1);
        assertThat(service.courseProgress("free_student", courseId)).isNotNull();
        assertThat(assets.canDownloadResource("free_student", RESOURCE)).isTrue();
        assertThat(assets.canDownloadResource("another_student", RESOURCE)).isFalse();
        assertThat(assets.canDownloadResource("free_student", "other.pdf")).isFalse();
        jdbc.update("UPDATE courseflow.subscriptions SET status = 'cancelled' WHERE order_id = ?", order.orderId());
        assertThat(assets.canDownloadResource("free_student", RESOURCE)).isFalse();
        assertNoPayment(order.orderId());
    }

    @Test
    void fullPercentagePromotionCanEnrollWithoutProviderConfiguration() {
        String code = "FREE" + UUID.randomUUID().toString().substring(0, 8);
        promotions.create(new PromoCodeRequest(code, BigDecimal.ZERO, "percent", BigDecimal.valueOf(100), List.of(courseId)));
        var order = service.createOrder("promo_student", courseId, code);
        assertThat(order.subtotalSatang()).isEqualTo(10000);
        assertThat(order.discountSatang()).isEqualTo(10000);
        assertThat(order.totalSatang()).isZero();
        assertThat(service.completeFreeOrder(order.orderId(), "promo_student").status()).isEqualTo("paid");
        assertThat(service.enrollments("promo_student")).hasSize(1);
        assertNoPayment(order.orderId());
    }

    @Test
    void fixedPromotionIsCappedAtTheCoursePrice() {
        String code = "FREE" + UUID.randomUUID().toString().substring(0, 8);
        promotions.create(new PromoCodeRequest(code, BigDecimal.ZERO, "fixed", BigDecimal.valueOf(150), List.of(courseId)));
        var order = service.createOrder("fixed_student", courseId, code);
        assertThat(order.discountSatang()).isEqualTo(order.subtotalSatang());
        assertThat(service.completeFreeOrder(order.orderId(), "fixed_student").status()).isEqualTo("paid");
        assertNoPayment(order.orderId());
    }

    @Test
    void paidCoursesAndAnotherUsersOrdersCannotUseFreeEnrollment() {
        var paid = service.createOrder("buyer", courseId, "");
        assertThatThrownBy(() -> service.completeFreeOrder(paid.orderId(), "buyer")).isInstanceOf(CheckoutConflictException.class);
        assertThatThrownBy(() -> service.completeFreeOrder(paid.orderId(), "intruder")).isInstanceOf(CheckoutNotFoundException.class);
        assertThat(service.enrollments("buyer")).isEmpty();
        assertThat(payments.findOrder(paid.orderId(), false).orElseThrow().status()).isEqualTo(OrderStatus.PENDING_PAYMENT);
        assertNoPayment(paid.orderId());
    }

    @Test
    void expiredFreeOrdersCannotActivateAndZeroOrdersCannotCreateProviderPayments() {
        jdbc.update("UPDATE courseflow.courses SET price = 0 WHERE id = ?", courseId);
        var order = service.createOrder("buyer", courseId, "");
        assertThatThrownBy(() -> service.createPromptPayPayment(order.orderId(), "buyer", UUID.randomUUID())).isInstanceOf(CheckoutConflictException.class);
        assertThatThrownBy(() -> service.createCardPayment(order.orderId(), "buyer", UUID.randomUUID(), "tokn_test_123")).isInstanceOf(CheckoutConflictException.class);
        jdbc.update("UPDATE courseflow.orders SET expires_at = NOW() - INTERVAL '1 hour' WHERE id = ?", order.orderId());
        assertThatThrownBy(() -> service.completeFreeOrder(order.orderId(), "buyer")).isInstanceOf(CheckoutConflictException.class);
        assertThat(service.enrollments("buyer")).isEmpty();
        assertNoPayment(order.orderId());
    }

    private void assertNoPayment(UUID orderId) {
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM courseflow.payments WHERE order_id = ?", Long.class, orderId)).isZero();
        verify(gateway, never()).createCardCharge(any(), any(), anyString(), anyLong(), anyString(), any(), any());
        verify(gateway, never()).createPromptPayCharge(any(), any(), anyString(), anyLong(), anyString(), any());
    }
}
