import client from './client'
import type { CheckoutCourse } from './payments'

export async function listWishlist(): Promise<CheckoutCourse[]> {
  return (await client.get<CheckoutCourse[]>('/me/wishlist')).data
}

export async function addWishlistCourse(courseId: number): Promise<void> {
  await client.put(`/me/wishlist/${courseId}`)
}

export async function removeWishlistCourse(courseId: number): Promise<void> {
  await client.delete(`/me/wishlist/${courseId}`)
}
