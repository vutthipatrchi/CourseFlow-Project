<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import CheckoutFooter from '@/components/payment/CheckoutFooter.vue'
import CheckoutNavbar from '@/components/payment/CheckoutNavbar.vue'
import { continueCardAuthentication } from '@/api/payments'
import { usePaymentStatus } from '@/lib/usePaymentStatus'
import { formatThb } from '@/lib/payment'

const route = useRoute()
const paymentId = computed(() =>
  typeof route.query.paymentId === 'string' ? route.query.paymentId : '',
)
const { payment, errorMessage, loading } = usePaymentStatus(paymentId)
const redirectError = ref('')
const heading = computed(() => {
  if (payment.value?.status === 'successful') return 'Payment successful'
  if (payment.value?.status === 'failed') return 'Payment failed'
  if (payment.value?.status === 'expired') return 'Payment expired'
  if (payment.value?.status === 'review') return 'Confirming your payment'
  if (payment.value?.authorizeUrl) return 'Verify your card payment'
  return 'Confirming your payment'
})
function verifyCard() {
  if (!payment.value?.authorizeUrl) return
  try {
    continueCardAuthentication(payment.value.authorizeUrl)
  } catch (error) {
    redirectError.value =
      error instanceof Error ? error.message : 'Unable to open card verification'
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <CheckoutNavbar />
    <main class="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <section
        class="w-full max-w-[460px] rounded-xl bg-white p-8 text-center shadow-[4px_4px_24px_rgba(0,0,0,0.08)]"
      >
        <h1 class="text-2xl font-medium text-black">{{ heading }}</h1>
        <p v-if="payment" class="mt-3 text-sm text-gray-600">
          Reference no. {{ payment.reference }}
        </p>
        <p v-if="payment" class="mt-3 text-lg text-gray-700">
          {{ formatThb(payment.amountSatang / 100) }}
        </p>
        <p v-if="loading" role="status" class="mt-6 text-gray-700">
          Checking with the payment provider…
        </p>
        <p v-if="errorMessage || redirectError" role="alert" class="mt-6 text-red-700">
          {{ errorMessage || redirectError }}
        </p>
        <p
          v-if="payment?.status === 'creating' || payment?.status === 'review'"
          role="status"
          class="mt-6 text-gray-700"
        >
          We are checking your payment. Please do not pay again. You can return to this page later.
        </p>
        <p v-if="payment?.status === 'pending'" role="status" class="mt-6 text-gray-700">
          This page will update automatically.
        </p>
        <p v-if="payment?.failureMessage" class="mt-4 text-sm text-red-700">
          {{ payment.failureMessage }}
        </p>
        <button
          v-if="payment?.authorizeUrl"
          type="button"
          class="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white"
          @click="verifyCard"
        >
          Continue card verification
        </button>
        <RouterLink
          v-if="payment?.status === 'successful'"
          to="/my-courses"
          class="mt-8 block font-semibold text-blue-600"
        >
          View my courses
        </RouterLink>
        <RouterLink
          v-else-if="payment && ['failed', 'expired'].includes(payment.status)"
          :to="{ name: 'payment', query: { courseId: payment.courseId } }"
          class="mt-8 block font-semibold text-blue-600"
        >
          Try another payment
        </RouterLink>
        <RouterLink to="/" class="mt-6 block text-sm text-blue-600">Back to home</RouterLink>
      </section>
    </main>
    <CheckoutFooter />
  </div>
</template>
