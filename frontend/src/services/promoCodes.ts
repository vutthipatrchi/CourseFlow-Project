import type { PromoCode } from '@/types/promoCode'

let promoCodes: PromoCode[] = [
  {
    id: 'promo-1',
    code: 'NEWYEAR200',
    minimumPurchase: 0,
    discountType: 'fixed',
    coursesIncluded: 'All',
    createdAt: '2022-02-12T22:30:00',
  },
  {
    id: 'promo-2',
    code: 'WELCOME10',
    minimumPurchase: 1200,
    discountType: 'percent',
    coursesIncluded: 'All',
    createdAt: '2022-02-14T09:15:00',
  },
  {
    id: 'promo-3',
    code: 'SERVICE50',
    minimumPurchase: 3000,
    discountType: 'fixed',
    coursesIncluded: 'Service Design Essentials',
    createdAt: '2022-03-01T14:45:00',
  },
  {
    id: 'promo-4',
    code: 'UXBASIC15',
    minimumPurchase: 500,
    discountType: 'percent',
    coursesIncluded: 'UX Research Basics, Service Design Essentials, Product Strategy Foundations',
    createdAt: '2022-03-20T11:00:00',
  },
  {
    id: 'promo-5',
    code: 'FLASH99',
    minimumPurchase: 0,
    discountType: 'fixed',
    coursesIncluded: 'All',
    createdAt: '2022-04-05T16:30:00',
  },
  {
    id: 'promo-6',
    code: 'STUDENT20',
    minimumPurchase: 800,
    discountType: 'percent',
    coursesIncluded: 'UX Research Basics',
    createdAt: '2022-04-18T10:00:00',
  },
]

export function fetchPromoCodes(): Promise<PromoCode[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(promoCodes.map((promoCode) => ({ ...promoCode }))), 300)
  })
}

export function deletePromoCode(id: string): void {
  promoCodes = promoCodes.filter((promoCode) => promoCode.id !== id)
}
