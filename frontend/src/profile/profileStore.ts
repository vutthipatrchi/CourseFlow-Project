import { getToken } from '@clerk/vue'
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

const API_URL = '/api/me/profile'

export const profile = ref<UserProfile | null>(null)
export const profileLoading = ref(false)
export const profileError = ref('')

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = await getToken()
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { detail?: string; message?: string }
      message = body.detail || body.message || message
    } catch {
      // Keep the HTTP fallback when the backend did not return JSON.
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

export async function loadProfile() {
  profileLoading.value = true
  profileError.value = ''
  try {
    profile.value = await request<UserProfile>(API_URL)
    return profile.value
  } catch (error) {
    profileError.value = error instanceof Error ? error.message : 'Unable to load profile'
    throw error
  } finally {
    profileLoading.value = false
  }
}

export async function updateProfile(payload: UserProfilePayload) {
  const updated = await request<UserProfile>(API_URL, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  profile.value = updated
  return updated
}
