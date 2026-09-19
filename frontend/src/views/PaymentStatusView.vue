<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import CheckoutFooter from '@/components/payment/CheckoutFooter.vue'
import CheckoutNavbar from '@/components/payment/CheckoutNavbar.vue'
import { checkoutTokenFor, getPayment, type PaymentView } from '@/api/payments'

const route = useRoute()
const payment = ref<PaymentView | null>(null)
const errorMessage = ref('')
let pollTimer: ReturnType<typeof setTimeout> | undefined

const paymentId = computed(() =>
  typeof route.query.paymentId === 'string' && /^[0-9a-f-]{36}$/i.test(route.query.paymentId)
    ? route.query.paymentId
    : '',
)
const terminal = computed(() =>
  ['successful', 'failed', 'expired', 'review'].includes(payment.value?.status ?? ''),
)
const heading = computed(() => {
  if (payment.value?.status === 'successful') return 'Payment successful'
  if (payment.value?.status === 'failed') return 'Payment failed'
  if (payment.value?.status === 'expired') return 'Payment expired'
  if (payment.value?.status === 'review') return 'Payment under review'
  return 'Confirming your payment'
})

onMounted(load)
onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
})

async function load() {
  const checkoutToken = paymentId.value ? checkoutTokenFor(paymentId.value) : null
  if (!paymentId.value || !checkoutToken) {
    errorMessage.value = 'This checkout session is missing or has expired.'
    return
  }
  try {
    payment.value = await getPayment(paymentId.value, checkoutToken)
    errorMessage.value = ''
    if (!terminal.value) pollTimer = setTimeout(load, 2000)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load payment status'
    pollTimer = setTimeout(load, 5000)
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
        <p v-if="!payment && !errorMessage" role="status" class="mt-6 text-gray-700">
          Checking with the payment provider…
        </p>
        <p v-if="errorMessage" role="alert" class="mt-6 text-red-700">{{ errorMessage }}</p>
        <p v-if="payment?.status === 'pending'" role="status" class="mt-6 text-gray-700">
          This page will update automatically.
        </p>
        <p v-if="payment?.failureMessage" class="mt-4 text-sm text-red-700">
          {{ payment.failureMessage }}
        </p>
        <RouterLink
          to="/payment"
          class="mt-8 inline-block font-semibold text-blue-600 hover:text-blue-900"
          >Back to payment</RouterLink
        >
      </section>
    </main>
    <CheckoutFooter />
  </div>
</template>
