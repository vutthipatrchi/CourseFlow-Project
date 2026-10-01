package com.courseflow.health;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

class DatabaseKeepAliveTests {
    @Test
    void pingSelectsOneRowFromTheDatabase() {
        JdbcTemplate jdbc = org.mockito.Mockito.mock(JdbcTemplate.class);
        when(jdbc.queryForObject("SELECT 1", Integer.class)).thenReturn(1);

        new DatabaseKeepAlive(jdbc).ping();

        verify(jdbc).queryForObject("SELECT 1", Integer.class);
    }
}
