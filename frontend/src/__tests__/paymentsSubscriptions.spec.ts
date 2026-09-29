import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSubscriptions } from '@/api/payments'

const mocks = vi.hoisted(() => ({
  request: vi.fn<(config?: { url: string }) => Promise<{ data: unknown }>>(),
}))

vi.mock('@/api/client', () => ({
  default: { request: mocks.request },
  toApiError: (error: Error) => ({ message: error.message }),
}))

describe('getSubscriptions', () => {
  beforeEach(() => mocks.request.mockReset())

  it('shows active subscriptions in progress and fills missing progress from the course endpoint', async () => {
    mocks.request.mockImplementation(async (config?: { url: string }) => {
      if (!config) return { data: [] }
      const url = config?.url
      if (url === '/me/subscriptions')
        return {
          data: [
            {
              id: 'subscription-1',
              courseId: 7,
              courseTitle: 'Design Thinking Fundamentals',
              reference: 'CFTEST',
              activatedAt: '2026-09-22T00:00:00Z',
              status: 'active',
            },
          ],
        }
      if (url === '/me/courses/7/progress')
        return {
          data: {
            courseId: 7,
            completedLessons: 0,
            totalLessons: 8,
            progressPercent: 0,
            status: 'in-progress',
            subLessons: [],
          },
        }
      throw new Error(`Unexpected URL: ${url}`)
    })

    await expect(getSubscriptions()).resolves.toMatchObject([
      {
        status: 'in-progress',
        completedLessons: 0,
        totalLessons: 8,
        progressPercent: 0,
        progressAvailable: true,
      },
    ])
  })
})
