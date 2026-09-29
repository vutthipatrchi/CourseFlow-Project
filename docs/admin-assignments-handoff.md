# ส่งต่องาน: Admin Assignments

**Branch:** `feature/admin-assignments` (PR #3) · **อัปเดตล่าสุด:** 2026-09-18

## สรุป

Feature "admin สร้าง assignment" และ "admin ดู assignment ทั้งหมด" ทำเสร็จแล้ว และทดสอบ
end-to-end บน Supabase กลางกับ Clerk (Development) แล้ว (ดู endpoint contract ที่
[api.md](./api.md)) ยังมี 7 เรื่องค้างอยู่ ส่วนใหญ่เป็นของ branch อื่นหรือต้องให้ทีมตัดสินใจ
มีแค่เรื่องที่ 1 ที่ต้องทำก่อน merge

## รายการที่ยังรอ

| # | Item | Blocked on | Resume when / how | Status |
| --- | --- | --- | --- | --- |
| 1 | Review PR #3 | รอเพื่อนในทีม approve เข้า `dev` | PR พร้อม merge แล้ว ไม่มี conflict | **รอ review** |
| 2 | Backend ยังไม่เช็ค role admin | ฝั่ง frontend มี guard จาก #8 แล้ว (อ่าน `metadata.role` จาก Clerk token) แต่ backend แค่ตรวจว่า token ถูกต้อง ใครที่ login แล้วก็เรียก `/api/admin/*` ได้ | เพิ่มการเช็ค claim `metadata.role == "admin"` ใน `SecurityConfig` สำหรับ `/api/admin/**` กระทบ endpoint course ของ #6 ด้วย ควรทำเป็น PR แยกที่ทีมตกลงร่วมกัน | **รอการตัดสินใจ** |
| 3 | แก้ course แล้ว sub-lesson กับ assignment หายตาม | ~~`CourseRepository.replaceLessons` ลบ lesson ทั้งหมด~~ | Fixed on `feature/sub-lesson`: `syncLessons` upserts by lesson `id` and only deletes omitted lessons | **done on feature/sub-lesson** |
| 4 | Flyway เก็บ history ผิด schema | Local: user ชื่อ `courseflow` ตรงกับ schema ที่ V1 สร้าง พอสตาร์ท backend รอบที่สอง Flyway จะหา history table ผิด schema แล้วล่ม. Supabase: `flyway_schema_history` อยู่ใน `public` ซึ่ง Data API เปิดให้เข้าถึงได้โดยไม่มี RLS | ตั้ง `spring.flyway.default-schema=courseflow` แก้ได้ทั้งสองอย่าง แต่ต้องรีเซ็ต database อีกรอบ ควรทำเป็น PR แยกและนัดทีมก่อน | **รอการตัดสินใจ** |
| 5 | Sidebar admin มี 2 ตัว | `AdminCourseListView` (#6) มี sidebar ของตัวเอง ชื่อเมนูไม่ตรงกับ `AdminLayout` และลิงก์ Assignment เป็น `href="#assignments"` กดแล้วไม่ไปหน้า assignment | ย้ายหน้า course มาใช้ `AdminLayout` ตัวเดียวกัน | **รอคุยกับเจ้าของ #6** |
| 6 | CI ไม่รันบน PR เข้า `dev` | `.github/workflows/ci.yml` trigger แค่ `main` | เพิ่ม `dev` เข้า `branches` ของ workflow ไม่บล็อกการ merge แค่ merge ไปโดยไม่มี CI check จนกว่าจะแก้ | **รอการตัดสินใจ** |
| 7 | `docs/branch-protection.md` ไม่ตรงของจริง | doc เขียนว่าใช้ `feat/...` แตกจาก `main` แต่ทีมใช้ `feature/...` แตกจาก `dev` | ไม่บล็อกงานนี้ แค่บันทึกไว้กันคนอ่านเข้าใจผิด | **หนี้เอกสาร ไม่บล็อก** |

## เรื่องที่จบแล้ว

- **เลข Flyway migration ชนกัน:** `dev` มี `V3__create_course_tables.sql` ของ #6 แล้ว branch นี้ใช้ V4
  migration ถัดไปต้องเริ่มที่ V5 ส่วน database ไหนเคยรัน V3 เก่าของ branch นี้จะเจอ
  `checksum mismatch for migration version 3` ต้องรีเซ็ตด้วย
  `DROP SCHEMA IF EXISTS courseflow CASCADE; DROP TABLE IF EXISTS public.flyway_schema_history;`
  (Supabase กลางรีเซ็ตแล้วเมื่อ 2026-09-18)
- **เจ้าของ schema course:** ใช้ `courses` / `course_lessons` ของ #6 branch นี้เพิ่มแค่
  `sub_lessons` (FK → `course_lessons`) กับ `assignments`
- **Clerk และสิทธิ์ admin:** login กับ guard ฝั่ง frontend มาจาก #8 การให้สิทธิ์ admin ทำใน
  Clerk Dashboard (instance Development) → Users → เลือก user → Metadata → ช่อง **Public** →
  ใส่ `{"role": "admin"}` แล้ว logout/login ใหม่ (ส่วน session token ตั้งให้ส่ง
  `metadata` มาด้วยไว้แล้ว)

## งานที่ตั้งใจไม่ทำใน branch นี้

- แก้ไข/ลบ assignment: ไอคอนในคอลัมน์ Action เป็นแค่ placeholder กดไม่ได้
- `durationDays` / `status`: ตัดออกทั้ง API, database และฟอร์ม เพราะไม่มีใน Figma
- Search API: ช่องค้นหากรองจากข้อมูลที่โหลดมาแล้วฝั่ง client
- Pinia store: มีแค่ 2 หน้า ใช้ local state พอ
