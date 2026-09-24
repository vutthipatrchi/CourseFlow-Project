# ส่งต่องาน: My Assignments (ดูสถานะ assignment)

**Branch:** `feature/assignment-status` (ยังไม่เปิด PR) · **อัปเดตล่าสุด:** 2026-09-24

## สรุป

Story "As a User, I can view my assignment status" ส่วนของเรา คือ backend API กับหน้า
My Assignments ทำเสร็จและทดสอบแล้ว (contract อยู่ที่ [api.md](./api.md#my-assignments))
ยังมี 7 เรื่องค้างอยู่ เป็นงานของ story อื่นหรือต้องให้ทีมตัดสินใจ มีแค่ข้อ 1 (ลำดับการเปิด PR)
ที่เกี่ยวกับการ merge ส่วนข้อที่เหลือไม่บล็อก

## รายการที่ยังรอ

| # | Item | Blocked on | Resume when / how | Status |
| --- | --- | --- | --- | --- |
| 1 | เปิด PR | ตกลงกันว่ารองานที่เกี่ยวข้องจากคนอื่นเข้า `dev` ก่อน (งาน my-courses และ learning progress merge แล้ว) | ก่อนเปิดให้ rebase ทับ `dev` แล้วเช็คว่าเลข migration `V11` ยังว่าง ถ้ามีคนใช้ไปแล้วให้เปลี่ยนเป็นเลขถัดไป (เลข V3 ชนเคยทำให้ต้องรีเซ็ต DB กลางมาแล้ว) | **รอสั่งเปิด** |
| 2 | Course player ใช้ข้อมูลจริงแค่ส่วน progress | PR #31 เพิ่ม `GET /api/me/courses/{courseId}/progress` และ player ใช้กับ URL แบบ `course-{id}` แต่ข้อมูลคอร์สส่วนที่เหลือยังมาจาก `data/courses.ts` (mock) และ sub-lesson ของคอร์สจริงยังไม่มี assignment | ให้เจ้าของ player ทำต่อ | **รอเจ้าของ player** |
| 3 | Assignment widget ใต้วิดีโอใน player ยังไม่ต่อ API | `applyProgress` ใน `CoursePlayerView.vue` สร้าง sub-lesson ของคอร์สจริงโดยไม่ใส่ `assignment` | ไม่ต้องเพิ่ม endpoint เรียก `GET /api/me/assignments` แล้วจับคู่ด้วย `subLessonId` (ตรงกับ `id` ของ sub-lesson ใน progress API) ส่งงานด้วย `POST /api/me/assignments/{id}/submissions` | **ทำได้แล้ว รอเจ้าของ player** |
| 4 | สถานะ `in-progress` | PR #31 บันทึกแค่ว่าเรียนจบ sub-lesson แล้ว (`completed`) ไม่มีข้อมูลว่าเริ่มเรียนหรือยัง | ต้องตกลงกับทีมว่า `in-progress` หมายถึงอะไร แล้วเพิ่มเงื่อนไขใน `AssignmentSubmissionService.toView` ตอนนี้คืนแค่ `pending` / `overdue` / `submitted` type ฝั่ง frontend รองรับค่า `in-progress` อยู่แล้ว | **รอตัดสินใจ** |
| 5 | ข้อมูล assignment ซ้ำซ้อน 2 แหล่ง | `data/courses.ts` ยังมี assignment และสถานะ mock ส่งงานในหน้า player ของคอร์ส mock จึงไม่ไปโผล่ใน My Assignments | หายเมื่อทำข้อ 3 และเลิกใช้ mock | **ผลพวงของข้อ 3** |
| 6 | Navbar สูง 76px แต่ Figma กำหนด 88px | `AppNavbar` เป็น component กลาง กระทบทุกหน้า ไม่ใช่ของ story นี้ | ให้เจ้าของ navbar ตัดสินใจและแก้ทีเดียว | **ยังไม่มีเจ้าของ** |
| 7 | Figma ของหน้านี้มีจุดที่ไม่สม่ำเสมอ | ช่องกรอกของ Pending สูง 96px แต่ In progress และ Overdue สูง 120px ส่วน badge Submitted และ Overdue ใช้ตัวอักษร 14px แต่ Pending และ In progress ใช้ 16px | เราทำตาม Figma ตรงๆ ทั้งสองจุด ถ้าดีไซเนอร์บอกว่าเป็นความคลาดเคลื่อน ให้แก้ที่ `AssignmentCard.vue` (`h-24` / `h-30` ของช่องกรอก และ `badgeTextSize`) | **ทำตาม Figma แล้ว รอยืนยันกับดีไซเนอร์** |

## เรื่องที่จบแล้ว

- **Schema (V11):** เพิ่ม `assignments.duration_days` (ไม่บังคับ ถ้าเป็น `NULL` จะไม่มีวัน overdue)
  และตาราง `assignment_submissions` (1 คนต่อ 1 assignment ส่งซ้ำแล้วทับคำตอบเดิม)
  ใช้เลข V11 เพราะ `dev` ใช้ V9 กับ profile fields และ V10 กับ learning progress (PR #31) ไปแล้ว
- **API:** `GET /api/me/assignments` และ `POST /api/me/assignments/{id}/submissions`
  เห็นและส่งได้เฉพาะ assignment ของคอร์สที่ผู้เรียนมี subscription แบบ active
  ถ้าไม่มีสิทธิ์จะได้ `404` เหมือน assignment ที่ไม่มีอยู่จริง
- **หน้า My Assignments:** ต่อ API แทนข้อมูล mock ใช้ `AssignmentCard` ของเพื่อนเหมือนเดิม
  แล้วปรับส่วนหัวและการ์ดให้ตรง Figma วัดขนาดจริงในเบราว์เซอร์ที่ความกว้าง 1440px
- **ปุ่ม "Open in Course":** ลิงก์ตรงกับ URL ของ player (`/courses/course-{courseId}/learn/sub-{lessonPosition}-{subLessonPosition}`)
  API ส่ง `lessonPosition` กับ `subLessonPosition` มาให้ ซึ่งเป็นค่าเดียวกับที่ progress API ของ PR #31 ใช้
  เปิดหน้า player ได้ต่อเมื่อบัญชีนั้นมี subscription ของคอร์สนั้น
- **ฟอร์ม admin:** เพิ่มช่อง "Due in (days, optional)" หน้า admin ใน Figma ไม่มีช่องนี้
  แต่จำเป็นต่อการคำนวณ deadline
- **บั๊กที่แก้ระหว่างทำ:** `duration_days` เป็น `INT` แต่โค้ดแคสต์เป็น `Long` ทำให้หน้า admin
  พังเมื่อกรอกจำนวนวัน ตอนนี้ใช้ `Integer` และมี test ที่ใช้ค่าจริง

## ทดสอบเอง

หน้า My Assignments จะแสดงข้อมูลได้เมื่อครบ 2 อย่าง คือบัญชีที่ login มี subscription แบบ
active (ผ่านการชำระเงินสำเร็จ) และ admin สร้าง assignment ให้ sub-lesson ของคอร์สนั้นแล้ว
ถ้าไม่ครบจะเห็น "No assignments in this tab yet." ซึ่งไม่ใช่ error

Test ที่ต้องใช้ DB (`AssignmentSubmissionRepositoryTests`, `AssignmentRepositoryTests`) จะรัน
เมื่อใส่ `-Dspring.profiles.active=local` ตัวแรกใช้ transaction rollback จึงไม่ทิ้งข้อมูล
ส่วน `AssignmentRepositoryTests` (ของเดิม) เพิ่มแถวลงตาราง `assignments` แล้วไม่ลบ
ควรรันกับ DB ของตัวเอง ไม่ใช่ DB กลางของทีม

## งานที่ตั้งใจไม่ทำใน story นี้

- **ให้คะแนนหรือตรวจงาน:** requirement ไม่ได้ระบุ
- **บันทึกร่างคำตอบ (draft):** `in-progress` ตาม Figma ยังไม่ชัดว่ามาจาก draft หรือจากความคืบหน้าการเรียน
  จึงไม่เดา
- **แก้คำตอบหลังส่ง:** API รองรับการส่งซ้ำทับคำตอบเดิม แต่ Figma ไม่มีปุ่มแก้ หน้าจึงล็อกเป็น
  read-only หลังส่ง
