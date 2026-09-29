package com.courseflow.payment;

import static org.assertj.core.api.Assertions.*;
import co.omise.models.Charge;
import co.omise.models.ChargeStatus;
import java.net.URI;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class OmisePaymentGatewayTests {
    @Test
    void retainsThreeDsUrlAndTrustedMetadata() {
        UUID orderId = UUID.randomUUID();
        UUID paymentId = UUID.randomUUID();
        Charge charge = new Charge();
        charge.setId("chrg_test_123");
        charge.setStatus(ChargeStatus.Pending);
        charge.setAmount(355900);
        charge.setCurrency("thb");
        charge.setAuthorizeUri("https://api.omise.co/payments/paym_test_123/authorize");
        charge.setMetadata(Map.of("orderId", orderId.toString(), "paymentId", paymentId.toString()));
        ProviderCharge result = OmisePaymentGateway.snapshot(charge);
        assertThat(result.authorizeUrl()).endsWith("/authorize");
        assertThat(result.orderId()).isEqualTo(orderId);
        assertThat(result.paymentId()).isEqualTo(paymentId);
    }

    @Test
    void authorizationWithoutCaptureDoesNotGrantPaidStatus() {
        Charge charge = new Charge();
        charge.setStatus(ChargeStatus.Successful);
        charge.setPaid(false);
        assertThat(OmisePaymentGateway.snapshot(charge).status()).isEqualTo(PaymentStatus.REVIEW);
        charge.setPaid(true);
        assertThat(OmisePaymentGateway.snapshot(charge).status()).isEqualTo(PaymentStatus.SUCCESSFUL);
    }

    @Test
    void rejectsUntrustedUrlsAndMixedModes() {
        assertThatThrownBy(() -> OmisePaymentGateway.trustedProviderUri("https://api.omise.co.attacker.test/qr"))
            .isInstanceOf(PaymentProviderException.class);
        assertThat(new OmisePaymentGateway("pkey_test_abc", "skey_live_abc", "https://courseflow.example").enabled()).isFalse();
        assertThatThrownBy(() -> new OmisePaymentGateway("pkey_live_abc", "skey_live_abc", "http://localhost:5173"))
            .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void followsOnlyTheTrustedQrImageRedirect() {
        URI image = URI.create("https://omise-gateway-production.s3.ap-southeast-1.amazonaws.com/qr.svg");
        assertThat(OmisePaymentGateway.trustedQrRedirectUri(image)).isEqualTo(image);
        assertThatThrownBy(() -> OmisePaymentGateway.trustedQrRedirectUri(
            URI.create("http://omise-gateway-production.s3.ap-southeast-1.amazonaws.com/qr.svg")))
            .isInstanceOf(PaymentProviderException.class);
        assertThatThrownBy(() -> OmisePaymentGateway.trustedQrRedirectUri(
            URI.create("https://omise-gateway-production.s3.ap-southeast-1.amazonaws.com.attacker.test/qr.svg")))
            .isInstanceOf(PaymentProviderException.class);
    }
}
