<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUser } from '@clerk/vue'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import AppFooter from '@/components/landing/AppFooter.vue'
import iconPerson from '@/assets/landing/icon-person.svg'
import heroTriangle from '@/assets/landing/hero-triangle.svg'
import { loadProfile, updateProfile, profileLoading, profileError } from '@/profile/profileStore'
import { useToast } from '@/composables/useToast'
import Spinner from '@/components/common/Spinner.vue'

const { user } = useUser()
const { success: notifySuccess, error: notifyError } = useToast()

const name = ref('')
const dateOfBirth = ref('')
const educationalBackground = ref('')
const email = computed(() => user.value?.primaryEmailAddress?.emailAddress ?? '')

const fileInput = ref<HTMLInputElement | null>(null)
const isSaving = ref(false)
const isUploadingPhoto = ref(false)
const errorMessage = ref('')
const profileReady = ref(false)

async function initializeProfile() {
  profileReady.value = false
  try {
    const loaded = await loadProfile()
    name.value = loaded.name ?? ''
    dateOfBirth.value = loaded.dateOfBirth ?? ''
    educationalBackground.value = loaded.educationalBackground ?? ''
    profileReady.value = true
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to load profile')
  }
}
onMounted(initializeProfile)

function pickPhoto() {
  fileInput.value?.click()
}

async function onPhotoSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file || !user.value) return

  isUploadingPhoto.value = true
  try {
    await user.value.setProfileImage({ file })
    notifySuccess('Profile photo updated.')
  } catch (error) {
    // Previously silent: nothing caught a failed upload, so it only ever surfaced as an
    // unhandled rejection in the browser console.
    notifyError(error instanceof Error ? error.message : 'Unable to update profile photo.')
  } finally {
    isUploadingPhoto.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function removePhoto() {
  if (!user.value) return
  isUploadingPhoto.value = true
  try {
    await user.value.setProfileImage({ file: null })
    notifySuccess('Profile photo removed.')
  } catch (error) {
    notifyError(error instanceof Error ? error.message : 'Unable to remove profile photo.')
  } finally {
    isUploadingPhoto.value = false
  }
}

async function handleSubmit() {
  if (isSaving.value || !profileReady.value) return
  errorMessage.value = ''
  isSaving.value = true
  try {
    await updateProfile({
      name: name.value.trim(),
      dateOfBirth: dateOfBirth.value || null,
      educationalBackground: educationalBackground.value.trim() || null,
      email: email.value,
    })
    notifySuccess('Profile updated.')
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to update profile.'
    notifyError(errorMessage.value)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div>
    <AppNavbar />

    <section class="relative overflow-hidden bg-white py-16">
      <!-- decorative shapes, echoing the hero/sign-in pattern -->
      <span
        class="pointer-events-none absolute left-[7%] top-[190px] hidden h-2 w-2 rounded-full border-2 border-blue-600 md:block"
      ></span>
      <span
        class="pointer-events-none absolute left-[4%] top-[260px] hidden h-8 w-8 rounded-full bg-blue-100 md:block"
      ></span>
      <img
        :src="heroTriangle"
        alt=""
        aria-hidden="true"
        class="pointer-events-none absolute right-[7%] top-[230px] hidden h-9 w-9 md:block"
      />
      <span
        class="pointer-events-none absolute -right-24 top-[320px] hidden h-40 w-40 rounded-full bg-blue-200/60 md:block"
      ></span>

      <div class="relative mx-auto max-w-4xl px-6">
        <h1 class="text-3xl font-bold text-gray-900">Profile</h1>

        <form
          class="mt-10 grid grid-cols-1 gap-12 md:grid-cols-[minmax(0,280px)_1fr]"
          @submit.prevent="handleSubmit"
        >
          <div>
            <div class="aspect-square w-full overflow-hidden rounded-lg bg-blue-50">
              <img
                v-if="user?.hasImage"
                :src="user.imageUrl"
                :alt="user.fullName ?? 'Profile photo'"
                class="h-full w-full object-cover"
              />
              <div v-else class="flex h-full w-full items-center justify-center">
                <img :src="iconPerson" alt="" aria-hidden="true" class="h-24 w-24 opacity-60" />
              </div>
            </div>

            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onPhotoSelected"
            />

            <button
              type="button"
              :disabled="isUploadingPhoto"
              class="mt-4 flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              @click="pickPhoto"
            >
              <Spinner v-if="isUploadingPhoto" size="xs" inverted />
              <template v-else>{{ user?.hasImage ? 'Change photo' : 'Upload photo' }}</template>
            </button>

            <button
              v-if="user?.hasImage"
              type="button"
              :disabled="isUploadingPhoto"
              class="mt-3 flex w-full items-center justify-center text-center text-sm font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              @click="removePhoto"
            >
              <Spinner v-if="isUploadingPhoto" size="xs" />
              <template v-else>Remove photo</template>
            </button>
          </div>

          <div>
            <div>
              <label for="name" class="text-sm font-medium text-gray-900">Name</label>
              <input
                id="name"
                v-model="name"
                :disabled="!profileReady"
                type="text"
                required
                class="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div class="mt-6">
              <label for="dob" class="text-sm font-medium text-gray-900">Date of Birth</label>
              <input
                id="dob"
                v-model="dateOfBirth"
                :disabled="!profileReady"
                type="date"
                class="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div class="mt-6">
              <label for="education" class="text-sm font-medium text-gray-900"
                >Educational Background</label
              >
              <input
                id="education"
                v-model="educationalBackground"
                :disabled="!profileReady"
                type="text"
                class="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div class="mt-6">
              <label for="email" class="text-sm font-medium text-gray-900">Email</label>
              <input
                id="email"
                :value="email"
                type="email"
                readonly
                class="mt-1.5 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
              />
            </div>

            <p v-if="profileLoading" role="status" class="mt-6">
              <Spinner label="Loading profile…" />
            </p>
            <div v-else-if="profileError" role="alert" class="mt-6 text-sm text-red-600">
              <p>{{ profileError }}</p>
              <button type="button" class="mt-2 text-blue-600 underline" @click="initializeProfile">
                Try again
              </button>
            </div>
            <p v-if="errorMessage" role="alert" class="mt-6 text-sm text-red-600">
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              :disabled="isSaving || !profileReady"
              class="mt-6 flex w-full items-center justify-center rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Spinner v-if="isSaving" size="xs" inverted />
              <template v-else>Update Profile</template>
            </button>
          </div>
        </form>
      </div>
    </section>

    <AppFooter />
  </div>
</template>
