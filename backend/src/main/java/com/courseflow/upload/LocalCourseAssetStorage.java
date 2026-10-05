package com.courseflow.upload;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalCourseAssetStorage {
    private static final Map<String, String> IMAGES = Map.of("jpg", "image/jpeg", "jpeg", "image/jpeg", "png", "image/png");
    private static final Map<String, String> PREVIEWS = Map.of("mp4", "video/mp4", "webm", "video/webm", "mov", "video/quicktime", "m4v", "video/x-m4v");
    private static final Map<String, String> RESOURCES = Map.ofEntries(
        Map.entry("pdf", "application/pdf"), Map.entry("txt", "text/plain"), Map.entry("csv", "text/csv"),
        Map.entry("zip", "application/zip"), Map.entry("doc", "application/msword"),
        Map.entry("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        Map.entry("xls", "application/vnd.ms-excel"), Map.entry("xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
        Map.entry("ppt", "application/vnd.ms-powerpoint"), Map.entry("pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"));
    private final Path root;

    public LocalCourseAssetStorage(@Value("${courseflow.upload.dir:uploads}") String directory) throws IOException {
        root = Path.of(directory).toAbsolutePath().normalize();
        for (String kind : new String[]{"images", "previews", "resources"}) Files.createDirectories(root.resolve("course-" + kind));
    }

    public StoredAsset store(String kind, MultipartFile file) throws IOException {
        Map<String, String> types = types(kind);
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("File is required");
        long limit = switch (kind) { case "images" -> 5; case "previews" -> 200; default -> 25; };
        if (file.getSize() > limit * 1024 * 1024) throw new IllegalArgumentException("File exceeds " + limit + " MB");
        String originalName = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String extension = extension(originalName);
        if (!types.containsKey(extension)) throw new IllegalArgumentException("Unsupported " + kind + " file type");
        if (kind.equals("images")) validateImage(file, extension);
        String filename = UUID.randomUUID() + "." + extension;
        Path destination = root.resolve("course-" + kind).resolve(filename);
        try (var input = file.getInputStream()) { Files.copy(input, destination); }
        return new StoredAsset("/api/uploads/course-" + kind + "/" + filename, types.get(extension), originalName);
    }

    public Path resolve(String kind, String filename) {
        if (!filename.matches("[a-f0-9-]{36}[.][a-z0-9]+") || !types(kind).containsKey(extension(filename))) return null;
        Path path = root.resolve("course-" + kind).resolve(filename).normalize();
        return path.startsWith(root) && Files.isRegularFile(path) ? path : null;
    }

    public String contentType(String kind, String filename) { return types(kind).get(extension(filename)); }

    private static Map<String, String> types(String kind) {
        return switch (kind) {
            case "images" -> IMAGES;
            case "previews" -> PREVIEWS;
            case "resources" -> RESOURCES;
            default -> throw new IllegalArgumentException("Unknown course file type");
        };
    }

    private static String extension(String name) {
        int dot = name.lastIndexOf('.');
        return dot < 0 ? "" : name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static void validateImage(MultipartFile file, String extension) throws IOException {
        try (var input = file.getInputStream(); var image = ImageIO.createImageInputStream(input)) {
            var readers = ImageIO.getImageReaders(image);
            if (!readers.hasNext()) throw new IllegalArgumentException("Invalid cover image");
            var reader = readers.next();
            try {
                reader.setInput(image);
                String expected = extension.equals("png") ? "png" : "jpeg";
                if (!reader.getFormatName().equalsIgnoreCase(expected)
                    || (long) reader.getWidth(0) * reader.getHeight(0) > 25_000_000) {
                    throw new IllegalArgumentException("Invalid cover image or image dimensions too large");
                }
            } finally { reader.dispose(); }
        } catch (IOException error) {
            throw new IllegalArgumentException("Invalid cover image", error);
        }
    }

    public record StoredAsset(String url, String contentType, String originalName) {}
}
