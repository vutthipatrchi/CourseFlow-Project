import { describe, expect, it } from 'vitest'
import { hasScrolledToPageBottom } from '@/lib/scrollComplete'

function setScroll({
  scrollHeight,
  innerHeight,
  scrollY,
}: {
  scrollHeight: number
  innerHeight: number
  scrollY: number
}) {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: scrollHeight,
  })
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: innerHeight })
  Object.defineProperty(window, 'scrollY', { configurable: true, value: scrollY })
}

describe('hasScrolledToPageBottom', () => {
  it('is false while still near the top of a long page', () => {
    setScroll({ scrollHeight: 2000, innerHeight: 800, scrollY: 0 })
    expect(hasScrolledToPageBottom()).toBe(false)
  })

  it('is false when the page is too short to scroll', () => {
    setScroll({ scrollHeight: 800, innerHeight: 800, scrollY: 0 })
    expect(hasScrolledToPageBottom()).toBe(false)
  })

  it('is true only after scrolling to the bottom of a long page', () => {
    setScroll({ scrollHeight: 2000, innerHeight: 800, scrollY: 1200 })
    expect(hasScrolledToPageBottom()).toBe(true)
  })
})
