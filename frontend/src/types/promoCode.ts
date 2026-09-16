export type DiscountType = 'fixed' | 'percent'

export interface PromoCode {
  id: string
  code: string
  minimumPurchase: number
  discountType: DiscountType
  coursesIncluded: string
  createdAt: string
}
