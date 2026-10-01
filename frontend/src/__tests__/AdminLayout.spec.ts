import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import AdminLayout from '@/components/admin/AdminLayout.vue'

const mocks = vi.hoisted(() => ({
  signOut: vi.fn<() => Promise<void>>(),
}))
vi.mock('@clerk/vue', () => ({
  useClerk: () => ref({ signOut: mocks.signOut }),
}))

async function mountLayout() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>Home</div>' } },
      { path: '/admin/courses', name: 'admin-courses', component: { template: '<div />' } },
      {
        path: '/admin/assignments',
        name: 'admin-assignments',
        component: { template: '<div />' },
      },
      {
        path: '/admin/promo-codes',
        name: 'admin-promo-codes',
        component: { template: '<div />' },
      },
    ],
  })
  await router.push('/admin/courses')
  await router.isReady()
  const wrapper = mount(AdminLayout, {
    props: { title: 'Course' },
    global: { plugins: [router] },
  })
  await flushPromises()
  return { wrapper, router }
}

describe('AdminLayout log out', () => {
  beforeEach(() => {
    mocks.signOut.mockReset().mockResolvedValue(undefined)
  })

  it('raises a success toast and returns to the home page', async () => {
    const successSpy = vi.spyOn(toast, 'success')
    const { wrapper, router } = await mountLayout()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Log out')!
      .trigger('click')
    await flushPromises()

    expect(mocks.signOut).toHaveBeenCalled()
    expect(successSpy).toHaveBeenCalledWith('Signed out successfully!')
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('raises a matching toast when signing out fails', async () => {
    mocks.signOut.mockRejectedValue(new Error('The server is unreachable.'))
    const errorSpy = vi.spyOn(toast, 'error')
    const { wrapper, router } = await mountLayout()

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Log out')!
      .trigger('click')
    await flushPromises()

    expect(errorSpy).toHaveBeenCalledWith('The server is unreachable.')
    expect(router.currentRoute.value.name).not.toBe('home')
  })
})
