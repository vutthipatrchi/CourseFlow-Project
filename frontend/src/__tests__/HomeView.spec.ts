import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import HomeView from '../views/HomeView.vue'

afterEach(() => vi.unstubAllGlobals())

describe('backend connection', () => {
  it('shows a successful health response', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ status: 'UP' }))
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(HomeView)
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledWith('/api/health')
    expect(wrapper.get('[role="status"]').text()).toBe('Backend connected')
    wrapper.unmount()
  })

  it.each([new Response(null, { status: 503 }), Response.json({ status: 'DOWN' })])(
    'shows an unavailable backend for an unhealthy response',
    async (response) => {
      vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(response))
      const wrapper = mount(HomeView)
      await flushPromises()
      expect(wrapper.get('[role="status"]').text()).toContain('Backend unavailable')
      wrapper.unmount()
    },
  )

  it('handles a network failure', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new Error('Connection refused')))
    const wrapper = mount(HomeView)
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('Backend unavailable')
    wrapper.unmount()
  })
})
