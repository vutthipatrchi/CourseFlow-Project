package com.courseflow.payment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;

// Opt in only against an isolated PostgreSQL database; never uses the app's .env file.
@SpringBootTest(properties = {
    "spring.config.location=classpath:application-local.properties",
    "spring.flyway.locations=classpath:db/migration",
    "spring.flyway.target=18",
    "spring.flyway.validate-on-migrate=true",
    "spring.flyway.out-of-order=false"
})
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@EnabledIfSystemProperty(named = "courseflow.test.catalog-migrations", matches = "true")
class CatalogCourseDetailsMigrationTests {
    @Autowired private Flyway flyway;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private PaymentRepository repository;
    @Autowired private MockMvc mvc;
    @MockitoBean private JwtDecoder decoder;

    @BeforeAll
    void upgradeFromVersion18() {
        assertThat(flyway.info().current().getVersion().getVersion()).isEqualTo("18");
        jdbc.update("""
            UPDATE courseflow.courses
            SET summary = ?, description = ?
            WHERE name = 'Service Design Essentials'
            """, "Admin-edited summary", "Admin-edited course description.");
        jdbc.update("""
            INSERT INTO courseflow.courses (name, price)
            VALUES ('Custom course outside seeded catalog', 100)
            """);

        var result = Flyway.configure()
            .configuration(flyway.getConfiguration())
            .target("19")
            .load()
            .migrate();

        assertThat(result.migrationsExecuted).isEqualTo(1);
        assertThat(jdbc.queryForObject("""
            SELECT COUNT(*) FROM public.flyway_schema_history
            WHERE version = '19' AND success
            """, Integer.class)).isEqualTo(1);
    }

    @Test
    void publicCatalogReturnsDatabaseDetailsForEverySeededCourse() throws Exception {
        var courses = repository.listCheckoutCourses().stream()
            .filter(course -> !course.name().equals("Custom course outside seeded catalog"))
            .toList();
        assertThat(courses).hasSize(10);
        for (var course : courses) {
            assertThat(course.summary()).as(course.name() + " summary").isNotBlank();
            assertThat(course.description()).as(course.name() + " description").isNotBlank();
            mvc.perform(get("/api/catalog/courses/" + course.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary").value(course.summary()))
                .andExpect(jsonPath("$.description").value(course.description()));
        }
        mvc.perform(get("/api/catalog/courses"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(11));
    }

    @Test
    void upgradePreservesAdminCopyAndDoesNotInventDetailsForCustomCourses() {
        var serviceDesign = findByName("Service Design Essentials");
        assertThat(serviceDesign.summary()).isEqualTo("Admin-edited summary");
        assertThat(serviceDesign.description()).isEqualTo("Admin-edited course description.");
        var software = findByName("Software Developer");
        assertThat(software.summary())
            .isEqualTo("Build a solid foundation in programming and modern software development.");
        assertThat(software.description()).contains("Start with the tools and habits");
        var custom = findByName("Custom course outside seeded catalog");
        assertThat(custom.summary()).isNull();
        assertThat(custom.description()).isNull();
    }

    @Test
    void backfillHandlesNullEmptyAndWhitespaceFieldsIndependently() {
        jdbc.update("""
            UPDATE courseflow.courses SET summary = '   ', description = ''
            WHERE name = 'Product Strategy'
            """);
        jdbc.update("""
            UPDATE courseflow.courses SET summary = ?, description = NULL
            WHERE name = 'Leadership Essentials'
            """, "Custom leadership summary");
        jdbc.update("""
            UPDATE courseflow.courses SET summary = NULL, description = ?
            WHERE name = 'Data Analytics Foundations'
            """, "Custom analytics description");

        runBackfill();

        var product = findByName("Product Strategy");
        assertThat(product.summary()).contains("Define a clear product direction");
        assertThat(product.description()).contains("product vision", "roadmap");
        var leadership = findByName("Leadership Essentials");
        assertThat(leadership.summary()).isEqualTo("Custom leadership summary");
        assertThat(leadership.description()).contains("shared outcome");
        var analytics = findByName("Data Analytics Foundations");
        assertThat(analytics.summary()).contains("Turn raw data into useful insights");
        assertThat(analytics.description()).isEqualTo("Custom analytics description");
    }

    @Test
    void rerunningBackfillLeavesCompleteCoursesUntouched() {
        var before = jdbc.queryForList("""
            SELECT id, summary, description, updated_at
            FROM courseflow.courses ORDER BY id
            """);
        runBackfill();
        assertThat(jdbc.queryForList("""
            SELECT id, summary, description, updated_at
            FROM courseflow.courses ORDER BY id
            """)).isEqualTo(before);
    }

    private CheckoutCourse findByName(String name) {
        return repository.listCheckoutCourses().stream()
            .filter(course -> course.name().equals(name))
            .findFirst().orElseThrow();
    }

    private void runBackfill() {
        jdbc.execute((ConnectionCallback<Void>) connection -> {
            ScriptUtils.executeSqlScript(connection,
                new ClassPathResource("db/migration/V19__add_catalog_course_details.sql"));
            return null;
        });
    }
}
