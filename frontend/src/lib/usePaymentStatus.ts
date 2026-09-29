import { computed, onUnmounted, ref, watch, type Ref } from 'vue'
import { getPayment, type PaymentView } from '@/api/payments'
import { useToast } from '@/composables/useToast'

// Shared by PaymentStatusView.vue and PaymentQrView.vue, so the "it's done" toast fires exactly
// once no matter which of those two pages the user is polling on when the payment resolves.
export function usePaymentStatus(paymentId: Ref<string>) {
  const payment = ref<PaymentView | null>(null)
  const errorMessage = ref('')
  const loading = ref(true)
  const terminal = computed(() =>
    ['successful', 'failed', 'expired'].includes(payment.value?.status ?? ''),
  )
  const { success: notifySuccess, error: notifyError } = useToast()
  let generation = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  // Guards against re-toasting on every poll once resolved, or spamming a toast per transient
  // fetch failure while polling retries; reset whenever paymentId changes to a genuinely new payment.
  let resolved = false

  async function load(current = generation) {
    const id = paymentId.value
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      loading.value = false
      errorMessage.value = 'This payment link is invalid.'
      if (!resolved) {
        resolved = true
        notifyError('This payment link is invalid.')
      }
      return
    }
    try {
      const next = await getPayment(id)
      if (current !== generation) return
      payment.value = next
      errorMessage.value = ''
      if (!resolved && terminal.value) {
        resolved = true
        if (next.status === 'successful') {
          notifySuccess('Payment successful!', { description: `Reference no. ${next.reference}` })
        } else {
          notifyError(next.status === 'expired' ? 'Payment expired.' : 'Payment failed.', {
            description: next.failureMessage ?? undefined,
          })
        }
      }
    } catch (error) {
      if (current !== generation) return
      errorMessage.value = error instanceof Error ? error.message : 'Unable to load payment status'
    } finally {
      if (current === generation) {
        loading.value = false
        if (!terminal.value)
          timer = setTimeout(() => load(current), payment.value?.status === 'review' ? 15000 : 5000)
      }
    }
  }

  watch(
    paymentId,
    () => {
      generation++
      resolved = false
      if (timer) clearTimeout(timer)
      payment.value = null
      loading.value = true
      void load()
    },
    { immediate: true },
  )
  onUnmounted(() => {
    generation++
    if (timer) clearTimeout(timer)
  })
  return { payment, errorMessage, loading, terminal }
}
