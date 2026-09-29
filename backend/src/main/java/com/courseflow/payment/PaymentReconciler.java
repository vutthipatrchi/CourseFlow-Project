package com.courseflow.payment;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
@Profile("!standalone")
@ConditionalOnProperty(name = "courseflow.payment.reconciliation.enabled", havingValue = "true", matchIfMissing = true)
class PaymentReconciler {
    private final PaymentService payments;
    PaymentReconciler(PaymentService payments) { this.payments = payments; }

    @Scheduled(fixedDelayString = "${courseflow.payment.reconciliation.delay-ms:60000}", initialDelay = 60000)
    void reconcile() { payments.reconcileOutstanding(); }
}