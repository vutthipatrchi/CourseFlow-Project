import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import UserMenu from '@/components/landing/UserMenu.vue'

const mocks = vi.hoisted(() => ({
  signOut: vi.fn<() => Promise<void>>(),
}))
vi.mock('@clerk/vue', () => ({
  getToken: vi.fn<() => Promise<string | null>>(async () => null),
  useUser: () => ({ user: ref({ fullName: 'Test Student', imageUrl: '', hasImage: false }) }),
  useClerk: () => ref({ signOut: mocks.signOut }),
}))

async function mountMenu() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/profile', component: { template: '<div>Profile</div>' } },
      { path: '/my-courses', component: { template: '<div>My Courses</div>' } },
      { path: '/my-assignments', component: { template: '<div>My Assignments</div>' } },
      { path: '/wishlist', component: { template: '<div>Wishlist</div>' } },
    ],
  })
  await router.push('/')
  await router.isReady()
  const wrapper = mount(UserMenu, { global: { plugins: [router] } })
  await flushPromises()
  await wrapper.get('button').trigger('click')
  return { wrapper, router }
}

describe('UserMenu log out', () => {
  beforeEach(() => {
    mocks.signOut.mockReset().mockResolvedValue(undefined)
  })

  it('raises a success toast and returns to the home page', async () => {
    const successSpy = vi.spyOn(toast, 'success')
    const { wrapper, router } = await mountMenu()

    await wrapper.get('button.w-full').trigger('click')
    await flushPromises()

    expect(mocks.signOut).toHaveBeenCalled()
    expect(successSpy).toHaveBeenCalledWith('Signed out successfully!')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('raises a matching toast when signing out fails', async () => {
    mocks.signOut.mockRejectedValue(new Error('The server is unreachable.'))
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper } = await mountMenu()

    await wrapper.get('button.w-full').trigger('click')
    await flushPromises()

    expect(errorSpy).toHaveBeenCalledWith('The server is unreachable.')
  })
})
