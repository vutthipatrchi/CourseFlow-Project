package com.courseflow.upload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalVideoStorage {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("mp4", "webm", "mov", "m4v");

    private final Path uploadRoot;

    public LocalVideoStorage(@Value("${courseflow.upload.dir:uploads}") String uploadDir) throws IOException {
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        Files.createDirectories(this.uploadRoot.resolve("videos"));
    }

    public StoredVideo store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Video file is required");
        }

        String originalName = file.getOriginalFilename() == null ? "video.mp4" : file.getOriginalFilename();
        String extension = extensionOf(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new IllegalArgumentException("Unsupported video type. Allowed: mp4, webm, mov, m4v");
        }

        String storedName = UUID.randomUUID() + "." + extension;
        Path destination = uploadRoot.resolve("videos").resolve(storedName).normalize();
        if (!destination.startsWith(uploadRoot.resolve("videos"))) {
            throw new IllegalArgumentException("Invalid file path");
        }

        try (InputStream input = file.getInputStream()) {
            Files.copy(input, destination, StandardCopyOption.REPLACE_EXISTING);
        }

        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            contentType = mediaTypeFor(extension);
        }

        return new StoredVideo("/api/uploads/videos/" + storedName, contentType, originalName);
    }

    public Path resolvePublicFile(String relativePath) {
        Path resolved = uploadRoot.resolve(relativePath).normalize();
        if (!resolved.startsWith(uploadRoot) || !Files.isRegularFile(resolved)) {
            return null;
        }
        return resolved;
    }

    public String probeContentType(Path file) throws IOException {
        String probed = Files.probeContentType(file);
        if (probed != null) return probed;
        return mediaTypeFor(extensionOf(file.getFileName().toString()));
    }

    private static String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String mediaTypeFor(String extension) {
        return switch (extension) {
            case "webm" -> "video/webm";
            case "mov" -> "video/quicktime";
            case "m4v" -> "video/x-m4v";
            default -> "video/mp4";
        };
    }

    public record StoredVideo(String url, String contentType, String originalName) {}
}
