package com.courseflow.health;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

/**
 * Runs while this process stays up. Vercel sleeps between requests, so production
 * also calls {@code GET /api/health/database} from {@code backend/vercel.json}.
 */
@Configuration
@EnableScheduling
@Profile("!standalone")
class DatabaseKeepAliveJob {
    private final DatabaseKeepAlive keepAlive;

    DatabaseKeepAliveJob(DatabaseKeepAlive keepAlive) {
        this.keepAlive = keepAlive;
    }

    @Scheduled(cron = "${courseflow.database.keepalive.cron:0 0 8 * * *}")
    void ping() {
        keepAlive.ping();
    }
}
