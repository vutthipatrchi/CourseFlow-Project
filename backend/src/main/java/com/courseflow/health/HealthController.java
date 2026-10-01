package com.courseflow.health;

import java.util.Map;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    private final ObjectProvider<DatabaseKeepAlive> keepAlive;

    public HealthController(ObjectProvider<DatabaseKeepAlive> keepAlive) {
        this.keepAlive = keepAlive;
    }

    @GetMapping("/api/health")
    public Map<String, String> health() {
        return Map.of("status", "UP", "application", "CourseFlow");
    }

    /** Public on purpose: Vercel Cron wakes the app with a GET and must not send a user token. */
    @GetMapping("/api/health/database")
    public Map<String, String> database() {
        DatabaseKeepAlive ping = keepAlive.getIfAvailable();
        if (ping == null) {
            return Map.of("status", "UP", "database", "skipped");
        }
        ping.ping();
        return Map.of("status", "UP", "database", "UP");
    }
}
