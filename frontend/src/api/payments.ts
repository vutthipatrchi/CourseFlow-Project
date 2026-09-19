import type { AxiosRequestConfig } from 'axios'
import client, { toApiError } from './client'

export type PaymentStatus = 'creating' | 'pending' | 'successful' | 'failed' | 'expired' | 'review'

export interface PaymentConfig {
  enabled: boolean
  publicKey: string
}

export interface OrderCreated {
  orderId: string
  accessToken: string
  reference: string
  courseTitle: string
  subtotalSatang: number
  discountSatang: number
  totalSatang: number
  currency: string
  expiresAt: string
}

export interface PaymentView {
  paymentId: string
  orderId: string
  reference: string
  method: 'card' | 'promptpay'
  status: PaymentStatus
  amountSatang: number
  currency: string
  qrUrl: string | null
  failureMessage: string | null
  expiresAt: string
}

export interface CardDetails {
  name: string
  number: string
  expirationMonth: number
  expirationYear: number
  securityCode: string
}

const checkoutTokenPrefix = 'courseflow:checkout:'

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const { data } = await client.request<T>(config)
    return data
  } catch (error) {
    throw new Error(toApiError(error).message)
  }
}

export function getPaymentConfig() {
  return request<PaymentConfig>({ url: '/payments/config' })
}

export function createOrder(promotionCode: string) {
  return request<OrderCreated>({
    method: 'POST',
    url: '/orders',
    data: {
      courseId: 1,
      promotionCode: promotionCode.trim(),
    },
  })
}

export function createCardPayment(
  orderId: string,
  checkoutToken: string,
  cardToken: string,
  idempotencyKey: string,
) {
  return request<PaymentView>({
    method: 'POST',
    url: `/orders/${orderId}/payments/card`,
    headers: {
      'X-Checkout-Token': checkoutToken,
      'Idempotency-Key': idempotencyKey,
    },
    data: { cardToken },
  })
}

export function createPromptPayPayment(
  orderId: string,
  checkoutToken: string,
  idempotencyKey: string,
) {
  return request<PaymentView>({
    method: 'POST',
    url: `/orders/${orderId}/payments/promptpay`,
    headers: {
      'X-Checkout-Token': checkoutToken,
      'Idempotency-Key': idempotencyKey,
    },
  })
}

export function getPayment(paymentId: string, checkoutToken: string) {
  return request<PaymentView>({
    url: `/payments/${paymentId}`,
    headers: {
      'X-Checkout-Token': checkoutToken,
      'Cache-Control': 'no-cache',
    },
  })
}

export async function downloadQr(paymentId: string, checkoutToken: string) {
  return request<Blob>({
    url: `/payments/${paymentId}/qr`,
    headers: {
      'X-Checkout-Token': checkoutToken,
      'Cache-Control': 'no-cache',
    },
    responseType: 'blob',
  })
}

export function tokenizeCard(publicKey: string, card: CardDetails): Promise<string> {
  if (!window.Omise) return Promise.reject(new Error('Secure card form could not be loaded'))
  window.Omise.setPublicKey(publicKey)
  return new Promise((resolve, reject) => {
    window.Omise!.createToken(
      'card',
      {
        name: card.name,
        number: card.number,
        expiration_month: card.expirationMonth,
        expiration_year: card.expirationYear,
        security_code: card.securityCode,
      },
      (statusCode, response) => {
        if (statusCode === 200 && response.id) resolve(response.id)
        else reject(new Error(response.message || 'Card details were rejected'))
      },
    )
  })
}

export function rememberCheckout(paymentId: string, checkoutToken: string) {
  sessionStorage.setItem(`${checkoutTokenPrefix}${paymentId}`, checkoutToken)
}

export function checkoutTokenFor(paymentId: string) {
  return sessionStorage.getItem(`${checkoutTokenPrefix}${paymentId}`)
}
