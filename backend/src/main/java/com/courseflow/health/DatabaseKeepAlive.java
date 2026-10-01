package com.courseflow.health;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** One cheap query so an idle Supabase project still sees database traffic. */
@Component
@Profile("!standalone")
public class DatabaseKeepAlive {
    private static final Logger log = LoggerFactory.getLogger(DatabaseKeepAlive.class);
    private final JdbcTemplate jdbc;

    public DatabaseKeepAlive(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void ping() {
        jdbc.queryForObject("SELECT 1", Integer.class);
        log.info("Database keepalive query succeeded");
    }
}
