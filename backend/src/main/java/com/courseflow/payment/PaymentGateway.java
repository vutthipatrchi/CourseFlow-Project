package com.courseflow.payment;

import java.time.Instant;
import java.util.UUID;
import java.util.Optional;

interface PaymentGateway {
    boolean enabled();
    String publicKey();
    ProviderCharge createCardCharge(
        UUID orderId, UUID paymentId, String reference, long amountSatang,
        String currency, String cardToken, Instant expiresAt
    );
    ProviderCharge createPromptPayCharge(
        UUID orderId, UUID paymentId, String reference, long amountSatang,
        String currency, Instant expiresAt
    );
    ProviderCharge retrieveCharge(String chargeId);
    Optional<ProviderCharge> findCharge(UUID paymentId, Instant createdAt);
    DownloadedQr downloadQr(String imageUrl);
}
