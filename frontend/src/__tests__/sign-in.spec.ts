import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'vue-sonner'
import SignInView from '@/views/sign-in.vue'

const mocks = vi.hoisted(() => ({
  create: vi.fn<(params: { identifier: string; password: string }) => Promise<unknown>>(),
  prepareSecondFactor: vi.fn<(params: { strategy: string }) => Promise<unknown>>(),
  attemptSecondFactor: vi.fn<(params: { strategy: string; code: string }) => Promise<unknown>>(),
  setActive: vi.fn<(params: { session: string }) => Promise<void>>(),
  getToken: vi.fn<() => Promise<string | null>>(),
}))

vi.mock('@clerk/vue', () => ({
  useSignIn: () => ({
    isLoaded: { value: true },
    signIn: {
      value: {
        create: mocks.create,
        prepareSecondFactor: mocks.prepareSecondFactor,
        attemptSecondFactor: mocks.attemptSecondFactor,
      },
    },
    setActive: { value: mocks.setActive },
  }),
  getToken: mocks.getToken,
}))

async function mountSignIn() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/sign-in', component: { template: '<div />' } },
      { path: '/', component: { template: '<div />' } },
      { path: '/admin/courses', component: { template: '<div />' } },
    ],
  })
  await router.push('/sign-in')
  const wrapper = mount(SignInView, {
    global: { plugins: [router], stubs: { AppNavbar: true } },
  })
  return { wrapper, router }
}

async function submitCredentials(wrapper: Awaited<ReturnType<typeof mountSignIn>>['wrapper']) {
  await wrapper.get('#email').setValue('student@example.com')
  await wrapper.get('#password').setValue('secret123')
  await wrapper.get('form').trigger('submit')
  await flushPromises()
}

describe('sign-in', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.setActive.mockResolvedValue(undefined)
    mocks.getToken.mockResolvedValue('token-without-a-role-claim')
  })

  it('raises a success toast and redirects home after a complete sign-in', async () => {
    mocks.create.mockResolvedValue({ status: 'complete', createdSessionId: 'sess_1' })
    const successSpy = vi.spyOn(toast, 'success')

    const { wrapper, router } = await mountSignIn()
    await submitCredentials(wrapper)

    expect(successSpy).toHaveBeenCalledWith('Signed in successfully!')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('asks for a verification code without a toast when a second factor is required', async () => {
    mocks.create.mockResolvedValue({
      status: 'needs_second_factor',
      createdSessionId: null,
      supportedSecondFactors: [{ strategy: 'email_code' }],
    })
    const errorSpy = vi.spyOn(toast, 'error')
    const successSpy = vi.spyOn(toast, 'success')

    const { wrapper } = await mountSignIn()
    await submitCredentials(wrapper)

    expect(wrapper.text()).toContain('Check your email')
    expect(errorSpy).not.toHaveBeenCalled()
    expect(successSpy).not.toHaveBeenCalled()
  })

  it('shows an inline error and a matching toast when sign-in fails', async () => {
    mocks.create.mockRejectedValue({ errors: [{ message: 'Invalid password.' }] })
    const errorSpy = vi.spyOn(toast, 'error')

    const { wrapper } = await mountSignIn()
    await submitCredentials(wrapper)

    expect(wrapper.get('[role="alert"]').text()).toBe('Invalid password.')
    expect(errorSpy).toHaveBeenCalledWith('Invalid password.')
  })

  it('shows an inline error and a matching toast when the verification code is wrong', async () => {
    mocks.create.mockResolvedValue({
      status: 'needs_second_factor',
      createdSessionId: null,
      supportedSecondFactors: [{ strategy: 'email_code' }],
    })
    mocks.attemptSecondFactor.mockResolvedValue({ status: 'needs_second_factor' })
    const errorSpy = vi.spyOn(toast, 'error')

    const { wrapper } = await mountSignIn()
    await submitCredentials(wrapper)

    await wrapper.get('#code').setValue('000000')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('That code didn’t work. Please try again.')
    expect(errorSpy).toHaveBeenCalledWith('That code didn’t work. Please try again.')
  })
})
