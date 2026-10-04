import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosInstance } from 'axios'

vi.mock('@/api/client', () => ({
  default: { request: vi.fn<AxiosInstance['request']>() },
  toApiError: (error: Error) => ({ message: error.message }),
}))

function sdk(): OmiseClient {
  return {
    setPublicKey: vi.fn<OmiseClient['setPublicKey']>(),
    createToken: vi.fn<OmiseClient['createToken']>(),
  }
}
function scripts() {
  return document.querySelectorAll<HTMLScriptElement>('script[src="https://cdn.omise.co/omise.js"]')
}

beforeEach(() => {
  vi.resetModules()
  delete window.Omise
})
afterEach(() => {
  for (const script of scripts()) script.remove()
  delete window.Omise
  vi.useRealTimers()
})

describe('on-demand Omise SDK', () => {
  it('does not request the SDK when the module is imported', async () => {
    await import('@/lib/omise')
    expect(scripts()).toHaveLength(0)
  })

  it('shares one script load across concurrent requests and reuses the SDK', async () => {
    const { loadOmise } = await import('@/lib/omise')
    const first = loadOmise()
    const second = loadOmise()
    expect(scripts()).toHaveLength(1)
    expect(first).toBe(second)
    const client = sdk()
    window.Omise = client
    scripts()[0]!.dispatchEvent(new Event('load'))
    await expect(first).resolves.toBe(client)
    await expect(second).resolves.toBe(client)
    await expect(loadOmise()).resolves.toBe(client)
    expect(scripts()).toHaveLength(1)
  })

  it.each(['error', 'load'])('allows retry after a failed SDK load (%s)', async (event) => {
    const { loadOmise } = await import('@/lib/omise')
    const failure = loadOmise().catch((error: unknown) => error)
    scripts()[0]!.dispatchEvent(new Event(event))
    expect(await failure).toMatchObject({ message: expect.stringContaining('could not be loaded') })
    expect(scripts()).toHaveLength(0)
    const retry = loadOmise()
    expect(scripts()).toHaveLength(1)
    window.Omise = sdk()
    scripts()[0]!.dispatchEvent(new Event('load'))
    await expect(retry).resolves.toBe(window.Omise)
  })

  it('bounds a stalled SDK request and allows retry', async () => {
    vi.useFakeTimers()
    const { loadOmise } = await import('@/lib/omise')
    const failure = loadOmise().catch((error: unknown) => error)
    await vi.advanceTimersByTimeAsync(30_000)
    expect(await failure).toMatchObject({ message: expect.stringContaining('took too long') })
    expect(scripts()).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
    const retry = loadOmise()
    window.Omise = sdk()
    scripts()[0]!.dispatchEvent(new Event('load'))
    await expect(retry).resolves.toBe(window.Omise)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('skips a canceled checkout after loading the shared SDK without canceling another caller', async () => {
    const { tokenizeCard } = await import('@/api/payments')
    const controller = new AbortController()
    const card = {
      name: 'Test Buyer',
      number: '4242424242424242',
      expirationMonth: 12,
      expirationYear: 2030,
      securityCode: '123',
    }
    const canceled = tokenizeCard('pkey_test_canceled', card, controller.signal).catch(
      (error: unknown) => error,
    )
    const active = tokenizeCard('pkey_test_active', card)
    expect(scripts()).toHaveLength(1)
    controller.abort()
    const client = sdk()
    vi.mocked(client.createToken).mockImplementation((_type, _card, callback) => {
      callback(200, { id: 'tokn_test_active' })
    })
    window.Omise = client
    scripts()[0]!.dispatchEvent(new Event('load'))
    expect(await canceled).toMatchObject({ name: 'AbortError' })
    await expect(active).resolves.toBe('tokn_test_active')
    expect(client.setPublicKey).toHaveBeenCalledExactlyOnceWith('pkey_test_active')
    expect(client.createToken).toHaveBeenCalledTimes(1)
  })

  it('loads the SDK before setting the public key and tokenizing a card', async () => {
    const { tokenizeCard } = await import('@/api/payments')
    const card = {
      name: 'Test Buyer',
      number: '4242424242424242',
      expirationMonth: 12,
      expirationYear: 2030,
      securityCode: '123',
    }
    const token = tokenizeCard('pkey_test_123', card)
    expect(scripts()).toHaveLength(1)
    const client = sdk()
    vi.mocked(client.createToken).mockImplementation((_type, _card, callback) => {
      callback(200, { id: 'tokn_test_123' })
    })
    window.Omise = client
    scripts()[0]!.dispatchEvent(new Event('load'))
    await expect(token).resolves.toBe('tokn_test_123')
    expect(client.setPublicKey).toHaveBeenCalledWith('pkey_test_123')
    expect(client.createToken).toHaveBeenCalledWith(
      'card',
      {
        name: card.name,
        number: card.number,
        expiration_month: 12,
        expiration_year: 2030,
        security_code: '123',
      },
      expect.any(Function),
    )
  })
})
