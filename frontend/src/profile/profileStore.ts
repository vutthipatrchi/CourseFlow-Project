import client from '@/api/client'
import { ref } from 'vue'

export type UserProfile = {
  name: string | null
  dateOfBirth: string | null
  educationalBackground: string | null
  email: string | null
}

export type UserProfilePayload = {
  name: string
  dateOfBirth: string | null
  educationalBackground: string | null
  email: string
}

const API_URL = '/me/profile'

export const profile = ref<UserProfile | null>(null)
export const profileLoading = ref(false)
export const profileError = ref('')

export async function loadProfile() {
  profileLoading.value = true
  profileError.value = ''
  try {
    profile.value = (await client.get<UserProfile>(API_URL)).data
    return profile.value
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Unable to load profile'
    throw error
  } finally {
    profileLoading.value = false
  }
}

export async function updateProfile(payload: UserProfilePayload) {
  const { data: updated } = await client.patch<UserProfile>(API_URL, payload)
  profile.value = updated
  return updated
}
