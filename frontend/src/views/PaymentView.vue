<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import CheckoutFooter from '@/components/payment/CheckoutFooter.vue'
import CheckoutNavbar from '@/components/payment/CheckoutNavbar.vue'
import { formatThb, subscription } from '@/lib/payment'
import {
  createCardPayment,
  createOrder,
  createPromptPayPayment,
  getPaymentConfig,
  rememberCheckout,
  tokenizeCard,
  type PaymentConfig,
} from '@/api/payments'

type PaymentMethod = 'card' | 'qr'

const router = useRouter()
const paymentMethod = ref<PaymentMethod>('card')
const promoCode = ref('')
const promoMessage = ref('')
const courseTitle = ref<string>(subscription.title)
const subtotal = ref<number>(subscription.subtotal)
const discount = ref<number>(subscription.defaultDiscount)
const submitted = ref(false)
const processing = ref(false)
const errorMessage = ref('')
const paymentConfig = ref<PaymentConfig | null>(null)
const card = reactive({ number: '', owner: '', expiry: '', cvv: '' })

const total = computed(() => subtotal.value - discount.value)
const methodLabel = computed(() =>
  paymentMethod.value === 'card' ? 'Credit card / Debit card' : 'QR code',
)
const digits = computed(() => card.number.replace(/\D/g, ''))
const expiryParts = computed(() => /^(0[1-9]|1[0-2])\s*\/\s*([0-9]{2})$/.exec(card.expiry))
const cardValid = computed(
  () =>
    digits.value.length >= 13 &&
    digits.value.length <= 19 &&
    card.owner.trim().length >= 2 &&
    Boolean(expiryParts.value) &&
    /^\d{3,4}$/.test(card.cvv),
)

onMounted(async () => {
  try {
    paymentConfig.value = await getPaymentConfig()
    if (!paymentConfig.value.enabled) {
      errorMessage.value = 'Payment is not configured yet. Please contact support.'
    }
  } catch (error) {
    errorMessage.value = messageFrom(error)
  }
})

function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : 'Unable to process payment'
}

function formatCardNumber(event: Event) {
  const input = event.target as HTMLInputElement
  card.number = input.value
    .replace(/\D/g, '')
    .slice(0, 19)
    .replace(/(.{4})/g, '$1 ')
    .trim()
}

function formatExpiry(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '').slice(0, 4)
  card.expiry = value.length > 2 ? `${value.slice(0, 2)} / ${value.slice(2)}` : value
}

function applyPromo() {
  const code = promoCode.value.trim().toUpperCase()
  if (code === 'COURSE200') {
    discount.value = 200
    promoMessage.value = 'Promotion code applied'
  } else {
    discount.value = subscription.defaultDiscount
    promoMessage.value = code ? 'Promotion code is invalid' : 'Enter a promotion code'
  }
}

async function confirmPayment() {
  submitted.value = true
  errorMessage.value = ''
  if (paymentMethod.value === 'card' && !cardValid.value) return
  if (!paymentConfig.value?.enabled) {
    errorMessage.value = 'Payment is not available right now. Please try again later.'
    return
  }

  processing.value = true
  try {
    const order = await createOrder(promoCode.value)
    courseTitle.value = order.courseTitle
    subtotal.value = order.subtotalSatang / 100
    discount.value = order.discountSatang / 100

    let payment
    if (paymentMethod.value === 'qr') {
      payment = await createPromptPayPayment(order.orderId, order.accessToken, crypto.randomUUID())
    } else {
      const expiry = expiryParts.value
      if (!expiry) return
      let cardToken: string
      try {
        cardToken = await tokenizeCard(paymentConfig.value.publicKey, {
          name: card.owner.trim(),
          number: digits.value,
          expirationMonth: Number(expiry[1]),
          expirationYear: 2000 + Number(expiry[2]),
          securityCode: card.cvv,
        })
      } finally {
        card.number = ''
        card.expiry = ''
        card.cvv = ''
      }
      payment = await createCardPayment(
        order.orderId,
        order.accessToken,
        cardToken,
        crypto.randomUUID(),
      )
    }

    rememberCheckout(payment.paymentId, order.accessToken)
    await router.push({
      name: payment.method === 'promptpay' ? 'payment-qr' : 'payment-status',
      query: { paymentId: payment.paymentId },
    })
  } catch (error) {
    errorMessage.value = messageFrom(error)
  } finally {
    processing.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-white">
    <CheckoutNavbar />

    <main class="flex-1">
      <div class="mx-auto w-full max-w-[1120px] px-4 pt-10 pb-20 sm:px-6 lg:pt-12 lg:pb-32 xl:px-0">
        <RouterLink
          to="/"
          class="inline-flex items-center gap-2 text-base font-semibold text-blue-600 hover:text-blue-900"
        >
          <span aria-hidden="true">←</span>
          Back
        </RouterLink>

        <h1
          class="mt-16 max-w-[739px] text-[32px] leading-[1.25] font-medium tracking-[-0.02em] text-black sm:text-4xl"
        >
          Enter payment info to start your subscription
        </h1>

        <form
          class="mt-12 grid items-start gap-6 lg:grid-cols-[minmax(0,739px)_357px]"
          novalidate
          @submit.prevent="confirmPayment"
        >
          <fieldset :disabled="processing">
            <legend class="mb-4 text-base leading-6 text-gray-700">Select payment method</legend>

            <div class="space-y-2">
              <section
                :class="['rounded-lg', paymentMethod === 'card' ? 'bg-gray-100' : 'bg-white']"
              >
                <label class="flex min-h-14 cursor-pointer items-center gap-4 px-4 py-4 sm:px-6">
                  <input
                    v-model="paymentMethod"
                    type="radio"
                    value="card"
                    class="h-6 w-6 accent-blue-600"
                  />
                  <span class="text-base text-gray-800">Credit card / Debit card</span>
                </label>

                <div
                  v-if="paymentMethod === 'card'"
                  class="flex max-w-[581px] flex-col gap-6 px-4 pt-2 pb-10 sm:px-16"
                >
                  <div class="grid items-end gap-4 sm:grid-cols-[minmax(0,453px)_104px]">
                    <label class="flex min-w-0 flex-col gap-1 text-base text-black">
                      Card Number
                      <input
                        :value="card.number"
                        inputmode="numeric"
                        autocomplete="cc-number"
                        maxlength="23"
                        placeholder="1234 1234 1234 1234"
                        class="h-12 rounded-lg border border-gray-400 bg-white px-4 text-base placeholder:text-gray-600 focus:border-blue-600 focus:outline-none"
                        @input="formatCardNumber"
                      />
                    </label>
                    <div
                      class="flex h-12 items-center gap-2"
                      aria-label="Visa and Mastercard accepted"
                    >
                      <span
                        class="flex h-8 w-12 items-center justify-center rounded border border-gray-300 bg-white text-sm font-bold italic text-[#1A1F71]"
                        >VISA</span
                      >
                      <svg
                        role="img"
                        aria-label="Mastercard"
                        viewBox="0 0 48 32"
                        class="h-8 w-12 rounded border border-gray-300 bg-white"
                      >
                        <circle cx="19" cy="16" r="10" fill="#EB001B" />
                        <circle cx="29" cy="16" r="10" fill="#F79E1B" fill-opacity="0.9" />
                      </svg>
                    </div>
                  </div>

                  <label class="flex max-w-[453px] flex-col gap-1 text-base text-black">
                    Card Owner
                    <input
                      v-model="card.owner"
                      autocomplete="cc-name"
                      placeholder="Name on card"
                      class="h-12 rounded-lg border border-gray-400 bg-white px-4 text-base placeholder:text-gray-600 focus:border-blue-600 focus:outline-none"
                    />
                  </label>

                  <div class="flex max-w-[453px] gap-4">
                    <label class="flex min-w-0 flex-1 flex-col gap-1 text-base text-black">
                      Expiry Date
                      <input
                        :value="card.expiry"
                        inputmode="numeric"
                        autocomplete="cc-exp"
                        maxlength="7"
                        placeholder="MM / YY"
                        class="h-12 min-w-0 rounded-lg border border-gray-400 bg-white px-4 text-base placeholder:text-gray-600 focus:border-blue-600 focus:outline-none"
                        @input="formatExpiry"
                      />
                    </label>
                    <label class="flex min-w-0 flex-1 flex-col gap-1 text-base text-black">
                      CVC/CVV
                      <input
                        v-model="card.cvv"
                        inputmode="numeric"
                        autocomplete="cc-csc"
                        maxlength="4"
                        placeholder="CVC"
                        class="h-12 min-w-0 rounded-lg border border-gray-400 bg-white px-4 text-base placeholder:text-gray-600 focus:border-blue-600 focus:outline-none"
                        @input="card.cvv = card.cvv.replace(/\D/g, '').slice(0, 4)"
                      />
                    </label>
                  </div>
                </div>
              </section>

              <section :class="['rounded-lg', paymentMethod === 'qr' ? 'bg-gray-100' : 'bg-white']">
                <label class="flex min-h-14 cursor-pointer items-center gap-4 px-4 py-4 sm:px-6">
                  <input
                    v-model="paymentMethod"
                    type="radio"
                    value="qr"
                    class="h-6 w-6 accent-blue-600"
                  />
                  <span class="text-base text-gray-800">QR code</span>
                </label>
                <p
                  v-if="paymentMethod === 'qr'"
                  class="px-4 pt-1 pb-8 text-sm leading-6 text-gray-700 sm:px-16"
                >
                  Confirm to display a QR code that you can scan with your banking app or save to
                  your device.
                </p>
              </section>
            </div>
          </fieldset>

          <aside
            aria-label="Payment summary"
            class="flex flex-col gap-6 rounded-lg bg-white px-6 py-8 shadow-[4px_4px_24px_rgba(0,0,0,0.08)] lg:mt-10"
          >
            <p class="text-sm leading-[21px] text-orange-500">Summary</p>
            <div class="space-y-2">
              <p class="text-base text-gray-700">Subscription</p>
              <h2 class="text-2xl leading-[30px] font-medium tracking-[-0.02em] text-black">
                {{ courseTitle }}
              </h2>
            </div>

            <div>
              <label for="promo-code" class="sr-only">Promotion code</label>
              <div class="flex gap-4">
                <input
                  id="promo-code"
                  v-model="promoCode"
                  :disabled="processing"
                  placeholder="Promotion code"
                  class="h-12 min-w-0 flex-1 rounded-lg border border-gray-400 bg-white px-4 uppercase placeholder:normal-case placeholder:text-gray-600 focus:border-blue-600 focus:outline-none"
                />
                <button
                  type="button"
                  :disabled="!promoCode.trim() || processing"
                  class="h-12 rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-900 disabled:bg-gray-400 disabled:text-gray-600"
                  @click="applyPromo"
                >
                  Apply
                </button>
              </div>
              <p
                v-if="promoMessage"
                role="status"
                :class="[
                  'mt-2 text-sm',
                  promoMessage.includes('applied') ? 'text-[#9B2FAC]' : 'text-red-700',
                ]"
              >
                {{ promoMessage }}
              </p>
            </div>

            <dl class="space-y-6 text-base leading-6">
              <div class="flex justify-between gap-4">
                <dt>Subtotal</dt>
                <dd class="text-gray-700">{{ formatThb(subtotal) }}</dd>
              </div>
              <div v-if="discount" class="flex justify-between gap-4">
                <dt>Discount</dt>
                <dd class="text-[#9B2FAC]">-{{ formatThb(discount) }}</dd>
              </div>
              <div class="flex justify-between gap-4">
                <dt>Payment method</dt>
                <dd class="max-w-[160px] text-right text-gray-700">{{ methodLabel }}</dd>
              </div>
              <div class="flex items-center justify-between gap-4">
                <dt>Total</dt>
                <dd class="text-2xl leading-[30px] font-medium text-gray-700">
                  {{ formatThb(total) }}
                </dd>
              </div>
            </dl>

            <div class="border-t border-gray-400 pt-6">
              <p
                v-if="submitted && paymentMethod === 'card' && !cardValid"
                role="alert"
                class="mb-4 text-sm text-red-700"
              >
                Please complete all card details correctly.
              </p>
              <p v-if="errorMessage" role="alert" class="mb-4 text-sm text-red-700">
                {{ errorMessage }}
              </p>
              <button
                type="submit"
                :disabled="processing || paymentConfig === null"
                class="min-h-[60px] w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-semibold text-white shadow-[4px_4px_16px_rgba(0,0,0,0.08)] hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
              >
                {{
                  processing
                    ? 'Processing…'
                    : paymentMethod === 'qr'
                      ? 'Continue to QR code'
                      : 'Confirm payment'
                }}
              </button>
            </div>
          </aside>
        </form>
      </div>
    </main>

    <CheckoutFooter />
  </div>
</template>
