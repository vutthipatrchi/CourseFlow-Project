package com.courseflow.upload;

import java.nio.file.Files;
import java.nio.file.Path;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/uploads")
@Profile("!standalone")
public class PublicUploadController {

    private final LocalVideoStorage storage;

    public PublicUploadController(LocalVideoStorage storage) {
        this.storage = storage;
    }

    @GetMapping("/videos/{filename}")
    public ResponseEntity<Resource> serveVideo(@PathVariable String filename) throws Exception {
        if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return ResponseEntity.notFound().build();
        }

        Path file = storage.resolvePublicFile("videos/" + filename);
        if (file == null) {
            return ResponseEntity.notFound().build();
        }

        String contentType = storage.probeContentType(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(Files.size(file))
                .body(new FileSystemResource(file));
    }
}
