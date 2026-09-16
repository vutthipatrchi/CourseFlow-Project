# ส่งต่องาน: Admin Assignments

**Branch:** `feature/admin-assignments`

## สรุป

Feature "admin สร้าง assignment" และ "admin ดู assignment ทั้งหมด" ทำเสร็จและเทสต์
end-to-end แล้วบนสาขานี้ (ดู endpoint contract ที่ [api.md](./api.md)) แต่มี 6 เรื่อง
ที่ยัง**รอคนอื่นหรือ branch อื่น** ก่อนจะถือว่าจบจริง ๆ — ในจำนวนนี้มีแค่ 1 เรื่องที่
ทำต่อได้เลยตอนนี้ ที่เหลือต้องรอการตัดสินใจหรือรอเช็คกับ branch อื่นก่อน

## รายการที่ยังรอ

| # | Item | Blocked on | Resume when / how | Status |
| --- | --- | --- | --- | --- |
| 1 | Review PR | รอเพื่อนในทีม approve PR เข้า `dev` | เปิด PR ได้เลยตอนนี้ ไม่มีอะไรต้องรอก่อน | **พร้อมทำเลย** |
| 2 | Auth ของ admin จริง | รอคนไป provision Clerk account + keys และตัดสินใจว่าจะเก็บ role `admin` ไว้ที่ไหน (ตอนนี้สมมติว่าอยู่ใน Clerk user metadata) | พอมี keys แล้ว: เสียบ `router.beforeEach` guard ที่ flag `meta.requiresAdmin` เดิมใน `frontend/src/router/index.ts` และเพิ่ม `spring-boot-starter-oauth2-resource-server` ไป verify JWT หน้า `@Profile("!standalone")` beans ที่มีอยู่แล้ว ไม่ต้องรื้อโครงสร้างเดิม | **รอการตัดสินใจ** |
| 3 | CI ไม่รันบน PR เข้า `dev` | รอเจ้าของ repo ตัดสินใจว่าจะแก้ `.github/workflows/ci.yml` ให้ trigger บน `dev` ด้วยไหม (ตอนนี้ trigger แค่ `main`) | เพิ่ม `dev` เข้า `branches` list ของ workflow ไม่บล็อกการ merge feature นี้ แค่ merge ไปแบบไม่มี CI check จนกว่าจะแก้ | **รอการตัดสินใจ** |
| 4 | เลข Flyway migration ชนกัน | มีผลก็ต่อเมื่อมี branch อื่นที่แตะ DB schema พร้อมกัน เช่น feature "admin จัดการ course" | ก่อน merge ต้องเช็คว่ายังไม่มีใครใช้ `V2__...` ใน `db/migration` ไปก่อน (สาขานี้จองไว้ที่ `V2__create_course_structure.sql`) ถ้าชน ฝั่งที่ merge ทีหลังต้องเปลี่ยนเลข | **มีเงื่อนไข** |
| 5 | เจ้าของ schema courses/lessons/sub_lessons | รอคนที่จะทำ "admin จัดการ course" ในอนาคต — schema และ seed data ตอนนี้เป็นสิ่งที่เราออกแบบเองเพราะยังไม่มี ERD/spec จริง | ถ้า schema ของเขาต่างจากนี้ ต้องคุยรวมกันก่อนทั้งสอง branch จะ merge เข้า `dev` ไม่งั้นต้อง migrate ข้อมูลใหม่ทีหลัง | **มีเงื่อนไข** |
| 6 | `docs/branch-protection.md` เก่าไม่ตรงของจริง | รอเจ้าของ repo อัปเดต doc/settings ใน GitHub — ตอนนี้ doc เขียนว่าใช้ `feat/...` จาก `main` แต่ทีมใช้ `feature/...` จาก `dev` จริง | ไม่บล็อกงานนี้ แค่บันทึกไว้กันคนอ่านทีหลังเข้าใจผิด | **หนี้เอกสาร ไม่บล็อก** |

## งานที่ตั้งใจไม่ทำในสาขานี้

- แก้ไข/ลบ assignment และค้นหา/กรอง — scope มีแค่สร้างกับดูทั้งหมด
- ไม่มี Pinia store — แค่ 2 หน้า ใช้ local state พอ
- ไม่ปรับ UI เพิ่มเติมนอกจากใช้ design token ที่มาจาก `feature/landing-page` อยู่แล้ว
