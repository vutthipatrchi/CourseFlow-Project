<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSignIn, getToken } from '@clerk/vue'
import type { SignInResource } from '@clerk/shared/types'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import dotSmall from '@/assets/landing/dot-small.svg'
import heroCross from '@/assets/landing/hero-cross.svg'
import { getRoleFromToken } from '@/lib/jwt'

const router = useRouter()
const route = useRoute()
const { isLoaded, signIn, setActive } = useSignIn()

const email = ref('')
const password = ref('')
const verificationCode = ref('')
const step = ref<'credentials' | 'verify'>('credentials')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function finishSignIn(result: SignInResource) {
  const activateSession = setActive.value
  if (!activateSession || !result.createdSessionId) return
  await activateSession({ session: result.createdSessionId })

  if (typeof route.query.redirect === 'string') {
    const requestedPath = route.query.redirect
    const redirectPath =
      requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/'
    await router.push(redirectPath)
  } else {
    const role = getRoleFromToken(await getToken())
    await router.push(role === 'admin' ? '/admin/courses' : '/')
  }
}

async function handleSubmit() {
  const activeSignIn = signIn.value
  if (!isLoaded.value || !activeSignIn || isSubmitting.value) return
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const result = await activeSignIn.create({
      identifier: email.value,
      password: password.value,
    })

    if (result.status === 'complete') {
      await finishSignIn(result)
    } else if (result.supportedSecondFactors?.some((f) => f.strategy === 'email_code')) {
      // New device / no MFA configured: Clerk asks for an email code before
      // trusting this session. See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
      await activeSignIn.prepareSecondFactor({ strategy: 'email_code' })
      step.value = 'verify'
    } else {
      errorMessage.value = 'Additional verification is required to finish signing in.'
    }
  } catch (err) {
    const clerkError = err as { errors?: { message?: string }[] }
    errorMessage.value = clerkError.errors?.[0]?.message ?? 'Could not sign in. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleVerify() {
  const activeSignIn = signIn.value
  if (!isLoaded.value || !activeSignIn || isSubmitting.value) return
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const result = await activeSignIn.attemptSecondFactor({
      strategy: 'email_code',
      code: verificationCode.value,
    })

    if (result.status === 'complete') {
      await finishSignIn(result)
    } else {
      errorMessage.value = 'That code didn’t work. Please try again.'
    }
  } catch (err) {
    const clerkError = err as { errors?: { message?: string }[] }
    errorMessage.value = clerkError.errors?.[0]?.message ?? 'Could not verify that code.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div>
    <AppNavbar />

    <section
      class="relative flex min-h-[calc(100vh-76px)] items-center justify-center overflow-hidden bg-blue-100"
    >
      <!-- decorative shapes -->
      <span
        class="absolute left-[6%] top-[130px] hidden h-20 w-20 rounded-full bg-blue-200 md:block"
      ></span>
      <img
        :src="heroCross"
        alt=""
        aria-hidden="true"
        class="absolute left-[13%] top-[210px] hidden h-5 w-5 md:block"
      />
      <span
        class="pointer-events-none absolute -right-32 -top-32 hidden h-[550px] w-[550px] rounded-full bg-blue-600 md:block"
      ></span>
      <span
        class="absolute right-[5%] top-[420px] hidden h-12 w-12 rounded-full border-2 border-orange-500 md:block"
      ></span>
      <span
        class="pointer-events-none absolute -bottom-32 -left-32 hidden h-[450px] w-[450px] rounded-full bg-orange-500 md:block"
      ></span>
      <img
        :src="dotSmall"
        alt=""
        aria-hidden="true"
        class="absolute right-[4%] bottom-[80px] hidden h-6 w-6 md:block"
      />

      <div class="relative w-full max-w-md px-6">
        <template v-if="step === 'credentials'">
          <h1 class="text-3xl font-bold text-darkblue-500">Welcome back!</h1>

          <form class="mt-8 space-y-5" @submit.prevent="handleSubmit">
            <div>
              <label for="email" class="text-sm font-medium text-gray-900">Email</label>
              <input
                id="email"
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="Enter Email"
                required
                class="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div>
              <label for="password" class="text-sm font-medium text-gray-900">Password</label>
              <input
                id="password"
                v-model="password"
                type="password"
                autocomplete="current-password"
                placeholder="Enter password"
                required
                class="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <p v-if="errorMessage" role="alert" class="text-sm text-red-600">{{ errorMessage }}</p>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSubmitting ? 'Logging in…' : 'Log in' }}
            </button>
          </form>

          <p class="mt-6 text-sm text-gray-600">
            Don't have an account?
            <router-link to="/sign-up" class="font-semibold text-blue-600 hover:text-blue-700">
              Register
            </router-link>
          </p>
        </template>

        <template v-else>
          <h1 class="text-3xl font-bold text-darkblue-500">Check your email</h1>
          <p class="mt-2 text-sm text-gray-600">
            We sent a verification code to <strong>{{ email }}</strong> to confirm it's you on this
            device.
          </p>

          <form class="mt-8 space-y-5" @submit.prevent="handleVerify">
            <div>
              <label for="code" class="text-sm font-medium text-gray-900">Verification code</label>
              <input
                id="code"
                v-model="verificationCode"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                placeholder="Enter code"
                required
                class="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <p v-if="errorMessage" role="alert" class="text-sm text-red-600">{{ errorMessage }}</p>

            <button
              type="submit"
              :disabled="isSubmitting"
              class="w-full rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSubmitting ? 'Verifying…' : 'Verify' }}
            </button>
          </form>
        </template>
      </div>
    </section>
  </div>
</template>
