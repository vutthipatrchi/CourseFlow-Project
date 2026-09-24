import type { AxiosRequestConfig } from 'axios'
import client, { toApiError } from './client'

export type PaymentStatus = 'creating' | 'pending' | 'successful' | 'failed' | 'expired' | 'review'
export interface PaymentConfig {
  enabled: boolean
  publicKey: string
}
export interface OrderCreated {
  orderId: string
  courseId: number
  reference: string
  courseTitle: string
  promotionCode: string
  subtotalSatang: number
  discountSatang: number
  totalSatang: number
  currency: string
  expiresAt: string
  payment: PaymentView | null
}
export interface PaymentView {
  paymentId: string
  orderId: string
  courseId: number
  reference: string
  method: 'card' | 'promptpay'
  status: PaymentStatus
  amountSatang: number
  currency: string
  qrUrl: string | null
  authorizeUrl: string | null
  failureMessage: string | null
  expiresAt: string
}
export interface SubscriptionView {
  id: string
  courseId: number
  courseTitle: string
  reference: string
  activatedAt: string
  completedLessons: number
  totalLessons: number
  progressPercent: number
  status: 'in-progress' | 'completed'
  progressAvailable?: boolean
}
type SubscriptionResponse = Omit<
  SubscriptionView,
  'completedLessons' | 'totalLessons' | 'progressPercent' | 'status' | 'progressAvailable'
> & {
  completedLessons?: number
  totalLessons?: number
  progressPercent?: number
  status: SubscriptionView['status'] | 'active'
}
export interface CourseProgressView {
  courseId: number
  completedLessons: number
  totalLessons: number
  progressPercent: number
  status: 'in-progress' | 'completed'
  subLessons: CourseProgressSubLesson[]
}
export interface CourseProgressSubLesson {
  id: number
  title: string
  videoUrl: string | null
  lessonPosition: number
  lessonTitle: string
  subLessonPosition: number
  completed: boolean
}
export interface CardDetails {
  name: string
  number: string
  expirationMonth: number
  expirationYear: number
  securityCode: string
}

async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    return (await client.request<T>(config)).data
  } catch (error) {
    throw new Error(toApiError(error).message)
  }
}

export function getPaymentConfig() {
  return request<PaymentConfig>({ url: '/payments/config' })
}
export function createOrder(courseId: number, promotionCode: string) {
  return request<OrderCreated>({
    method: 'POST',
    url: '/orders',
    data: { courseId, promotionCode: promotionCode.trim() },
  })
}
export function createCardPayment(orderId: string, cardToken: string, idempotencyKey: string) {
  return request<PaymentView>({
    method: 'POST',
    url: `/orders/${orderId}/payments/card`,
    headers: { 'Idempotency-Key': idempotencyKey },
    data: { cardToken },
  })
}
export function createPromptPayPayment(orderId: string, idempotencyKey: string) {
  return request<PaymentView>({
    method: 'POST',
    url: `/orders/${orderId}/payments/promptpay`,
    headers: { 'Idempotency-Key': idempotencyKey },
  })
}
export function getPayment(paymentId: string) {
  return request<PaymentView>({
    url: `/payments/${paymentId}`,
    headers: { 'Cache-Control': 'no-cache' },
  })
}
export function downloadQr(paymentId: string) {
  return request<Blob>({ url: `/payments/${paymentId}/qr`, responseType: 'blob' })
}
export async function getSubscriptions(): Promise<SubscriptionView[]> {
  const subscriptions = await request<SubscriptionResponse[]>({ url: '/me/subscriptions' })
  return Promise.all(
    subscriptions.map(async (subscription) => {
      const hasProgress =
        Number.isFinite(subscription.completedLessons) &&
        Number.isFinite(subscription.totalLessons) &&
        Number.isFinite(subscription.progressPercent)
      let progress: CourseProgressView | undefined
      if (!hasProgress) {
        try {
          progress = await getCourseProgress(subscription.courseId)
        } catch {
          // Older API responses may not expose course progress.
        }
      }
      return {
        ...subscription,
        completedLessons: progress?.completedLessons ?? subscription.completedLessons ?? 0,
        totalLessons: progress?.totalLessons ?? subscription.totalLessons ?? 0,
        progressPercent: progress?.progressPercent ?? subscription.progressPercent ?? 0,
        status:
          progress?.status === 'completed' || subscription.status === 'completed'
            ? 'completed'
            : 'in-progress',
        progressAvailable: hasProgress || !!progress,
      }
    }),
  )
}

export function getCourseProgress(courseId: number) {
  return request<CourseProgressView>({ url: `/me/courses/${courseId}/progress` })
}

export function completeSubLesson(
  courseId: number,
  lessonPosition: number,
  subLessonPosition: number,
) {
  return request<CourseProgressView>({
    method: 'PUT',
    url: `/me/courses/${courseId}/lessons/${lessonPosition}/sub-lessons/${subLessonPosition}/complete`,
  })
}

export function continueCardAuthentication(authorizeUrl: string) {
  const url = new URL(authorizeUrl)
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'api.omise.co' ||
    url.username ||
    url.password ||
    (url.port !== '' && url.port !== '443')
  )
    throw new Error('Invalid card verification URL')
  window.location.assign(url.href)
}

export function tokenizeCard(publicKey: string, card: CardDetails): Promise<string> {
  if (!window.Omise)
    return Promise.reject(
      new Error('Secure card form could not be loaded. Please reload the page.'),
    )
  window.Omise.setPublicKey(publicKey)
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error('Card verification timed out. Please try again.')),
      30000,
    )
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
        clearTimeout(timeout)
        if (statusCode === 200 && response.id) resolve(response.id)
        else reject(new Error(response.message || 'Card details were rejected'))
      },
    )
  })
}
