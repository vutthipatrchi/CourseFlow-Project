package com.courseflow.payment;

import java.time.Instant;
import java.util.UUID;

interface PaymentGateway {
    boolean enabled();
    String publicKey();
    ProviderCharge createCardCharge(
        UUID orderId, UUID paymentId, String reference, long amountSatang,
        String currency, String cardToken, String returnUri, Instant expiresAt
    );
    ProviderCharge createPromptPayCharge(
        UUID orderId, UUID paymentId, String reference, long amountSatang,
        String currency, Instant expiresAt
    );
    ProviderCharge retrieveCharge(String chargeId);
    DownloadedQr downloadQr(String imageUrl);
}
