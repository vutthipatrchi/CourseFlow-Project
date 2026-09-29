package com.courseflow.course;

import java.io.IOException;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class DemoVideoController {
    @GetMapping("/api/catalog/demo-video")
    public ResponseEntity<Resource> video() throws IOException {
        Resource video = new ClassPathResource("demo/demo-flower.mp4");
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .contentType(MediaType.valueOf("video/mp4"))
            .contentLength(video.contentLength()).body(video);
    }
}
