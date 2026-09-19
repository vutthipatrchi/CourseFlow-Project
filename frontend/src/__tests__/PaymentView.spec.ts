import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import PaymentView from '../views/PaymentView.vue'
import PaymentQrView from '../views/PaymentQrView.vue'

const paymentId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const order = {
  orderId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  accessToken: 'checkout-secret',
  reference: 'CFTEST0001',
  courseTitle: 'Service Design Essentials Course',
  subtotalSatang: 355900,
  discountSatang: 20000,
  totalSatang: 335900,
  currency: 'thb',
  expiresAt: '2030-01-01T00:00:00Z',
}
const promptPayPayment = {
  paymentId,
  orderId: order.orderId,
  reference: order.reference,
  method: 'promptpay' as const,
  status: 'pending' as const,
  amountSatang: 335900,
  currency: 'thb',
  qrUrl: `/api/payments/${paymentId}/qr`,
  failureMessage: null,
  expiresAt: order.expiresAt,
}

const mocks = vi.hoisted(() => ({
  getPaymentConfig: vi.fn<() => Promise<unknown>>(),
  createOrder: vi.fn<(promotionCode: string) => Promise<unknown>>(),
  createPromptPayPayment:
    vi.fn<(orderId: string, checkoutToken: string, idempotencyKey: string) => Promise<unknown>>(),
  createCardPayment:
    vi.fn<
      (
        orderId: string,
        checkoutToken: string,
        cardToken: string,
        idempotencyKey: string,
      ) => Promise<unknown>
    >(),
  tokenizeCard: vi.fn<() => Promise<string>>(),
  rememberCheckout: vi.fn<(paymentId: string, checkoutToken: string) => void>(),
  checkoutTokenFor: vi.fn<(paymentId: string) => string | null>(),
  getPayment: vi.fn<(paymentId: string, checkoutToken: string) => Promise<unknown>>(),
  downloadQr: vi.fn<(paymentId: string, checkoutToken: string) => Promise<Blob>>(),
}))

vi.mock('@/api/payments', () => mocks)

function createTestRouter(initialPath = '/payment') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/payment', name: 'payment', component: PaymentView },
      { path: '/payment/qr', name: 'payment-qr', component: PaymentQrView },
      {
        path: '/payment/status',
        name: 'payment-status',
        component: { template: '<div>Status</div>' },
      },
    ],
  })
  return router
    .push(initialPath)
    .then(() => router.isReady())
    .then(() => router)
}

beforeEach(() => {
  mocks.getPaymentConfig.mockResolvedValue({ enabled: true, publicKey: 'pkey_test_123' })
  mocks.createOrder.mockResolvedValue(order)
  mocks.createPromptPayPayment.mockResolvedValue(promptPayPayment)
  mocks.createCardPayment.mockResolvedValue({ ...promptPayPayment, method: 'card', qrUrl: null })
  mocks.tokenizeCard.mockResolvedValue('tokn_test_123')
  mocks.checkoutTokenFor.mockReturnValue(order.accessToken)
  mocks.getPayment.mockResolvedValue(promptPayPayment)
  mocks.downloadQr.mockResolvedValue(new Blob(['png'], { type: 'image/png' }))
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})

describe('payment page', () => {
  it('matches the supplied summary values and changes payment method', async () => {
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('Enter payment info to start your subscription')
    expect(wrapper.text()).toContain('Service Design Essentials Course')
    expect(wrapper.text()).toContain('THB 3,559.00')
    expect(wrapper.text()).toContain('-THB 200.00')
    expect(wrapper.text()).toContain('THB 3,359.00')

    await wrapper.get('input[value="qr"]').setValue()
    expect(wrapper.text()).toContain('Continue to QR code')
    expect(wrapper.text()).toContain('Payment methodQR code')
    wrapper.unmount()
  })

  it('creates a server order and opens its real PromptPay page', async () => {
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.get('input[value="qr"]').setValue()
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(mocks.createOrder).toHaveBeenCalledWith('')
    expect(mocks.createPromptPayPayment).toHaveBeenCalledWith(
      order.orderId,
      order.accessToken,
      expect.any(String),
    )
    expect(mocks.rememberCheckout).toHaveBeenCalledWith(paymentId, order.accessToken)
    expect(router.currentRoute.value).toMatchObject({
      name: 'payment-qr',
      query: { paymentId },
    })
    wrapper.unmount()
  })

  it('tokenizes valid card data and never sends raw card details to the backend', async () => {
    const router = await createTestRouter()
    const wrapper = mount(PaymentView, { global: { plugins: [router] } })
    await flushPromises()

    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('[role="alert"]').text()).toContain('complete all card details')

    await wrapper.get('input[autocomplete="cc-number"]').setValue('4242424242424242')
    await wrapper.get('input[autocomplete="cc-name"]').setValue('Max Mayfield')
    await wrapper.get('input[autocomplete="cc-exp"]').setValue('12/30')
    await wrapper.get('input[autocomplete="cc-csc"]').setValue('123')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(mocks.tokenizeCard).toHaveBeenCalledWith(
      'pkey_test_123',
      expect.objectContaining({ number: '4242424242424242', securityCode: '123' }),
    )
    expect(mocks.createCardPayment).toHaveBeenCalledWith(
      order.orderId,
      order.accessToken,
      'tokn_test_123',
      expect.any(String),
    )
    expect(mocks.createCardPayment.mock.calls[0]?.join(' ')).not.toContain('4242424242424242')
    expect(router.currentRoute.value.name).toBe('payment-status')
    wrapper.unmount()
  })
})

describe('QR payment page', () => {
  it('loads the provider QR through the authenticated API and downloads it', async () => {
    const router = await createTestRouter(`/payment/qr?paymentId=${paymentId}`)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:courseflow-qr')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const wrapper = mount(PaymentQrView, { global: { plugins: [router] } })
    await flushPromises()

    expect(mocks.getPayment).toHaveBeenCalledWith(paymentId, order.accessToken)
    expect(mocks.downloadQr).toHaveBeenCalledWith(paymentId, order.accessToken)
    expect(wrapper.text()).toContain('Reference no. CFTEST0001')
    expect(wrapper.text()).toContain('THB 3,359.00')
    expect(wrapper.get('img[alt^="QR code"]').attributes('src')).toBe('blob:courseflow-qr')

    const saveButton = wrapper
      .findAll('button')
      .find((button) => button.text().includes('Save QR image'))
    expect(saveButton).toBeDefined()
    await saveButton!.trigger('click')
    expect(click).toHaveBeenCalledOnce()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:courseflow-qr')
    wrapper.unmount()
  })

  it('does not expose a payment when its checkout session is unavailable', async () => {
    mocks.checkoutTokenFor.mockReturnValue(null)
    const router = await createTestRouter(`/payment/qr?paymentId=${paymentId}`)
    const wrapper = mount(PaymentQrView, { global: { plugins: [router] } })
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('session is missing')
    expect(mocks.getPayment).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
