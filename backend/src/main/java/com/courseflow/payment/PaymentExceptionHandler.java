package com.courseflow.payment;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
class PaymentExceptionHandler {
    @ExceptionHandler(CheckoutNotFoundException.class)
    ResponseEntity<Map<String, String>> notFound(RuntimeException error) {
        return response(HttpStatus.NOT_FOUND, error.getMessage());
    }

    @ExceptionHandler(CheckoutAccessDeniedException.class)
    ResponseEntity<Map<String, String>> forbidden(RuntimeException error) {
        return response(HttpStatus.FORBIDDEN, error.getMessage());
    }

    @ExceptionHandler(CheckoutConflictException.class)
    ResponseEntity<Map<String, String>> conflict(RuntimeException error) {
        return response(HttpStatus.CONFLICT, error.getMessage());
    }

    @ExceptionHandler(PaymentProviderUnavailableException.class)
    ResponseEntity<Map<String, String>> unavailable(RuntimeException error) {
        return response(HttpStatus.SERVICE_UNAVAILABLE, error.getMessage());
    }

    @ExceptionHandler(PaymentProviderException.class)
    ResponseEntity<Map<String, String>> provider(RuntimeException error) {
        return response(HttpStatus.BAD_GATEWAY, "Payment provider request failed");
    }

    @ExceptionHandler({MethodArgumentNotValidException.class, IllegalArgumentException.class})
    ResponseEntity<Map<String, String>> badRequest(Exception error) {
        return response(HttpStatus.BAD_REQUEST, "Invalid request");
    }

    private ResponseEntity<Map<String, String>> response(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of("message", message));
    }
}
