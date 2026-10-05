import { onScopeDispose, ref, watch } from 'vue'
import { useUser } from '@clerk/vue'
import { listWishlist, addWishlistCourse, removeWishlistCourse } from '@/api/wishlist'
import { toApiError } from '@/api/client'
import type { CheckoutCourse } from '@/api/payments'

// โหลดจากฐานข้อมูลทุกครั้งที่เปิด component เพื่อคืนรายการที่เคยบันทึกไว้และแยก state ของแต่ละบัญชี
export function useWishlist() {
  const { user } = useUser()
  const courses = ref<CheckoutCourse[]>([])
  const loading = ref(false)
  // แยกโหลดสำเร็จจากรายการว่าง: ต้องรู้สถานะล่าสุดก่อนเปิดให้เพิ่ม/ลบ
  const loaded = ref(false)
  const error = ref('')
  // เก็บ ID ที่กำลังบันทึก เพื่อป้องกันการกดซ้ำระหว่างรอ API
  const pending = ref(new Set<number>())
  // เปลี่ยนรุ่นเมื่อโหลดใหม่/สลับบัญชี/ปิด component เพื่อเพิกเฉยต่อ response ของรุ่นเก่า
  let generation = 0
  onScopeDispose(() => generation++)

  async function load() {
    const request = ++generation
    // ล้างข้อมูลบัญชีก่อนหน้าทันทีก่อนรอ API ของบัญชีปัจจุบัน
    courses.value = []
    loaded.value = false
    error.value = ''
    pending.value = new Set()
    loading.value = !!user.value?.id
    if (!user.value?.id) return
    try {
      const result = await listWishlist()
      // ผู้ใช้อาจเปลี่ยนบัญชีระหว่างรอ จึงห้ามนำรายการจาก request เก่ามาแสดง
      if (request !== generation) return
      courses.value = result
      loaded.value = true
    } catch (cause) {
      if (request === generation) error.value = toApiError(cause).message
    } finally {
      if (request === generation) loading.value = false
    }
  }

  // เฝ้าดู ID แทนข้อมูลโปรไฟล์; sync ทำให้ล้างรายการทันทีเมื่อสลับบัญชีหรือออกจากระบบ
  watch(() => user.value?.id, load, { immediate: true, flush: 'sync' })

  // คืน true เฉพาะเมื่อ API สำเร็จและยังเป็นบัญชี/รุ่นเดิม เพื่อให้ UI แสดง toast ได้ถูกต้อง
  async function setSaved(course: CheckoutCourse, saved: boolean): Promise<boolean> {
    if (!user.value?.id) throw new Error('Please sign in to save courses.')
    if (!loaded.value || pending.value.has(course.id)) return false
    const request = generation
    pending.value.add(course.id)
    try {
      if (saved) await addWishlistCourse(course.id)
      else await removeWishlistCourse(course.id)
      if (request !== generation) return false
      // เปลี่ยนรายการบนหน้าจอหลังฐานข้อมูลยืนยันสำเร็จเท่านั้น; ล้มเหลวให้คงรายการเดิม
      courses.value = courses.value.filter((item) => item.id !== course.id)
      if (saved) courses.value.unshift(course)
      return true
    } catch (cause) {
      if (request !== generation) return false
      throw cause
    } finally {
      // request เก่าต้องไม่ปลดล็อกปุ่มที่บัญชีใหม่กำลังใช้อยู่
      if (request === generation) pending.value.delete(course.id)
    }
  }

  return { user, courses, loading, loaded, error, pending, load, setSaved }
}
