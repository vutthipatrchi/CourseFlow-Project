package com.courseflow.payment;

import co.omise.Client;
import co.omise.models.Charge;
import co.omise.models.ChargeStatus;
import co.omise.models.Source;
import co.omise.models.SourceType;
import co.omise.requests.Request;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
final class OmisePaymentGateway implements PaymentGateway {
    private final String publicKey;
    private final String secretKey;
    private final HttpClient httpClient = HttpClient.newBuilder().followRedirects(HttpClient.Redirect.NORMAL).build();
    private volatile Client client;

    OmisePaymentGateway(
        @Value("${courseflow.payment.omise.public-key:}") String publicKey,
        @Value("${courseflow.payment.omise.secret-key:}") String secretKey
    ) {
        this.publicKey = publicKey.trim();
        this.secretKey = secretKey.trim();
    }

    @Override
    public boolean enabled() { return !publicKey.isBlank() && !secretKey.isBlank(); }

    @Override
    public String publicKey() { return enabled() ? publicKey : ""; }

    @Override
    public ProviderCharge createCardCharge(
        UUID orderId, UUID paymentId, String reference, long amountSatang,
        String currency, String cardToken, String returnUri, Instant expiresAt
    ) {
        try {
            Request<Charge> request = new Charge.CreateRequestBuilder()
                .amount(amountSatang)
                .currency(currency)
                .card(cardToken)
                .description("CourseFlow order " + reference)
                .returnUri(returnUri)
                .expiresAt(ZonedDateTime.ofInstant(expiresAt, ZoneOffset.UTC))
                .metadata(Map.of("orderId", orderId.toString(), "paymentId", paymentId.toString()))
                .build();
            return snapshot(client().sendRequest(request));
        } catch (Exception error) {
            throw new PaymentProviderException("Unable to create card charge", error);
        }
    }

    @Override
    public ProviderCharge createPromptPayCharge(
        UUID orderId, UUID paymentId, String reference, long amountSatang,
        String currency, Instant expiresAt
    ) {
        try {
            Request<Source> sourceRequest = new Source.CreateRequestBuilder()
                .amount(amountSatang)
                .currency(currency)
                .type(SourceType.PromptPay)
                .build();
            Source source = client().sendRequest(sourceRequest);
            Request<Charge> chargeRequest = new Charge.CreateRequestBuilder()
                .amount(amountSatang)
                .currency(currency)
                .source(source.getId())
                .description("CourseFlow order " + reference)
                .expiresAt(ZonedDateTime.ofInstant(expiresAt, ZoneOffset.UTC))
                .metadata(Map.of("orderId", orderId.toString(), "paymentId", paymentId.toString()))
                .build();
            return snapshot(client().sendRequest(chargeRequest));
        } catch (Exception error) {
            throw new PaymentProviderException("Unable to create PromptPay charge", error);
        }
    }

    @Override
    public ProviderCharge retrieveCharge(String chargeId) {
        try {
            return snapshot(client().sendRequest(new Charge.GetRequestBuilder(chargeId).build()));
        } catch (Exception error) {
            throw new PaymentProviderException("Unable to retrieve charge", error);
        }
    }

    @Override
    public DownloadedQr downloadQr(String imageUrl) {
        URI uri = URI.create(imageUrl);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || !"api.omise.co".equalsIgnoreCase(uri.getHost())) {
            throw new PaymentProviderException("Unexpected QR image host");
        }
        try {
            var response = httpClient.send(
                HttpRequest.newBuilder(uri).GET().build(),
                HttpResponse.BodyHandlers.ofByteArray()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new PaymentProviderException("Unable to download QR image");
            }
            String contentType = response.headers().firstValue("content-type").orElse("image/png");
            return new DownloadedQr(response.body(), contentType);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new PaymentProviderException("QR download interrupted", error);
        } catch (java.io.IOException error) {
            throw new PaymentProviderException("Unable to download QR image", error);
        }
    }

    private Client client() throws Exception {
        if (!enabled()) throw new PaymentProviderUnavailableException();
        Client current = client;
        if (current == null) {
            synchronized (this) {
                current = client;
                if (current == null) {
                    current = new Client.Builder().publicKey(publicKey).secretKey(secretKey).build();
                    client = current;
                }
            }
        }
        return current;
    }

    private ProviderCharge snapshot(Charge charge) {
        String qrUrl = null;
        if (charge.getSource() != null && charge.getSource().getScannableCode() != null
            && charge.getSource().getScannableCode().getImage() != null) {
            qrUrl = charge.getSource().getScannableCode().getImage().getDownloadUri();
        }
        return new ProviderCharge(
            charge.getId(), mapStatus(charge.getStatus()), charge.getAmount(), charge.getCurrency(),
            qrUrl, charge.getAuthorizeUri(), charge.getFailureMessage()
        );
    }

    private PaymentStatus mapStatus(ChargeStatus status) {
        if (status == ChargeStatus.Successful) return PaymentStatus.SUCCESSFUL;
        if (status == ChargeStatus.Failed) return PaymentStatus.FAILED;
        if (status == ChargeStatus.Expired) return PaymentStatus.EXPIRED;
        if (status == ChargeStatus.Pending) return PaymentStatus.PENDING;
        return PaymentStatus.REVIEW;
    }
}
