package com.courseflow.upload;

import java.nio.file.Files;
import java.util.Map;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@Profile("!standalone")
@RequestMapping("/api")
public class CourseAssetController {
    private final LocalCourseAssetStorage storage;
    private final CourseAssetAccessRepository access;
    public CourseAssetController(LocalCourseAssetStorage storage, CourseAssetAccessRepository access) {
        this.storage = storage;
        this.access = access;
    }

    @PostMapping(value = "/admin/uploads/course-{kind}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public LocalCourseAssetStorage.StoredAsset upload(@PathVariable String kind, @RequestPart("file") MultipartFile file) throws Exception {
        return storage.store(kind, file);
    }

    @GetMapping("/uploads/course-{kind}/{filename}")
    public ResponseEntity<Resource> download(@PathVariable String kind, @PathVariable String filename,
                                            @AuthenticationPrincipal Jwt jwt) throws Exception {
        if (!java.util.Set.of("images", "previews", "resources").contains(kind)) return ResponseEntity.notFound().build();
        if (kind.equals("resources")) {
            Object metadata = jwt == null ? null : jwt.getClaim("metadata");
            boolean admin = metadata instanceof Map<?, ?> claims && "admin".equals(claims.get("role"));
            if (!admin && (jwt == null || !access.canDownloadResource(jwt.getSubject(), filename))) return ResponseEntity.notFound().build();
        }
        var file = storage.resolve(kind, filename);
        if (file == null) return ResponseEntity.notFound().build();
        var disposition = kind.equals("resources") ? ContentDisposition.attachment() : ContentDisposition.inline();
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .header(HttpHeaders.CONTENT_DISPOSITION, disposition.filename(filename).build().toString())
            .contentType(MediaType.parseMediaType(storage.contentType(kind, filename)))
            .contentLength(Files.size(file)).body(new FileSystemResource(file));
    }
}
