import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import ProfileView from '@/views/ProfileView.vue'
import type { UserProfile, UserProfilePayload } from '@/profile/profileStore'

const mocks = vi.hoisted(() => ({
  loadProfile: vi.fn<() => Promise<UserProfile>>(),
  updateProfile: vi.fn<(payload: UserProfilePayload) => Promise<UserProfile>>(),
  setProfileImage: vi.fn<(params: { file: File | null }) => Promise<unknown>>(),
}))
vi.mock('@/profile/profileStore', () => ({
  loadProfile: mocks.loadProfile,
  updateProfile: mocks.updateProfile,
}))
vi.mock('@clerk/vue', () => ({
  useUser: () => ({
    user: ref({
      hasImage: false,
      imageUrl: '',
      fullName: 'Test Student',
      primaryEmailAddress: { emailAddress: 'student@example.com' },
      setProfileImage: mocks.setProfileImage,
    }),
  }),
}))
vi.mock('@/components/landing/AppNavbar.vue', () => ({
  default: { template: '<header>Navbar</header>' },
}))
vi.mock('@/components/landing/AppFooter.vue', () => ({
  default: { template: '<footer>Footer</footer>' },
}))

async function mountView() {
  const wrapper = mount(ProfileView)
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.loadProfile.mockResolvedValue({
    name: 'Test Student',
    dateOfBirth: '2000-01-01',
    educationalBackground: 'Bachelor',
    email: 'student@example.com',
  })
  mocks.setProfileImage.mockResolvedValue(undefined)
})

describe('ProfileView', () => {
  it('loads the profile into the form', async () => {
    const wrapper = await mountView()

    expect((wrapper.get('#name').element as HTMLInputElement).value).toBe('Test Student')
    expect((wrapper.get('#education').element as HTMLInputElement).value).toBe('Bachelor')
  })

  it('shows an inline error and a matching toast when the profile fails to load', async () => {
    mocks.loadProfile.mockRejectedValue(new Error('The server is unreachable.'))
    const errorSpy = vi.spyOn(toast, 'error')

    const wrapper = await mountView()

    expect(wrapper.get('[role="alert"]').text()).toBe('The server is unreachable.')
    expect(errorSpy).toHaveBeenCalledWith('The server is unreachable.')
  })

  it('raises a success toast when the profile is updated', async () => {
    mocks.updateProfile.mockResolvedValue({
      name: 'New Name',
      dateOfBirth: null,
      educationalBackground: null,
      email: 'student@example.com',
    })
    const successSpy = vi.spyOn(toast, 'success')
    const wrapper = await mountView()

    await wrapper.get('#name').setValue('New Name')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain('Profile updated.')
    expect(successSpy).toHaveBeenCalledWith('Profile updated.')
  })

  it('shows an inline error and a matching toast when updating the profile fails', async () => {
    mocks.updateProfile.mockRejectedValue(new Error('That name is not allowed.'))
    const errorSpy = vi.spyOn(toast, 'error')
    const wrapper = await mountView()

    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toBe('That name is not allowed.')
    expect(errorSpy).toHaveBeenCalledWith('That name is not allowed.')
  })

  it('raises a success toast when a profile photo is uploaded', async () => {
    const successSpy = vi.spyOn(toast, 'success')
    const wrapper = await mountView()

    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['data'], 'photo.png', { type: 'image/png' })],
    })
    await input.trigger('change')
    await flushPromises()

    expect(mocks.setProfileImage).toHaveBeenCalled()
    expect(successSpy).toHaveBeenCalledWith('Profile photo updated.')
  })

  it('raises a matching toast when uploading a profile photo fails', async () => {
    mocks.setProfileImage.mockRejectedValue(new Error('The file is too large.'))
    const errorSpy = vi.spyOn(toast, 'error')
    const wrapper = await mountView()

    const input = wrapper.get('input[type="file"]')
    Object.defineProperty(input.element, 'files', {
      value: [new File(['data'], 'photo.png', { type: 'image/png' })],
    })
    await input.trigger('change')
    await flushPromises()

    expect(errorSpy).toHaveBeenCalledWith('The file is too large.')
  })
})
