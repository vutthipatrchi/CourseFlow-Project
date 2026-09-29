package com.courseflow.upload;

import java.util.Map;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin/uploads")
@Profile("!standalone")
public class AdminUploadController {

    private final LocalVideoStorage storage;

    public AdminUploadController(LocalVideoStorage storage) {
        this.storage = storage;
    }

    @PostMapping(value = "/videos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadVideo(@RequestPart("file") MultipartFile file)
            throws Exception {
        LocalVideoStorage.StoredVideo stored = storage.store(file);
        return ResponseEntity.ok(Map.of(
                "url", stored.url(),
                "contentType", stored.contentType(),
                "originalName", stored.originalName()));
    }
}
