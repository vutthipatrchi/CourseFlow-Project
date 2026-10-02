import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getToken: vi.fn<() => Promise<string | null>>() }))
vi.mock('@clerk/vue', () => mocks)
vi.mock('@/views/sign-in.vue', () => ({ default: { template: '<div>Sign in</div>' } }))
vi.mock('@/views/PaymentStatusView.vue', () => ({ default: { template: '<div>Status</div>' } }))

afterEach(() => {
  vi.useRealTimers()
})

describe('payment navigation', () => {
  it('bounds token lookup and preserves the payment link for sign-in recovery', async () => {
    vi.useFakeTimers()
    let finish!: (value: string) => void
    mocks.getToken.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const { default: router } = await import('@/router')
    const destination = '/payment/status?paymentId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const navigation = router.push(destination)
    await vi.advanceTimersByTimeAsync(10000)
    await navigation
    expect(router.currentRoute.value.name).toBe('sign-in')
    expect(router.currentRoute.value.query.redirect).toBe(destination)
    finish('late-token')
    await Promise.resolve()
    expect(router.currentRoute.value.name).toBe('sign-in')
  })
})
