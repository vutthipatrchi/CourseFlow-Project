package com.courseflow.payment;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

final class CatalogCourseTiming {
    static final String REQUEST_ID = "catalogCoursesRequestId";
    private static final Logger log = LoggerFactory.getLogger(CatalogCourseTiming.class);

    private CatalogCourseTiming() {}

    static void log(String stage, long startedAtNanos, boolean success) {
        if (!log.isDebugEnabled()) return;
        double elapsedMs = (System.nanoTime() - startedAtNanos) / 1_000_000.0;
        log.debug("catalog-courses requestId={} stage={} elapsedMs={} status={}",
            MDC.get(REQUEST_ID), stage, elapsedMs, success ? "ok" : "error");
    }
}
