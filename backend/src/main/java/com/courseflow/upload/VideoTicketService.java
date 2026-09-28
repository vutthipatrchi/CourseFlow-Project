package com.courseflow.upload;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

@Service
public class VideoTicketService {
    public static final String COOKIE_NAME = "cf_video_ticket";
    public static final Duration LIFETIME = Duration.ofMinutes(15);

    private final SecureRandom random = new SecureRandom();
    private final ConcurrentHashMap<String, Ticket> tickets = new ConcurrentHashMap<>();

    public String issue(String filename, String subject, boolean admin) {
        tickets.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(Instant.now()));
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        tickets.put(token, new Ticket(filename, subject, admin, Instant.now().plus(LIFETIME)));
        return token;
    }

    public Optional<Ticket> find(String token, String filename) {
        if (token == null || token.isBlank()) return Optional.empty();
        Ticket ticket = tickets.get(token);
        if (ticket == null || !ticket.filename().equals(filename)) return Optional.empty();
        if (!ticket.expiresAt().isAfter(Instant.now())) {
            tickets.remove(token);
            return Optional.empty();
        }
        return Optional.of(ticket);
    }

    public record Ticket(String filename, String subject, boolean admin, Instant expiresAt) {}
}
