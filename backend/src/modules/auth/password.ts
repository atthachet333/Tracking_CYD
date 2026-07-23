/* ============================================================
   Password hashing (bcrypt via bcryptjs — pure JS, ไม่ต้อง build native)
   - ห้ามเก็บ plain text, ห้าม log
   ============================================================ */
import bcrypt from "bcryptjs";

// bcryptjs เป็น pure-JS (ช้ากว่า native) — ลด cost ใน test เพื่อความเร็ว, prod ใช้ 12
const COST = process.env.NODE_ENV === "test" ? 8 : 12;

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, COST);
}

export function verifyPassword(plain: string, hash: string): boolean {
  if (!hash) return false;
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}
