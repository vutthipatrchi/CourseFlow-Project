import client from './client'
import type { CheckoutCourse } from './payments'

// client แนบ Clerk token ให้ทุก request; backend ใช้ token ระบุเจ้าของ wishlist
// จึงส่งเฉพาะ courseId โดยไม่รับหรือส่ง userId จากหน้าเว็บ
export async function listWishlist(): Promise<CheckoutCourse[]> {
  return (await client.get<CheckoutCourse[]>('/me/wishlist')).data
}

export async function addWishlistCourse(courseId: number): Promise<void> {
  await client.put(`/me/wishlist/${courseId}`)
}

export async function removeWishlistCourse(courseId: number): Promise<void> {
  await client.delete(`/me/wishlist/${courseId}`)
}
