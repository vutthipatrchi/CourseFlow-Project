package com.courseflow.upload;

import java.nio.file.Files;
import java.nio.file.Path;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/uploads")
@Profile("!standalone")
public class PublicUploadController {
    private static final Pattern VIDEO_FILENAME = Pattern.compile("[A-Za-z0-9_-]+\\.(mp4|webm|mov|m4v)");

    private final LocalVideoStorage storage;
    private final VideoAccessRepository access;
    private final VideoTicketService tickets;

    public PublicUploadController(LocalVideoStorage storage, VideoAccessRepository access, VideoTicketService tickets) {
        this.storage = storage;
        this.access = access;
        this.tickets = tickets;
    }

    @PostMapping("/videos/{filename}/access")
    public ResponseEntity<Void> grantAccess(@PathVariable String filename, @AuthenticationPrincipal Jwt jwt,
                                            HttpServletRequest request) {
        if (!validFilename(filename) || storage.resolvePublicFile("videos/" + filename) == null) {
            return ResponseEntity.notFound().build();
        }

        Object metadata = jwt.getClaim("metadata");
        boolean isAdmin = metadata instanceof Map<?, ?> claims && "admin".equals(claims.get("role"));
        if (!isAdmin && !access.hasActiveSubscription(jwt.getSubject(), filename)) {
            return ResponseEntity.notFound().build();
        }

        String token = tickets.issue(filename, jwt.getSubject(), isAdmin);
        ResponseCookie cookie = ResponseCookie.from(VideoTicketService.COOKIE_NAME, token)
                .httpOnly(true).secure(request.isSecure()).sameSite("Strict")
                .path("/api/uploads/videos/" + filename)
                .maxAge(VideoTicketService.LIFETIME).build();
        return ResponseEntity.noContent().cacheControl(CacheControl.noStore())
                .header(HttpHeaders.SET_COOKIE, cookie.toString()).build();
    }

    @GetMapping("/videos/{filename}")
    public ResponseEntity<Resource> serveVideo(@PathVariable String filename,
            @CookieValue(name = VideoTicketService.COOKIE_NAME, required = false) String token) throws Exception {
        if (!validFilename(filename)) return ResponseEntity.notFound().build();
        var ticket = tickets.find(token, filename);
        if (ticket.isEmpty()) return ResponseEntity.notFound().build();
        if (!ticket.get().admin() && !access.hasActiveSubscription(ticket.get().subject(), filename)) {
            return ResponseEntity.notFound().build();
        }

        Path file = storage.resolvePublicFile("videos/" + filename);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }

        String contentType = storage.probeContentType(file);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(Files.size(file))
                .body(new FileSystemResource(file));
    }

    private boolean validFilename(String filename) {
        return VIDEO_FILENAME.matcher(filename).matches();
    }
}
