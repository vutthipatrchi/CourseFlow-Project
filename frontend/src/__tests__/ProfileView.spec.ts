import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import ProfileView from '@/views/ProfileView.vue'
import { loadProfile, updateProfile, profileError, profileLoading } from '@/profile/profileStore'

vi.mock('@clerk/vue', () => ({ useUser: () => ({ user: { value: null } }) }))
vi.mock('@/profile/profileStore', async () => {
  const { ref } = await import('vue')
  return {
    loadProfile: vi.fn<typeof loadProfile>(),
    updateProfile: vi.fn<typeof updateProfile>(),
    profileLoading: ref(false),
    profileError: ref(''),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  profileError.value = ''
  profileLoading.value = false
})

describe('profile loading failure', () => {
  it('shows timeout feedback, blocks empty saves, and restores editing after retry', async () => {
    vi.mocked(loadProfile)
      .mockImplementationOnce(async () => {
        profileError.value = 'Loading took too long. Please try again.'
        throw new Error(profileError.value)
      })
      .mockImplementationOnce(async () => {
        profileError.value = ''
        return {
          name: 'Existing name',
          dateOfBirth: null,
          educationalBackground: null,
          email: 'user@example.com',
        }
      })
    const wrapper = mount(ProfileView, {
      global: { stubs: { AppNavbar: true, AppFooter: true } },
    })
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Loading took too long')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    expect(updateProfile).not.toHaveBeenCalled()

    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect((wrapper.get('#name').element as HTMLInputElement).value).toBe('Existing name')
    expect(wrapper.get('button[type="submit"]').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })
})
