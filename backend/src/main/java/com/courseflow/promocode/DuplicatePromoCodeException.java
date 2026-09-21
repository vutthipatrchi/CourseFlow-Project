package com.courseflow.promocode;

public class DuplicatePromoCodeException extends RuntimeException {
    public DuplicatePromoCodeException(String code) {
        super("Promo code \"" + code + "\" already exists");
    }
}
