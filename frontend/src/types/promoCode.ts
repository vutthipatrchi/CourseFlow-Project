export type DiscountType = 'fixed' | 'percent'

export interface PromoCode {
  id: string
  code: string
  minimumPurchase: number
  discountType: DiscountType
  discountValue: number
  /** Course ids this promo applies to; an empty array means "All courses". */
  courseIds: string[]
  createdAt: string
}
