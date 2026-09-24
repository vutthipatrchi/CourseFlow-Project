import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import PaymentView from '../views/PaymentView.vue'
import PaymentQrView from '../views/PaymentQrView.vue'
import PaymentStatusView from '../views/PaymentStatusView.vue'
import MyCoursesView from '../views/MyCoursesView.vue'
import type {
  CardDetails,
  OrderCreated,
  PaymentConfig,
  PaymentView as PaymentResponse,
  SubscriptionView,
} from '@/api/payments'

const paymentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const order: OrderCreated = {
  orderId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  courseId: 7,
  reference: 'CFTEST0001',
  courseTitle: 'Course from the server',
  promotionCode: '',
  subtotalSatang: 420000,
  discountSatang: 0,
  totalSatang: 420000,
  currency: 'thb',
  expiresAt: '2030-01-01T00:00:00Z',
  payment: null,
}
const pending: PaymentResponse = {
  paymentId,
  orderId: order.orderId,
  courseId: 7,
  reference: order.reference,
  method: 'promptpay',
  status: 'pending',
  amountSatang: 420000,
  currency: 'thb',
  qrUrl: `/api/payments/${paymentId}/qr`,
  authorizeUrl: null,
  failureMessage: null,
  expiresAt: order.expiresAt,
}
const mocks = vi.hoisted(() => ({
  getPaymentConfig: vi.fn<() => Promise<PaymentConfig>>(),
  createOrder: vi.fn<(courseId: number, promotionCode: string) => Promise<OrderCreated>>(),
  createPromptPayPayment: vi.fn<(orderId: string, key: string) => Promise<PaymentResponse>>(),
  createCardPayment:
    vi.fn<(orderId: string, token: string, key: string) => Promise<PaymentResponse>>(),
  tokenizeCard: vi.fn<(publicKey: string, card: CardDetails) => Promise<string>>(),
  getPayment: vi.fn<(paymentId: string) => Promise<PaymentResponse>>(),
  downloadQr: vi.fn<(paymentId: string) => Promise<Blob>>(),
  continueCardAuthentication: vi.fn<(authorizeUrl: string) => void>(),
  getSubscriptions: vi.fn<() => Promise<SubscriptionView[]>>(),
}))
vi.mock('@/api/payments', () => mocks)
vi.mock('@clerk/vue', async () => {
  const { ref } = await import('vue')
  return {
    getToken: vi.fn<() => Promise<null>>().mockResolvedValue(null),
    useClerk: () => ref(null),
    useUser: () => ({ user: ref({ fullName: 'Student', imageUrl: '', hasImage: false }) }),
  }
})

async function createTestRouter(path = '/payment?courseId=7') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/payment', name: 'payment', component: PaymentView },
      { path: '/payment/qr', name: 'payment-qr', component: PaymentQrView },
      { path: '/payment/status', name: 'payment-status', component: PaymentStatusView },
      { path: '/my-courses', name: 'my-courses', component: MyCoursesView },
      {
        path: '/my-courses/:courseId',
        name: 'my-course-detail',
        component: { template: '<div>Course detail</div>' },
      },
    ],
  })
  await router.push(path)
  await router.isReady()
  return router
}
beforeEach(() => {
  vi.resetAllMocks()
  mocks.getPaymentConfig.mockResolvedValue({ enabled: true, publicKey: 'pkey_test_123' })
  mocks.createOrder.mockResolvedValue(order)
  mocks.createPromptPayPayment.mockResolvedValue(pending)
  mocks.createCardPayment.mockResolvedValue({
    ...pending,
    method: 'card',
    qrUrl: null,
    status: 'successful',
  })
  mocks.tokenizeCard.mockResolvedValue('tokn_test_123')
  mocks.getPayment.mockResolvedValue(pending)
  mocks.downloadQr.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
  mocks.getSubscriptions.mockResolvedValue([])
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('checkout', () => {
  it('loads the selected course and authoritative total before payment', async () => {
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await flushPromises()
    expect(mocks.createOrder).toHaveBeenCalledWith(7, '')
    expect(wrapper.text()).toContain('Course from the server')
    expect(wrapper.text()).toContain('THB 4,200.00')
    expect(mocks.createPromptPayPayment).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('uses the prepared order without creating another order at confirmation', async () => {
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('input[value="qr"]').setValue()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.createOrder).toHaveBeenCalledTimes(1)
    expect(mocks.createPromptPayPayment).toHaveBeenCalledWith(order.orderId, expect.any(String))
    expect(router.currentRoute.value.name).toBe('payment-qr')
    wrapper.unmount()
  })

  it('resumes an unresolved charge after reloading rather than offering another charge', async () => {
    mocks.createOrder.mockResolvedValue({ ...order, payment: { ...pending, status: 'review' } })
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    expect(router.currentRoute.value.name).toBe('payment-status')
    expect(mocks.createPromptPayPayment).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('recovers a lost response without resubmitting the payment', async () => {
    mocks.createPromptPayPayment.mockRejectedValue(new Error('timeout'))
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('input[value="qr"]').setValue()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('button[type="submit"]').text()).toBe('Check payment status')
    mocks.createOrder.mockResolvedValue({ ...order, payment: pending })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.createPromptPayPayment).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.name).toBe('payment-qr')
    wrapper.unmount()
  })

  it('requires another confirmation after applying a changed promotion', async () => {
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('input[value="qr"]').setValue()
    await wrapper.get('#promo-code').setValue('COURSE200')
    mocks.createOrder.mockResolvedValue({
      ...order,
      promotionCode: 'COURSE200',
      discountSatang: 20000,
      totalSatang: 400000,
    })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('THB 4,000.00')
    expect(mocks.createPromptPayPayment).not.toHaveBeenCalled()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.createPromptPayPayment).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('prevents simultaneous submit events while waiting for the provider', async () => {
    let finish!: (value: typeof pending) => void
    mocks.createPromptPayPayment.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('input[value="qr"]').setValue()
    await wrapper.get('form').trigger('submit')
    await wrapper.get('form').trigger('submit')
    expect(mocks.createPromptPayPayment).toHaveBeenCalledTimes(1)
    finish(pending)
    await flushPromises()
    wrapper.unmount()
  })

  it('tokenizes card data and continues 3-D Secure without sending PAN or CVV to the backend', async () => {
    const authorizeUrl = 'https://api.omise.co/payments/paym_test_123/authorize'
    mocks.createCardPayment.mockResolvedValue({
      ...pending,
      method: 'card',
      authorizeUrl,
      qrUrl: null,
    })
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toContain('complete all card details')
    await wrapper.get('input[autocomplete="cc-number"]').setValue('4242424242424242')
    await wrapper.get('input[autocomplete="cc-name"]').setValue('Test Buyer')
    await wrapper.get('input[autocomplete="cc-exp"]').setValue('12/30')
    await wrapper.get('input[autocomplete="cc-csc"]').setValue('123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.createCardPayment).toHaveBeenCalledWith(
      order.orderId,
      'tokn_test_123',
      expect.any(String),
    )
    expect(mocks.createCardPayment.mock.calls.flat().join(' ')).not.toContain('4242424242424242')
    expect(mocks.continueCardAuthentication).toHaveBeenCalledWith(authorizeUrl)
    expect(router.currentRoute.value.name).toBe('payment-status')
    wrapper.unmount()
  })

  it('formats and limits the card number to exactly 16 digits', async () => {
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()

    const cardNumber = wrapper.get('input[autocomplete="cc-number"]')
    await cardNumber.setValue('42424242424242429999')

    expect((cardNumber.element as HTMLInputElement).value).toBe('4242 4242 4242 4242')
    expect(cardNumber.attributes('maxlength')).toBe('19')
    wrapper.unmount()
  })
})

describe('payment status', () => {
  it('loads QR using the signed-in API session and saves the correct image extension', async () => {
    mocks.downloadQr.mockResolvedValue(new Blob(['<svg/>'], { type: 'image/svg+xml' }))
    const router = await createTestRouter(`/payment/qr?paymentId=${paymentId}`)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:qr')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    let filename = ''
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      filename = this.download
    })
    const wrapper = mount(PaymentQrView, { global: { plugins: [router] } })
    await flushPromises()
    expect(mocks.getPayment).toHaveBeenCalledWith(paymentId)
    expect(mocks.downloadQr).toHaveBeenCalledWith(paymentId)
    expect(wrapper.get('img[alt^="QR code"]').attributes('src')).toBe('blob:qr')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Save QR image')!
      .trigger('click')
    expect(filename).toBe('courseflow-qr-CFTEST0001.svg')
    wrapper.unmount()
  })

  it('rejects an invalid payment link', async () => {
    const router = await createTestRouter('/payment/status?paymentId=not-a-uuid')
    const wrapper = mount(PaymentStatusView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('invalid')
    expect(mocks.getPayment).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('continues polling review payments until confirmed and shows purchased courses', async () => {
    vi.useFakeTimers()
    mocks.getPayment
      .mockResolvedValueOnce({ ...pending, status: 'review' })
      .mockResolvedValue({ ...pending, status: 'successful' })
    const router = await createTestRouter(`/payment/status?paymentId=${paymentId}`)
    const wrapper = mount(PaymentStatusView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Please do not pay again')
    await vi.advanceTimersByTimeAsync(15000)
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Payment successful')
    expect(wrapper.get('a[href="/my-courses"]').text()).toBe('View my courses')
    await vi.advanceTimersByTimeAsync(30000)
    expect(mocks.getPayment).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('does not restart polling if an in-flight request finishes after leaving the page', async () => {
    vi.useFakeTimers()
    let finish!: (value: typeof pending) => void
    mocks.getPayment.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const router = await createTestRouter(`/payment/status?paymentId=${paymentId}`)
    const wrapper = mount(PaymentStatusView, { global: { plugins: [router] } })
    wrapper.unmount()
    finish(pending)
    await flushPromises()
    await vi.advanceTimersByTimeAsync(30000)
    expect(mocks.getPayment).toHaveBeenCalledTimes(1)
  })

  it('shows enrolled courses returned by the authenticated backend', async () => {
    mocks.getSubscriptions.mockResolvedValue([
      {
        id: 'enrollment',
        courseId: 7,
        courseTitle: 'Purchased course',
        reference: 'CFPAID',
        activatedAt: '2026-09-20T00:00:00Z',
        completedLessons: 6,
        totalLessons: 6,
        progressPercent: 100,
        status: 'completed',
      },
      {
        id: 'enrollment-in-progress',
        courseId: 8,
        courseTitle: 'Course in progress',
        reference: 'CFSTARTED',
        activatedAt: '2026-09-21T00:00:00Z',
        completedLessons: 2,
        totalLessons: 8,
        progressPercent: 25,
        status: 'in-progress',
      },
    ])
    const router = await createTestRouter('/my-courses')
    const wrapper = mount(MyCoursesView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Purchased course')
    expect(wrapper.text()).toContain('Completed')
    expect(wrapper.text()).toContain('6/6 lessons')
    expect(wrapper.text()).toContain('Course in progress')
    expect(wrapper.get('[data-testid="in-progress-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="completed-count"]').text()).toBe('1')
    expect(wrapper.get('[data-testid="my-courses-profile"]').classes()).toContain('lg:sticky')
    expect(wrapper.get('a[href="/my-courses/7"]').text()).toBe('Purchased course')

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Inprogress')!
      .trigger('click')
    expect(wrapper.text()).toContain('Course in progress')
    expect(wrapper.text()).not.toContain('Purchased course')
    await wrapper.get('a[href="/my-courses/8"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/my-courses/8')
    wrapper.unmount()
  })
})
