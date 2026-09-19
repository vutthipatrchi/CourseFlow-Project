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
  authorizeUri: string | null
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

interface ApiErrorBody {
  message?: string
}

const checkoutTokenPrefix = 'courseflow:checkout:'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  if (!response.ok) {
    let body: ApiErrorBody = {}
    try {
      body = (await response.json()) as ApiErrorBody
    } catch {
      // The HTTP status is still useful if an intermediary returned a non-JSON body.
    }
    throw new Error(body.message || `Payment request failed (${response.status})`)
  }
  return (await response.json()) as T
}

export function getPaymentConfig() {
  return request<PaymentConfig>('/api/payments/config')
}

export function createOrder(promotionCode: string) {
  return request<OrderCreated>('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      courseId: 1,
      promotionCode: promotionCode.trim(),
    }),
  })
}

export function createCardPayment(
  orderId: string,
  checkoutToken: string,
  cardToken: string,
  idempotencyKey: string,
) {
  return request<PaymentView>(`/api/orders/${orderId}/payments/card`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Checkout-Token': checkoutToken,
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify({ cardToken }),
  })
}

export function createPromptPayPayment(
  orderId: string,
  checkoutToken: string,
  idempotencyKey: string,
) {
  return request<PaymentView>(`/api/orders/${orderId}/payments/promptpay`, {
    method: 'POST',
    headers: {
      'X-Checkout-Token': checkoutToken,
      'Idempotency-Key': idempotencyKey,
    },
  })
}

export function getPayment(paymentId: string, checkoutToken: string) {
  return request<PaymentView>(`/api/payments/${paymentId}`, {
    headers: { 'X-Checkout-Token': checkoutToken },
    cache: 'no-store',
  })
}

export async function downloadQr(paymentId: string, checkoutToken: string) {
  const response = await fetch(`/api/payments/${paymentId}/qr`, {
    headers: { 'X-Checkout-Token': checkoutToken },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Unable to download QR image (${response.status})`)
  return response.blob()
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
