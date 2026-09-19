<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import CheckoutFooter from '@/components/payment/CheckoutFooter.vue'
import CheckoutNavbar from '@/components/payment/CheckoutNavbar.vue'
import { formatThb } from '@/lib/payment'
import { checkoutTokenFor, downloadQr, getPayment, type PaymentView } from '@/lib/payment-api'

const route = useRoute()
const payment = ref<PaymentView | null>(null)
const qrBlob = ref<Blob | null>(null)
const qrSrc = ref('')
const errorMessage = ref('')
const loading = ref(true)
let pollTimer: ReturnType<typeof setTimeout> | undefined

const paymentId = computed(() =>
  typeof route.query.paymentId === 'string' && /^[0-9a-f-]{36}$/i.test(route.query.paymentId)
    ? route.query.paymentId
    : '',
)
const amount = computed(() => (payment.value?.amountSatang ?? 0) / 100)
const terminal = computed(() =>
  ['successful', 'failed', 'expired', 'review'].includes(payment.value?.status ?? ''),
)

onMounted(load)
onUnmounted(() => {
  if (pollTimer) clearTimeout(pollTimer)
  if (qrSrc.value) URL.revokeObjectURL(qrSrc.value)
})

async function load() {
  const checkoutToken = paymentId.value ? checkoutTokenFor(paymentId.value) : null
  if (!paymentId.value || !checkoutToken) {
    errorMessage.value = 'This checkout session is missing or has expired.'
    loading.value = false
    return
  }

  try {
    payment.value = await getPayment(paymentId.value, checkoutToken)
    if (!qrBlob.value && payment.value.qrUrl) {
      qrBlob.value = await downloadQr(paymentId.value, checkoutToken)
      qrSrc.value = URL.createObjectURL(qrBlob.value)
    }
    errorMessage.value = ''
    if (!terminal.value) pollTimer = setTimeout(load, 2000)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Unable to load QR payment'
    pollTimer = setTimeout(load, 5000)
  } finally {
    loading.value = false
  }
}

function saveQrImage() {
  if (!qrBlob.value || !payment.value) return
  const url = URL.createObjectURL(qrBlob.value)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `courseflow-qr-${payment.value.reference}.png`
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <CheckoutNavbar />
    <main class="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <section class="flex w-full max-w-[420px] flex-col items-center text-center">
        <h1 class="text-xl font-medium text-black">Scan QR code</h1>
        <p v-if="payment" class="mt-1 text-xs text-gray-600">
          Reference no. {{ payment.reference }}
        </p>
        <p v-if="payment" class="mt-3 text-lg font-medium text-orange-500">
          {{ formatThb(amount) }}
        </p>

        <p v-if="loading" role="status" class="mt-8 text-sm text-gray-700">
          Loading secure QR code…
        </p>
        <p v-else-if="errorMessage" role="alert" class="mt-8 text-sm text-red-700">
          {{ errorMessage }}
        </p>
        <template v-else-if="payment">
          <img
            v-if="qrSrc"
            :src="qrSrc"
            :alt="`QR code for reference ${payment.reference}`"
            class="mt-6 h-[190px] w-[190px]"
          />
          <p
            v-if="payment.status === 'successful'"
            role="status"
            class="mt-6 font-medium text-green-700"
          >
            Payment successful
          </p>
          <p
            v-else-if="payment.status === 'pending'"
            role="status"
            class="mt-4 text-sm text-gray-700"
          >
            Waiting for payment confirmation…
          </p>
          <p v-else role="alert" class="mt-6 text-sm text-red-700">
            {{ payment.failureMessage || `Payment status: ${payment.status}` }}
          </p>
          <button
            type="button"
            :disabled="!qrBlob"
            class="mt-8 min-h-14 w-full max-w-[290px] rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white shadow-[4px_4px_16px_rgba(0,0,0,0.08)] hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 disabled:bg-gray-400"
            @click="saveQrImage"
          >
            Save QR image
          </button>
        </template>

        <RouterLink
          to="/payment"
          class="mt-5 text-sm font-semibold text-blue-600 hover:text-blue-900"
          >Back to payment</RouterLink
        >
      </section>
    </main>
    <CheckoutFooter />
  </div>
</template>
