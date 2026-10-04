import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { toast } from 'vue-sonner'
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
  tokenizeCard:
    vi.fn<(publicKey: string, card: CardDetails, signal?: AbortSignal) => Promise<string>>(),
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
  it('shows spinners while loading the order and replaces them with the prepared checkout', async () => {
    let finish!: (value: OrderCreated) => void
    mocks.createOrder.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.get('h2').find('svg').exists()).toBe(true)
    expect(wrapper.get('button[type="submit"]').find('svg').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Course unavailable')
    finish(order)
    await flushPromises()
    expect(wrapper.get('h2').text()).toBe(order.courseTitle)
    expect(wrapper.get('h2').find('svg').exists()).toBe(false)
    expect(wrapper.get('button[type="submit"]').text()).toBe('Confirm payment')
    expect(mocks.getPaymentConfig).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keeps the course, price and promotions available when payments are disabled', async () => {
    mocks.getPaymentConfig.mockResolvedValue({ enabled: false, publicKey: '' })
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.text()).toContain(order.courseTitle)
    expect(wrapper.text()).toContain('THB 4,200.00')
    expect(mocks.getPaymentConfig).not.toHaveBeenCalled()
    expect(wrapper.get('#promo-code').attributes('disabled')).toBeUndefined()
    await wrapper.get('input[value="qr"]').setValue()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Payment is not configured yet')
    expect(wrapper.text()).toContain(order.courseTitle)
    expect(wrapper.text()).toContain('THB 4,200.00')
    expect(wrapper.text()).not.toContain('Loading your course')
    expect(mocks.createPromptPayPayment).not.toHaveBeenCalled()
    expect(mocks.tokenizeCard).not.toHaveBeenCalled()
    expect(wrapper.get('fieldset').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('retries configuration after a failure without reloading the prepared order', async () => {
    mocks.getPaymentConfig.mockRejectedValueOnce(new Error('Payment setup took too long.'))
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('input[value="qr"]').setValue()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.text()).toContain('Payment setup took too long.')
    expect(mocks.createPromptPayPayment).not.toHaveBeenCalled()
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.getPaymentConfig).toHaveBeenCalledTimes(2)
    expect(mocks.createOrder).toHaveBeenCalledTimes(1)
    expect(mocks.createPromptPayPayment).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.name).toBe('payment-qr')
    wrapper.unmount()
  })

  it('reloads checkout after a timeout before enabling payment details', async () => {
    mocks.createOrder.mockRejectedValueOnce(new Error('Loading took too long.'))
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(mocks.createOrder).toHaveBeenCalledTimes(1)
    expect(mocks.getPaymentConfig).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Course unavailable')
    expect(wrapper.get('h2').find('svg').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('THB 0.00')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Reload checkout')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.get('fieldset').attributes('disabled')).toBeUndefined()
    expect(mocks.createOrder).toHaveBeenCalledTimes(2)
    expect(mocks.createCardPayment).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does not tokenize or charge if configuration arrives after leaving checkout', async () => {
    let finish!: (value: PaymentConfig) => void
    mocks.getPaymentConfig.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('input[autocomplete="cc-number"]').setValue('4242424242424242')
    await wrapper.get('input[autocomplete="cc-name"]').setValue('Test Buyer')
    await wrapper.get('input[autocomplete="cc-exp"]').setValue('12/30')
    await wrapper.get('input[autocomplete="cc-csc"]').setValue('123')
    await wrapper.get('form').trigger('submit')
    expect(mocks.getPaymentConfig).toHaveBeenCalledTimes(1)
    expect(wrapper.get('button[type="submit"]').find('svg').exists()).toBe(true)
    wrapper.unmount()
    finish({ enabled: true, publicKey: 'pkey_test_123' })
    await flushPromises()
    expect(mocks.createOrder).toHaveBeenCalledTimes(1)
    expect(mocks.tokenizeCard).not.toHaveBeenCalled()
    expect(mocks.createCardPayment).not.toHaveBeenCalled()
    expect(mocks.createPromptPayPayment).not.toHaveBeenCalled()
  })

  it('does not charge a card if tokenization finishes after leaving checkout', async () => {
    let finish!: (value: string) => void
    mocks.tokenizeCard.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('input[autocomplete="cc-number"]').setValue('4242424242424242')
    await wrapper.get('input[autocomplete="cc-name"]').setValue('Test Buyer')
    await wrapper.get('input[autocomplete="cc-exp"]').setValue('12/30')
    await wrapper.get('input[autocomplete="cc-csc"]').setValue('123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.tokenizeCard).toHaveBeenCalledTimes(1)
    const signal = mocks.tokenizeCard.mock.calls[0]![2]!
    expect(signal.aborted).toBe(false)
    wrapper.unmount()
    expect(signal.aborted).toBe(true)
    finish('tokn_test_late')
    await flushPromises()
    expect(mocks.createCardPayment).not.toHaveBeenCalled()
    expect(mocks.continueCardAuthentication).not.toHaveBeenCalled()
  })

  it('does not navigate back to payment when a charge response arrives after leaving', async () => {
    let finish!: (value: PaymentResponse) => void
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
    await flushPromises()
    wrapper.unmount()
    await router.push('/')
    finish(pending)
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/')
    expect(mocks.createPromptPayPayment).toHaveBeenCalledTimes(1)
  })

  it('keeps recovery mode if checking a lost payment response also times out', async () => {
    mocks.createPromptPayPayment.mockRejectedValue(new Error('timeout'))
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('input[value="qr"]').setValue()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    mocks.createOrder.mockRejectedValueOnce(new Error('timeout'))
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('button[type="submit"]').text()).toBe('Check payment status')
    expect(wrapper.get('fieldset').attributes('disabled')).toBeDefined()
    expect(mocks.createPromptPayPayment).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('loads the selected course and authoritative total before payment', async () => {
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await flushPromises()
    expect(mocks.getPaymentConfig).not.toHaveBeenCalled()
    expect(mocks.tokenizeCard).not.toHaveBeenCalled()
    expect(mocks.createOrder).toHaveBeenCalledWith(7, '')
    expect(wrapper.text()).toContain('Course from the server')
    expect(wrapper.text()).toContain('THB 4,200.00')
    expect(mocks.createPromptPayPayment).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does not create an order when the course ID is missing', async () => {
    const router = await createTestRouter('/payment')
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    expect(mocks.createOrder).not.toHaveBeenCalled()
    expect(wrapper.get('[role="alert"]').text()).toContain('Please select a valid course')
    wrapper.unmount()
  })

  it('raises a matching toast when the order fails to load', async () => {
    mocks.createOrder.mockRejectedValue(new Error('The server is unreachable.'))
    const errorSpy = vi.spyOn(toast, 'error')
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('The server is unreachable.')
    expect(errorSpy).toHaveBeenCalledWith('The server is unreachable.')
    wrapper.unmount()
  })

  it('raises a success toast when a promotion code is applied', async () => {
    const successSpy = vi.spyOn(toast, 'success')
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('#promo-code').setValue('COURSE200')
    mocks.createOrder.mockResolvedValue({ ...order, promotionCode: 'COURSE200' })
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Apply')!
      .trigger('click')
    await flushPromises()
    expect(successSpy).toHaveBeenCalledWith('Promotion code applied. Please review your total.')
    wrapper.unmount()
  })

  it('raises a matching toast when applying a promotion code fails', async () => {
    const errorSpy = vi.spyOn(toast, 'error')
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('#promo-code').setValue('EXPIRED')
    mocks.createOrder.mockRejectedValue(new Error('That code has expired.'))
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Apply')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('That code has expired.')
    expect(errorSpy).toHaveBeenCalledWith('That code has expired.')
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
    expect(mocks.tokenizeCard).not.toHaveBeenCalled()
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
    const errorSpy = vi.spyOn(toast, 'error')
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('input[value="qr"]').setValue()
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('button[type="submit"]').text()).toBe('Check payment status')
    expect(errorSpy).toHaveBeenCalledWith(
      'We could not confirm the result. Check your payment status before trying again.',
    )
    mocks.createOrder.mockResolvedValue({ ...order, payment: pending })
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.createPromptPayPayment).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.name).toBe('payment-qr')
    wrapper.unmount()
  })

  it('automatically shows a successful card payment when the charge response is lost', async () => {
    const successfulCard = {
      ...pending,
      method: 'card' as const,
      status: 'successful' as const,
      qrUrl: null,
    }
    mocks.createOrder
      .mockResolvedValueOnce(order)
      .mockResolvedValueOnce({ ...order, payment: successfulCard })
    mocks.createCardPayment.mockRejectedValue(new Error('timeout'))
    mocks.getPayment.mockResolvedValue(successfulCard)
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper.get('input[autocomplete="cc-number"]').setValue('4242424242424242')
    await wrapper.get('input[autocomplete="cc-name"]').setValue('Test Buyer')
    await wrapper.get('input[autocomplete="cc-exp"]').setValue('12/30')
    await wrapper.get('input[autocomplete="cc-csc"]').setValue('123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.createCardPayment).toHaveBeenCalledTimes(1)
    expect(mocks.createOrder).toHaveBeenCalledTimes(2)
    expect(router.currentRoute.value.name).toBe('payment-status')
    expect(wrapper.text()).not.toContain('We could not confirm the result')
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
    await flushPromises()
    expect(mocks.createPromptPayPayment).toHaveBeenCalledTimes(1)
    finish(pending)
    await flushPromises()
    wrapper.unmount()
  })

  it.each([true, false])(
    'tokenizes safely and only opens 3-D Secure after navigation succeeds (%s)',
    async (navigationSucceeds) => {
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
      expect(mocks.getPaymentConfig).not.toHaveBeenCalled()
      await wrapper.get('input[autocomplete="cc-number"]').setValue('4242424242424242')
      await wrapper.get('input[autocomplete="cc-name"]').setValue('Test Buyer')
      await wrapper.get('input[autocomplete="cc-exp"]').setValue('12/30')
      await wrapper.get('input[autocomplete="cc-csc"]').setValue('123')
      if (!navigationSucceeds) vi.spyOn(router, 'push').mockResolvedValue(undefined)
      await wrapper.get('form').trigger('submit')
      await flushPromises()
      expect(mocks.createCardPayment).toHaveBeenCalledWith(
        order.orderId,
        'tokn_test_123',
        expect.any(String),
      )
      expect(mocks.createCardPayment.mock.calls.flat().join(' ')).not.toContain('4242424242424242')
      expect(mocks.continueCardAuthentication.mock.calls).toEqual(
        navigationSucceeds ? [[authorizeUrl]] : [],
      )
      expect(router.currentRoute.value.name).toBe(navigationSucceeds ? 'payment-status' : 'payment')
      wrapper.unmount()
    },
  )

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
  it('retries only the QR download after a timeout', async () => {
    mocks.downloadQr.mockRejectedValueOnce(new Error('Loading took too long.'))
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:retry-qr')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const router = await createTestRouter(`/payment/qr?paymentId=${paymentId}`)
    const wrapper = mount(PaymentQrView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Loading took too long.')
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Reload QR code')!
      .trigger('click')
    await flushPromises()
    expect(mocks.downloadQr).toHaveBeenCalledTimes(2)
    expect(mocks.downloadQr).toHaveBeenLastCalledWith(paymentId)
    expect(mocks.createPromptPayPayment).not.toHaveBeenCalled()
    expect(wrapper.get('img[alt^="QR code"]').attributes('src')).toBe('blob:retry-qr')
    wrapper.unmount()
  })

  it('keeps polling after a status timeout without recreating the payment', async () => {
    vi.useFakeTimers()
    mocks.getPayment
      .mockRejectedValueOnce(new Error('Loading took too long.'))
      .mockResolvedValue({ ...pending, status: 'successful' })
    const router = await createTestRouter(`/payment/status?paymentId=${paymentId}`)
    const wrapper = mount(PaymentStatusView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Loading took too long.')
    await vi.advanceTimersByTimeAsync(5000)
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('Thank you for subscribing.')
    expect(mocks.getPayment).toHaveBeenCalledTimes(2)
    expect(mocks.createCardPayment).not.toHaveBeenCalled()
    expect(mocks.createPromptPayPayment).not.toHaveBeenCalled()
    wrapper.unmount()
  })

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

  it('raises a matching toast when the QR code fails to load', async () => {
    mocks.downloadQr.mockRejectedValue(new Error('The QR provider is unavailable.'))
    const errorSpy = vi.spyOn(toast, 'error')
    const router = await createTestRouter(`/payment/qr?paymentId=${paymentId}`)
    const wrapper = mount(PaymentQrView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('The QR provider is unavailable.')
    expect(errorSpy).toHaveBeenCalledWith('The QR provider is unavailable.')
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

  it('continues polling review payments until confirmed and shows the course actions', async () => {
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
    expect(wrapper.get('h1').text()).toBe('Thank you for subscribing.')
    expect(wrapper.text()).toContain(
      'Your payment is complete. You can start learning the course now.',
    )
    expect(wrapper.get('a[href="/my-courses/7"]').text()).toBe('View Course detail')
    expect(wrapper.get('a[href="/courses/course-7/learn/sub-1-1"]').text()).toBe('Start Learning')
    await vi.advanceTimersByTimeAsync(30000)
    expect(mocks.getPayment).toHaveBeenCalledTimes(2)
    wrapper.unmount()
  })

  it('shows the failed payment card with a link back to the same course checkout', async () => {
    mocks.getPayment.mockResolvedValue({
      ...pending,
      status: 'failed',
      failureMessage: 'The card was declined',
    })
    const router = await createTestRouter(`/payment/status?paymentId=${paymentId}`)
    const wrapper = mount(PaymentStatusView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Payment failed.')
    expect(wrapper.text()).toContain('Please check your payment details and try again')
    expect(wrapper.get('a[href="/payment?courseId=7"]').text()).toBe('Back to Payment')
    wrapper.unmount()
  })

  it('raises a matching toast when opening card verification fails', async () => {
    mocks.getPayment.mockResolvedValue({
      ...pending,
      authorizeUrl: 'https://api.omise.co/payments/paym_test_123/authorize',
    })
    mocks.continueCardAuthentication.mockImplementation(() => {
      throw new Error('Popup blocked.')
    })
    const errorSpy = vi.spyOn(toast, 'error')
    const router = await createTestRouter(`/payment/status?paymentId=${paymentId}`)
    const wrapper = mount(PaymentStatusView, { global: { plugins: [router] } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Continue card verification')!
      .trigger('click')
    expect(wrapper.get('[role="alert"]').text()).toBe('Popup blocked.')
    expect(errorSpy).toHaveBeenCalledWith('Popup blocked.')
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

  it('raises a matching toast when My Courses fails to load', async () => {
    mocks.getSubscriptions.mockRejectedValue(new Error('The server is unreachable.'))
    const errorSpy = vi.spyOn(toast, 'error')
    const router = await createTestRouter('/my-courses')
    const wrapper = mount(MyCoursesView, { global: { plugins: [router] } })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toBe('The server is unreachable.')
    expect(errorSpy).toHaveBeenCalledWith('The server is unreachable.')
    wrapper.unmount()
  })
})
