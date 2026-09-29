import { defineComponent, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'vue-sonner'
import { usePaymentStatus } from '@/lib/usePaymentStatus'
import type { PaymentView } from '@/api/payments'

const mocks = vi.hoisted(() => ({
  getPayment: vi.fn<(paymentId: string) => Promise<PaymentView>>(),
}))
vi.mock('@/api/payments', () => ({ getPayment: mocks.getPayment }))

function payment(overrides: Partial<PaymentView> = {}): PaymentView {
  return {
    paymentId: '11111111-1111-1111-1111-111111111111',
    orderId: 'o1',
    courseId: 1,
    reference: 'REF1',
    method: 'card',
    status: 'pending',
    amountSatang: 100000,
    currency: 'THB',
    qrUrl: null,
    authorizeUrl: null,
    failureMessage: null,
    expiresAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// usePaymentStatus schedules real setTimeout polls; mounting it inside a host component and
// unmounting afterwards stops them, so a test never leaks a poll into the next one.
function mountStatus(paymentId: string) {
  let handle: ReturnType<typeof usePaymentStatus> | undefined
  const wrapper = mount(
    defineComponent({
      setup() {
        handle = usePaymentStatus(ref(paymentId))
        return () => null
      },
    }),
  )
  return { wrapper, get: () => handle! }
}

describe('usePaymentStatus toasts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('raises a success toast exactly once when the payment becomes successful', async () => {
    mocks.getPayment.mockResolvedValue(payment({ status: 'successful' }))
    const successSpy = vi.spyOn(toast, 'success')
    const { wrapper, get } = mountStatus('11111111-1111-1111-1111-111111111111')
    await vi.waitFor(() => expect(get().terminal.value).toBe(true))

    expect(successSpy).toHaveBeenCalledTimes(1)
    expect(successSpy).toHaveBeenCalledWith('Payment successful!', {
      description: 'Reference no. REF1',
    })
    wrapper.unmount()
  })

  it('raises an error toast when the payment fails', async () => {
    mocks.getPayment.mockResolvedValue(payment({ status: 'failed' }))
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper, get } = mountStatus('11111111-1111-1111-1111-111111111111')
    await vi.waitFor(() => expect(get().terminal.value).toBe(true))

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('Payment failed.')
    wrapper.unmount()
  })

  it('includes the failure reason as the toast description when the gateway gives one', async () => {
    mocks.getPayment.mockResolvedValue(
      payment({ status: 'failed', failureMessage: 'The card was declined.' }),
    )
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper, get } = mountStatus('11111111-1111-1111-1111-111111111111')
    await vi.waitFor(() => expect(get().terminal.value).toBe(true))

    expect(errorSpy).toHaveBeenCalledWith('Payment failed.', {
      description: 'The card was declined.',
    })
    wrapper.unmount()
  })

  it('raises an error toast when the payment expires', async () => {
    mocks.getPayment.mockResolvedValue(payment({ status: 'expired' }))
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper, get } = mountStatus('11111111-1111-1111-1111-111111111111')
    await vi.waitFor(() => expect(get().terminal.value).toBe(true))

    expect(errorSpy).toHaveBeenCalledWith('Payment expired.')
    wrapper.unmount()
  })

  it('raises an error toast once for an invalid payment link, without calling the API', async () => {
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper, get } = mountStatus('not-a-uuid')
    await vi.waitFor(() => expect(get().loading.value).toBe(false))

    expect(mocks.getPayment).not.toHaveBeenCalled()
    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).toHaveBeenCalledWith('This payment link is invalid.')
    wrapper.unmount()
  })

  it('does not raise a toast while the payment is still pending', async () => {
    mocks.getPayment.mockResolvedValue(payment({ status: 'pending' }))
    const successSpy = vi.spyOn(toast, 'success')
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper, get } = mountStatus('11111111-1111-1111-1111-111111111111')
    await vi.waitFor(() => expect(get().loading.value).toBe(false))

    expect(successSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
