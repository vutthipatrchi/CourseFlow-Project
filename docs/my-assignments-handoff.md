# ส่งต่องาน: My Assignments (ดูสถานะ assignment)

**Branch:** `feature/assignment-status` (ยังไม่เปิด PR) · **อัปเดตล่าสุด:** 2026-09-24

## สรุป

Story "As a User, I can view my assignment status" ส่วนของเรา คือ backend API กับหน้า
My Assignments ทำเสร็จและทดสอบแล้ว (contract อยู่ที่ [api.md](./api.md#my-assignments))
ยังมี 8 เรื่องค้างอยู่ เป็นงานของ story อื่นหรือต้องให้ทีมตัดสินใจ มีแค่ข้อ 1 (ลำดับการเปิด PR)
ที่เกี่ยวกับการ merge ส่วนข้อที่เหลือไม่บล็อก

## รายการที่ยังรอ

| # | Item | Blocked on | Resume when / how | Status |
| --- | --- | --- | --- | --- |
| 1 | เปิด PR | ตกลงกันว่ารองานที่เกี่ยวข้องจากคนอื่นเข้า `dev` ก่อน | ก่อนเปิดให้ rebase ทับ `dev` แล้วเช็คว่าเลข migration `V10` ยังว่าง ถ้ามีคนใช้ไปแล้วให้เปลี่ยนเป็นเลขถัดไป (เลข V3 ชนเคยทำให้ต้องรีเซ็ต DB กลางมาแล้ว) | **รอ** |
| 2 | หน้า course player ยังใช้ข้อมูล mock | ไม่มี API คอร์สฝั่งผู้เรียน มีแค่ `/api/admin/...` หน้า course list, detail และ player อ่านจาก `data/courses.ts` (id เป็น `course-1`) | ทำ API ดึงคอร์สและ sub-lesson จริง แล้วให้ player ใช้ข้อมูลนั้น | **รอเจ้าของ course player และการ์ด learning progress** |
| 3 | Assignment widget ใต้วิดีโอใน player ยังไม่ต่อ API | ข้อ 2 | เรียก `GET /api/me/assignments` แล้วกรองด้วย `subLessonId` ของบทที่เปิดอยู่ ส่งงานด้วย `POST /api/me/assignments/{id}/submissions` ไม่ต้องเพิ่ม endpoint | **รอข้อ 2** |
| 4 | ปุ่ม "Open in Course" เปิดแล้วหน้าว่าง | ลิงก์ชี้ไป `/courses/{courseId}/learn/{subLessonId}` ด้วย id ตัวเลขจาก API แต่ player หาคอร์สจาก id แบบ mock | หายเองเมื่อทำข้อ 2 ไม่ต้องแก้หน้า My Assignments | **รอข้อ 2** |
| 5 | สถานะ `in-progress` | backend ไม่มีข้อมูลว่าผู้เรียนเริ่มเรียน sub-lesson นั้นแล้วหรือยัง (learning progress) | เมื่อมี API progress ให้เพิ่มเงื่อนไขใน `AssignmentSubmissionService.toView` ตอนนี้คืนแค่ `pending` / `overdue` / `submitted` type ฝั่ง frontend รองรับค่า `in-progress` อยู่แล้ว | **รอการ์ด learning progress** |
| 6 | ข้อมูล assignment ซ้ำซ้อน 2 แหล่ง | `data/courses.ts` ยังมี assignment และสถานะ mock ส่งงานในหน้า player จึงไม่ไปโผล่ใน My Assignments | หายเองเมื่อทำข้อ 2 และ 3 | **ผลพวงของข้อ 2** |
| 7 | Navbar สูง 76px แต่ Figma กำหนด 88px | `AppNavbar` เป็น component กลาง กระทบทุกหน้า ไม่ใช่ของ story นี้ | ให้เจ้าของ navbar ตัดสินใจและแก้ทีเดียว | **ยังไม่มีเจ้าของ** |
| 8 | Figma ของหน้านี้ไม่สม่ำเสมอ | ช่องกรอกของ Pending สูง 96px แต่ In progress และ Overdue สูง 120px ส่วน badge Submitted และ Overdue ใช้ตัวอักษร 14px แต่ Pending และ In progress ใช้ 16px | เราใช้ช่องกรอก 120px ทุกสถานะ และทำขนาด badge ตาม Figma ถ้าดีไซเนอร์ยืนยันว่า Pending ต้อง 96px ให้แก้ `h-30` ใน `AssignmentCard.vue` | **รอยืนยัน design** |

## เรื่องที่จบแล้ว

- **Schema (V10):** เพิ่ม `assignments.duration_days` (ไม่บังคับ ถ้าเป็น `NULL` จะไม่มีวัน overdue)
  และตาราง `assignment_submissions` (1 คนต่อ 1 assignment ส่งซ้ำแล้วทับคำตอบเดิม)
  ใช้เลข V10 เพราะ `dev` ใช้ V9 กับ profile fields ไปแล้ว
- **API:** `GET /api/me/assignments` และ `POST /api/me/assignments/{id}/submissions`
  เห็นและส่งได้เฉพาะ assignment ของคอร์สที่ผู้เรียนมี subscription แบบ active
  ถ้าไม่มีสิทธิ์จะได้ `404` เหมือน assignment ที่ไม่มีอยู่จริง
- **หน้า My Assignments:** ต่อ API แทนข้อมูล mock ใช้ `AssignmentCard` ของเพื่อนเหมือนเดิม
  แล้วปรับส่วนหัวและการ์ดให้ตรง Figma วัดขนาดจริงในเบราว์เซอร์ที่ความกว้าง 1440px
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
