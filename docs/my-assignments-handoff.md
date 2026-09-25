# ส่งต่องาน: My Assignments (ดูสถานะ assignment)

**Branch:** `feature/assignment-status` (เปิด PR เข้า `dev` แล้ว) · **อัปเดตล่าสุด:** 2026-09-25

## สรุป

Story "As a User, I can view my assignment status" ส่วนของเรา คือ backend API กับหน้า
My Assignments ทำเสร็จและทดสอบแล้ว (contract อยู่ที่ [api.md](./api.md#my-assignments))
ยังมี 4 เรื่องค้างอยู่ เป็นงานของ story อื่นหรือต้องให้ทีมตัดสินใจ ไม่มีข้อไหนบล็อกการ merge
ข้อเดียวที่ต้องระวังก่อน merge คือเลข migration `V12` ถ้ามี PR อื่นใช้เลขนี้เข้า `dev` ก่อน
ให้เปลี่ยนไฟล์ของเราเป็นเลขถัดไป (เลข V3 ชนเคยทำให้ต้องรีเซ็ต DB กลางมาแล้ว)

## รายการที่ยังรอ

| # | Item | Blocked on | Resume when / how | Status |
| --- | --- | --- | --- | --- |
| 1 | Course player ยังหยิบรูปและคำอธิบายคอร์สจาก mock | หลัง PR #33 หน้า player แสดงเฉพาะคอร์สจริงที่มี subscription (เนื้อหาและ progress มาจาก `GET /api/me/courses/{courseId}/progress`) แต่รูปกับคำอธิบายคอร์สยังหยิบจาก `data/courses.ts` (mock) โดยจับคู่ด้วยชื่อคอร์ส | ให้เจ้าของ player ทำต่อ | **รอเจ้าของ player** |
| 2 | สถานะ `in-progress` | PR #31 บันทึกแค่ว่าเรียนจบ sub-lesson แล้ว (`completed`) ไม่มีข้อมูลว่าเริ่มเรียนหรือยัง | ต้องตกลงกับทีมว่า `in-progress` หมายถึงอะไร แล้วเพิ่มเงื่อนไขใน `AssignmentSubmissionService.toView` ตอนนี้คืนแค่ `pending` / `submitted` type ฝั่ง frontend รองรับค่า `in-progress` อยู่แล้ว | **รอตัดสินใจ** |
| 3 | Navbar สูง 76px แต่ Figma กำหนด 88px | `AppNavbar` เป็น component กลาง กระทบทุกหน้า ไม่ใช่ของ story นี้ | ให้เจ้าของ navbar ตัดสินใจและแก้ทีเดียว | **ยังไม่มีเจ้าของ** |
| 4 | Figma ของหน้านี้มีจุดที่ไม่สม่ำเสมอ | ช่องกรอกของ Pending สูง 96px แต่ In progress และ Overdue สูง 120px ส่วน badge Submitted และ Overdue ใช้ตัวอักษร 14px แต่ Pending และ In progress ใช้ 16px | เราทำตาม Figma ตรงๆ ทั้งสองจุด ถ้าดีไซเนอร์บอกว่าเป็นความคลาดเคลื่อน ให้แก้ที่ `AssignmentCard.vue` (`h-24` / `h-30` ของช่องกรอก และ `badgeTextSize`) | **ทำตาม Figma แล้ว รอยืนยันกับดีไซเนอร์** |

## เรื่องที่จบแล้ว

- **Schema (V12):** เพิ่ม `assignments.duration_days` (ไม่บังคับ) เป็นแค่คำแนะนำว่าควรทำภายในกี่วัน
  แสดงบนการ์ดเป็น "Assign within N days" ไม่มีการบังคับและไม่มีสถานะ Overdue เพราะคอร์สเรียนตามจังหวะตัวเอง
  ไม่มีกำหนดส่ง สถานะที่ API คืนมีแค่ `pending` กับ `submitted` (การ์ดของเพื่อนยังรองรับการวาด Overdue ไว้ ไม่ได้แตะ)
  และตาราง `assignment_submissions` (1 คนต่อ 1 assignment ส่งซ้ำแล้วทับคำตอบเดิม)
  ใช้เลข V12 เพราะ `dev` ใช้ V9 กับ profile fields, V10 กับ learning progress (PR #31) และ V11 กับคอร์สหน้าร้าน (PR #33) ไปแล้ว
- **API:** `GET /api/me/assignments` และ `POST /api/me/assignments/{id}/submissions`
  เห็นและส่งได้เฉพาะ assignment ของคอร์สที่ผู้เรียนมี subscription แบบ active
  ถ้าไม่มีสิทธิ์จะได้ `404` เหมือน assignment ที่ไม่มีอยู่จริง
- **หน้า My Assignments:** ต่อ API แทนข้อมูล mock ใช้ `AssignmentCard` ของเพื่อนเหมือนเดิม
  แล้วปรับส่วนหัวและการ์ดให้ตรง Figma วัดขนาดจริงในเบราว์เซอร์ที่ความกว้าง 1440px
- **ปุ่ม "Open in Course":** ลิงก์ตรงกับ URL ของ player (`/courses/course-{courseId}/learn/sub-{lessonPosition}-{subLessonPosition}`)
  API ส่ง `lessonPosition` กับ `subLessonPosition` มาให้ ซึ่งเป็นค่าเดียวกับที่ progress API ของ PR #31 ใช้
  เปิดหน้า player ได้ต่อเมื่อบัญชีนั้นมี subscription ของคอร์สนั้น
- **Widget assignment ในหน้า course player:** คอร์สจริงโหลด assignment จาก `GET /api/me/assignments` แล้วจับคู่กับ sub-lesson
  ด้วย `subLessonId` (ตรงกับ `id` ใน progress API) กดส่งแล้วบันทึกผ่าน `POST /api/me/assignments/{id}/submissions`
  และการ์ดแสดงสถานะตามที่ server ตอบ (หลัง PR #33 player แสดงเฉพาะคอร์สจริง
  ข้อมูล assignment mock ใน `data/courses.ts` จึงไม่ถูกแสดงอีก)
- **การ์ด Submitted ในหน้า player ตรง Figma:** คำตอบเป็นข้อความเปล่าขึ้นบรรทัดใหม่ได้ (เดิมอยู่ในกล่องสีขาวและบรรทัดยุบรวมกัน)
  badge Submitted และ Overdue 14px วัดในเบราว์เซอร์ได้ Pending 739×314 และ Submitted 739×261 ตรง Figma
- **แก้บั๊กของ `AssignmentCard`:** เมื่อสถานะเปลี่ยนเป็น Submitted ช่องกรอกยังค้าง (ค่า `isEditable` คำนวณครั้งเดียว) ตอนนี้เป็น computed
- **ฟอร์ม admin:** เพิ่มช่อง "Assign within (days, optional)" หน้า admin ใน Figma ไม่มีช่องนี้
  แต่ใช้แสดงข้อความแนะนำ "Assign within N days" บนการ์ด (ไม่บังคับ)
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
