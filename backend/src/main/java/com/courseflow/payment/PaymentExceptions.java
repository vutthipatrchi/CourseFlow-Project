package com.courseflow.payment;

class CheckoutNotFoundException extends RuntimeException {
    CheckoutNotFoundException() { super("Checkout not found"); }
}

class CheckoutAccessDeniedException extends RuntimeException {
    CheckoutAccessDeniedException() { super("Checkout access denied"); }
}

class CheckoutConflictException extends RuntimeException {
    CheckoutConflictException(String message) { super(message); }
}

class PaymentProviderException extends RuntimeException {
    PaymentProviderException(String message) { super(message); }
    PaymentProviderException(String message, Throwable cause) { super(message, cause); }
}

class PaymentProviderUnavailableException extends RuntimeException {
    PaymentProviderUnavailableException() { super("Payment provider is not configured"); }
}
