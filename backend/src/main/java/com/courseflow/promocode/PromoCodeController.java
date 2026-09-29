package com.courseflow.promocode;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/promo-codes")
@Profile("!standalone")
public class PromoCodeController {

    private final PromoCodeService promoCodeService;

    public PromoCodeController(PromoCodeService promoCodeService) {
        this.promoCodeService = promoCodeService;
    }

    @GetMapping
    public List<PromoCode> findAll() {
        return promoCodeService.findAll();
    }

    @GetMapping("/{id}")
    public PromoCode findById(@PathVariable long id) {
        return promoCodeService.findById(id);
    }

    @PostMapping
    public ResponseEntity<PromoCode> create(@Valid @RequestBody PromoCodeRequest request) {
        PromoCode created = promoCodeService.create(request);
        return ResponseEntity.created(URI.create("/api/admin/promo-codes/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public PromoCode update(@PathVariable long id, @Valid @RequestBody PromoCodeRequest request) {
        return promoCodeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        promoCodeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
