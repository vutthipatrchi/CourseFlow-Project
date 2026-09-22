<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CheckoutFooter from '@/components/payment/CheckoutFooter.vue'
import CheckoutNavbar from '@/components/payment/CheckoutNavbar.vue'
import { downloadQr } from '@/api/payments'
import { usePaymentStatus } from '@/lib/usePaymentStatus'
import { formatThb } from '@/lib/payment'

const route = useRoute()
const paymentId = computed(() =>
  typeof route.query.paymentId === 'string' ? route.query.paymentId : '',
)
const { payment, errorMessage, loading } = usePaymentStatus(paymentId)
const qrBlob = ref<Blob | null>(null)
const qrSrc = ref('')
const qrError = ref('')
let disposed = false
let downloading = false
watch(payment, async (next) => {
  if (!next?.qrUrl || next.status !== 'pending' || qrBlob.value || downloading) return
  downloading = true
  try {
    const blob = await downloadQr(next.paymentId)
    if (disposed || paymentId.value !== next.paymentId) return
    qrBlob.value = blob
    qrSrc.value = URL.createObjectURL(blob)
    qrError.value = ''
  } catch (error) {
    if (!disposed) qrError.value = error instanceof Error ? error.message : 'Unable to load QR code'
  } finally {
    downloading = false
  }
})
watch(paymentId, () => {
  if (qrSrc.value) URL.revokeObjectURL(qrSrc.value)
  qrBlob.value = null
  qrSrc.value = ''
})
onUnmounted(() => {
  disposed = true
  if (qrSrc.value) URL.revokeObjectURL(qrSrc.value)
})
function saveQrImage() {
  if (!qrBlob.value || !payment.value) return
  const url = URL.createObjectURL(qrBlob.value)
  const extension =
    qrBlob.value.type === 'image/svg+xml'
      ? 'svg'
      : qrBlob.value.type === 'image/jpeg'
        ? 'jpg'
        : 'png'
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `courseflow-qr-${payment.value.reference}.${extension}`
  anchor.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <CheckoutNavbar />
    <main class="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
      <section class="flex w-full max-w-[420px] flex-col items-center text-center">
        <h1 class="text-xl font-medium text-black">
          {{ payment?.status === 'successful' ? 'Payment successful' : 'Scan QR code' }}
        </h1>
        <p v-if="payment" class="mt-1 text-xs text-gray-600">
          Reference no. {{ payment.reference }}
        </p>
        <p v-if="payment" class="mt-3 text-lg font-medium text-orange-500">
          {{ formatThb(payment.amountSatang / 100) }}
        </p>
        <p v-if="loading" role="status" class="mt-8 text-sm text-gray-700">
          Loading secure QR code…
        </p>
        <p v-if="errorMessage || qrError" role="alert" class="mt-8 text-sm text-red-700">
          {{ errorMessage || qrError }}
        </p>
        <template v-if="payment?.status === 'pending'">
          <img
            v-if="qrSrc"
            :src="qrSrc"
            :alt="`QR code for reference ${payment.reference}`"
            class="mt-6 h-[220px] w-[220px]"
          />
          <p role="status" class="mt-4 text-sm text-gray-700">Waiting for payment confirmation…</p>
          <p class="mt-2 text-xs text-gray-600">
            Expires {{ new Date(payment.expiresAt).toLocaleString() }}
          </p>
          <button
            type="button"
            :disabled="!qrBlob"
            class="mt-8 min-h-14 w-full max-w-[290px] rounded-xl bg-blue-600 px-6 py-4 text-sm font-semibold text-white disabled:bg-gray-400"
            @click="saveQrImage"
          >
            Save QR image
          </button>
        </template>
        <RouterLink
          v-if="payment?.status === 'successful'"
          to="/my-courses"
          class="mt-8 font-semibold text-blue-600"
          >View my courses</RouterLink
        >
        <p
          v-else-if="payment && payment.status !== 'pending'"
          role="status"
          class="mt-6 text-sm text-gray-700"
        >
          {{ payment.failureMessage || `Payment status: ${payment.status}` }}
        </p>
        <RouterLink
          v-if="payment && ['failed', 'expired'].includes(payment.status)"
          :to="{ name: 'payment', query: { courseId: payment.courseId } }"
          class="mt-6 font-semibold text-blue-600"
          >Try another payment</RouterLink
        >
        <RouterLink to="/" class="mt-6 text-sm text-blue-600">Back to home</RouterLink>
      </section>
    </main>
    <CheckoutFooter />
  </div>
</template>
