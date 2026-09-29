export type DiscountType = 'fixed' | 'percent'

export interface PromoCode {
  id: number
  code: string
  minimumPurchase: number
  discountType: DiscountType
  discountValue: number
  courseIds: number[]
  createdAt: string
  updatedAt: string
}

export interface PromoCodePayload {
  code: string
  minimumPurchase: number
  discountType: DiscountType
  discountValue: number
  courseIds: number[]
}
