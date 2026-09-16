import type { PromoCode } from '@/types/promoCode'

let promoCodes: PromoCode[] = [
  {
    id: 'promo-1',
    code: 'NEWYEAR200',
    minimumPurchase: 0,
    discountType: 'fixed',
    discountValue: 200,
    courseIds: [],
    createdAt: '2022-02-12T22:30:00',
  },
  {
    id: 'promo-2',
    code: 'WELCOME10',
    minimumPurchase: 1200,
    discountType: 'percent',
    discountValue: 10,
    courseIds: [],
    createdAt: '2022-02-14T09:15:00',
  },
  {
    id: 'promo-3',
    code: 'SERVICE50',
    minimumPurchase: 3000,
    discountType: 'fixed',
    discountValue: 50,
    courseIds: ['service-design-essentials'],
    createdAt: '2022-03-01T14:45:00',
  },
  {
    id: 'promo-4',
    code: 'UXBASIC15',
    minimumPurchase: 500,
    discountType: 'percent',
    discountValue: 15,
    courseIds: ['ux-research-basics', 'service-design-essentials', 'product-strategy-foundations'],
    createdAt: '2022-03-20T11:00:00',
  },
  {
    id: 'promo-5',
    code: 'FLASH99',
    minimumPurchase: 0,
    discountType: 'fixed',
    discountValue: 99,
    courseIds: [],
    createdAt: '2022-04-05T16:30:00',
  },
  {
    id: 'promo-6',
    code: 'STUDENT20',
    minimumPurchase: 800,
    discountType: 'percent',
    discountValue: 20,
    courseIds: ['ux-research-basics'],
    createdAt: '2022-04-18T10:00:00',
  },
]

export function fetchPromoCodes(): Promise<PromoCode[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(promoCodes.map((promoCode) => ({ ...promoCode }))), 300)
  })
}

export function fetchPromoCodeById(id: string): Promise<PromoCode | null> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const found = promoCodes.find((promoCode) => promoCode.id === id)
      resolve(found ? { ...found } : null)
    }, 300)
  })
}

export function createPromoCode(
  input: Pick<
    PromoCode,
    'code' | 'minimumPurchase' | 'discountType' | 'discountValue' | 'courseIds'
  >,
): PromoCode {
  const promoCode: PromoCode = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  }
  promoCodes = [promoCode, ...promoCodes]
  return promoCode
}

export function updatePromoCode(
  id: string,
  input: Pick<
    PromoCode,
    'code' | 'minimumPurchase' | 'discountType' | 'discountValue' | 'courseIds'
  >,
): PromoCode | null {
  let updated: PromoCode | null = null
  promoCodes = promoCodes.map((promoCode) => {
    if (promoCode.id !== id) return promoCode
    updated = { ...promoCode, ...input }
    return updated
  })
  return updated
}

export function deletePromoCode(id: string): void {
  promoCodes = promoCodes.filter((promoCode) => promoCode.id !== id)
}
