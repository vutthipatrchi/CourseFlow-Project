package com.courseflow.promocode;

import com.courseflow.common.web.ResourceNotFoundException;
import java.util.List;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

@Service
@Profile("!standalone")
public class PromoCodeService {

    private final PromoCodeRepository promoCodeRepository;

    public PromoCodeService(PromoCodeRepository promoCodeRepository) {
        this.promoCodeRepository = promoCodeRepository;
    }

    public List<PromoCode> findAll() {
        return promoCodeRepository.findAll();
    }

    public PromoCode findById(long id) {
        return promoCodeRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Promo code " + id + " not found"));
    }

    public PromoCode create(PromoCodeRequest request) {
        if (promoCodeRepository.isCodeTaken(request.code(), null)) {
            throw new DuplicatePromoCodeException(request.code());
        }
        return promoCodeRepository.create(request);
    }

    public PromoCode update(long id, PromoCodeRequest request) {
        if (promoCodeRepository.isCodeTaken(request.code(), id)) {
            throw new DuplicatePromoCodeException(request.code());
        }
        return promoCodeRepository.update(id, request)
            .orElseThrow(() -> new ResourceNotFoundException("Promo code " + id + " not found"));
    }

    public void delete(long id) {
        if (!promoCodeRepository.delete(id)) {
            throw new ResourceNotFoundException("Promo code " + id + " not found");
        }
    }
}
