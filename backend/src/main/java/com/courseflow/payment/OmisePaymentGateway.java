package com.courseflow.payment;

import co.omise.Client;
import co.omise.models.Charge;
import co.omise.models.ChargeStatus;
import co.omise.models.AuthenticationType;
import co.omise.models.OmiseException;
import co.omise.models.ScopedList;
import co.omise.models.Source;
import co.omise.models.SourceType;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
final class OmisePaymentGateway implements PaymentGateway {
    private final String publicKey;
    private final String secretKey;
    private final String checkoutBaseUrl;
    private final HttpClient httpClient = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NEVER).build();
    private volatile Client client;

    OmisePaymentGateway(
        @Value("${courseflow.payment.omise.public-key:}") String publicKey,
        @Value("${courseflow.payment.omise.secret-key:}") String secretKey,
        @Value("${courseflow.payment.checkout-base-url:http://localhost:5173}") String checkoutBaseUrl
    ) {
        this.publicKey = publicKey.trim();
        this.secretKey = secretKey.trim();
        this.checkoutBaseUrl = checkoutBaseUrl.replaceAll("/+$", "");
        URI base = URI.create(this.checkoutBaseUrl);
        if (base.getHost() == null || base.getQuery() != null || base.getFragment() != null
            || base.getUserInfo() != null || !(base.getScheme().equals("https")
            || (base.getScheme().equals("http") && (base.getHost().equals("localhost") || base.getHost().equals("127.0.0.1"))))) {
            throw new IllegalArgumentException("CHECKOUT_BASE_URL must be HTTPS (or HTTP localhost for testing)");
        }
        if (this.secretKey.startsWith("skey_live_") && !base.getScheme().equals("https")) {
            throw new IllegalArgumentException("Live payments require an HTTPS CHECKOUT_BASE_URL");
        }
    }

    @Override
    public boolean enabled() {
        return publicKey.matches("pkey_(test|live)_[A-Za-z0-9]+")
            && secretKey.matches("skey_(test|live)_[A-Za-z0-9]+")
            && publicKey.startsWith("pkey_test_") == secretKey.startsWith("skey_test_");
    }

    @Override
    public String publicKey() { return enabled() ? publicKey : ""; }

    @Override
    public ProviderCharge createCardCharge(UUID orderId, UUID paymentId, String reference, long amount,
        String currency, String cardToken, Instant expiresAt) {
        try {
            var request = new Charge.CreateRequestBuilder().amount(amount).currency(currency).card(cardToken)
                .capture(true).authentication(AuthenticationType.THREE_DS).description("CourseFlow order " + reference)
                .returnUri(checkoutBaseUrl + "/payment/status?paymentId=" + paymentId)
                .metadata(Map.of("orderId", orderId.toString(), "paymentId", paymentId.toString())).build();
            return snapshot(client().sendRequest(request));
        } catch (OmiseException error) {
            throw creationError(error);
        } catch (Exception error) {
            throw new PaymentProviderException("Unable to create card charge", error);
        }
    }

    @Override
    public ProviderCharge createPromptPayCharge(UUID orderId, UUID paymentId, String reference, long amount,
        String currency, Instant expiresAt) {
        try {
            Source source = client().sendRequest(new Source.CreateRequestBuilder()
                .amount(amount).currency(currency).type(SourceType.PromptPay).build());
            var request = new Charge.CreateRequestBuilder().amount(amount).currency(currency).source(source.getId())
                .description("CourseFlow order " + reference)
                .expiresAt(ZonedDateTime.ofInstant(expiresAt, ZoneOffset.UTC))
                .metadata(Map.of("orderId", orderId.toString(), "paymentId", paymentId.toString())).build();
            return snapshot(client().sendRequest(request));
        } catch (OmiseException error) {
            throw creationError(error);
        } catch (Exception error) {
            throw new PaymentProviderException("Unable to create PromptPay charge", error);
        }
    }

    private PaymentProviderException creationError(OmiseException error) {
        int status = error.getHttpStatusCode();
        // Only explicit client rejections can release the reservation. Timeouts/5xx stay under review.
        if (status >= 400 && status < 500 && status != 408 && status != 409 && status != 429) {
            return new PaymentProviderRejectedException(error);
        }
        return new PaymentProviderException("Provider result is unknown", error);
    }

    @Override
    public ProviderCharge retrieveCharge(String id) {
        if (!id.matches("chrg_(test_)?[A-Za-z0-9]+")) throw new IllegalArgumentException("Invalid charge ID");
        try { return snapshot(client().sendRequest(new Charge.GetRequestBuilder(id).build())); }
        catch (Exception error) { throw new PaymentProviderException("Unable to retrieve charge", error); }
    }

    @Override
    public Optional<ProviderCharge> findCharge(UUID paymentId, Instant createdAt) {
        try {
            // Scan a bounded creation window, not all account history. Never recreate a missing charge.
            for (int offset = 0; offset < 1000; offset += 100) {
                var options = new ScopedList.Options().limit(100).offset(offset)
                    .from(ZonedDateTime.ofInstant(createdAt.minusSeconds(120), ZoneOffset.UTC))
                    .to(ZonedDateTime.ofInstant(createdAt.plusSeconds(3600), ZoneOffset.UTC));
                var page = client().sendRequest(new Charge.ListRequestBuilder().options(options).build());
                for (Charge charge : page.getData()) {
                    if (charge.getMetadata() != null && paymentId.toString().equals(charge.getMetadata().get("paymentId"))) {
                        return Optional.of(snapshot(charge));
                    }
                }
                if (page.getData().size() < 100) break;
            }
            return Optional.empty();
        } catch (Exception error) { throw new PaymentProviderException("Unable to reconcile charge", error); }
    }

    @Override
    public DownloadedQr downloadQr(String url) {
        URI uri = trustedProviderUri(url);
        try {
            var response = httpClient.send(HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(15)).GET().build(),
                HttpResponse.BodyHandlers.ofByteArray());
            String contentType = response.headers().firstValue("content-type").orElse("").split(";")[0].trim();
            if (response.statusCode() != 200 || !java.util.Set.of("image/png", "image/svg+xml", "image/jpeg").contains(contentType)) {
                throw new PaymentProviderException("Unable to download QR image");
            }
            return new DownloadedQr(response.body(), contentType);
        } catch (InterruptedException error) {
            Thread.currentThread().interrupt();
            throw new PaymentProviderException("QR download interrupted", error);
        } catch (java.io.IOException error) { throw new PaymentProviderException("Unable to download QR image", error); }
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

    static URI trustedProviderUri(String url) {
        URI uri = URI.create(url);
        if (!"https".equalsIgnoreCase(uri.getScheme()) || !"api.omise.co".equalsIgnoreCase(uri.getHost())
            || uri.getUserInfo() != null || (uri.getPort() != -1 && uri.getPort() != 443)) {
            throw new PaymentProviderException("Unexpected provider URL");
        }
        return uri;
    }

    static ProviderCharge snapshot(Charge charge) {
        String qr = null;
        if (charge.getSource() != null && charge.getSource().getScannableCode() != null
            && charge.getSource().getScannableCode().getImage() != null) {
            qr = trustedProviderUri(charge.getSource().getScannableCode().getImage().getDownloadUri()).toString();
        }
        String authorize = charge.getAuthorizeUri() == null ? null : trustedProviderUri(charge.getAuthorizeUri()).toString();
        PaymentStatus status = PaymentStatus.REVIEW;
        if (charge.getStatus() == ChargeStatus.Successful && charge.isPaid()) status = PaymentStatus.SUCCESSFUL;
        else if (charge.getStatus() == ChargeStatus.Failed) status = PaymentStatus.FAILED;
        else if (charge.getStatus() == ChargeStatus.Expired) status = PaymentStatus.EXPIRED;
        else if (charge.getStatus() == ChargeStatus.Pending) status = PaymentStatus.PENDING;
        Map<String, Object> metadata = charge.getMetadata() == null ? Map.of() : charge.getMetadata();
        return new ProviderCharge(charge.getId(), status, charge.getAmount(), charge.getCurrency(), qr, authorize,
            charge.getFailureMessage(), metadataId(metadata.get("orderId")), metadataId(metadata.get("paymentId")));
    }

    private static UUID metadataId(Object value) {
        try { return value == null ? null : UUID.fromString(value.toString()); }
        catch (IllegalArgumentException invalid) { return null; }
    }
}
