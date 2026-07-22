# modules/

โฟลเดอร์สำหรับจัดกลุ่มโมดูลตามโดเมนในอนาคต (เช่น เมื่อย้ายไปใช้ NestJS หรือแยก feature modules)

ปัจจุบันสถาปัตยกรรมแบ่งเป็น 3 เลเยอร์:

- `controllers/` — รับ request, แปลง/ตรวจสอบพารามิเตอร์, เรียก service
- `services/` — business logic และการคำนวณ KPI
- `data/` — repository layer (in-memory) พร้อมเปลี่ยนเป็น PostgreSQL/Prisma ภายหลัง
