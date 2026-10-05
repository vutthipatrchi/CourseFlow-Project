package com.courseflow.wishlist;

import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@Profile("!standalone")
@RequestMapping("/api/me/wishlist")
public class WishlistController {
    private final WishlistRepository wishlist;

    public WishlistController(WishlistRepository wishlist) { this.wishlist = wishlist; }

    @GetMapping
    public ResponseEntity<List<WishlistCourse>> list(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(wishlist.findAll(jwt.getSubject()));
    }

    @PutMapping("/{courseId}")
    public ResponseEntity<Void> add(@AuthenticationPrincipal Jwt jwt, @PathVariable long courseId) {
        wishlist.add(jwt.getSubject(), courseId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{courseId}")
    public ResponseEntity<Void> remove(@AuthenticationPrincipal Jwt jwt, @PathVariable long courseId) {
        wishlist.remove(jwt.getSubject(), courseId);
        return ResponseEntity.noContent().build();
    }
}
