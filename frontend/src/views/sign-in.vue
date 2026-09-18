<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSignIn } from '@clerk/vue'
import AppNavbar from '@/components/landing/AppNavbar.vue'
import dotSmall from '@/assets/landing/dot-small.svg'
import heroCross from '@/assets/landing/hero-cross.svg'

const router = useRouter()
const route = useRoute()
const { isLoaded, signIn, setActive } = useSignIn()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

async function handleSubmit() {
  const activeSignIn = signIn.value
  const activateSession = setActive.value
  if (!isLoaded.value || !activeSignIn || !activateSession || isSubmitting.value) return
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const result = await activeSignIn.create({
      identifier: email.value,
      password: password.value,
    })

    if (result.status === 'complete') {
      await activateSession({ session: result.createdSessionId })
      const requestedPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
      const redirectPath =
        requestedPath.startsWith('/') && !requestedPath.startsWith('//') ? requestedPath : '/'
      await router.push(redirectPath)
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
              class="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
              class="mt-1.5 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
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
      </div>
    </section>
  </div>
</template>
