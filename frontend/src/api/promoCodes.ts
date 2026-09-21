import client from './client'
import type { PromoCode, PromoCodePayload } from '@/types/promoCode'

export async function listPromoCodes(): Promise<PromoCode[]> {
  const { data } = await client.get<PromoCode[]>('/admin/promo-codes')
  return data
}

export async function getPromoCode(id: number): Promise<PromoCode> {
  const { data } = await client.get<PromoCode>(`/admin/promo-codes/${id}`)
  return data
}

export async function createPromoCode(payload: PromoCodePayload): Promise<PromoCode> {
  const { data } = await client.post<PromoCode>('/admin/promo-codes', payload)
  return data
}

export async function updatePromoCode(id: number, payload: PromoCodePayload): Promise<PromoCode> {
  const { data } = await client.put<PromoCode>(`/admin/promo-codes/${id}`, payload)
  return data
}

export async function deletePromoCode(id: number): Promise<void> {
  await client.delete(`/admin/promo-codes/${id}`)
}
