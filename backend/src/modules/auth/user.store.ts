/* ============================================================
   User store (file-backed) + bootstrap admin/executive from env
   - passwordHash เท่านั้น (ไม่เก็บ plain)
   ============================================================ */
import { randomUUID } from "node:crypto";
import type { UserRole } from "@tracking-cyd/shared";
import { env } from "../../config/env";
import { dataFile, readJson, writeJson } from "./file-db";
import { hashPassword, verifyPassword } from "./password";

export interface UserRecord {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string | null;
}

const FILE = () => dataFile("users.json");
export const FIXED_USERS = {
  admin: { username: "admin", password: "admin1234" },
  executive: { username: "executive", password: "cyd12345" },
} as const;

function loadAll(): UserRecord[] {
  return readJson<UserRecord[]>(FILE(), []);
}
function saveAll(users: UserRecord[]): void {
  writeJson(FILE(), users);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const userStore = {
  findByEmail(email: string): UserRecord | undefined {
    const e = normalizeEmail(email);
    return loadAll().find((u) => u.email === e);
  },
  findById(id: string): UserRecord | undefined {
    return loadAll().find((u) => u.id === id);
  },
  list(): UserRecord[] {
    return loadAll();
  },
  create(input: { email: string; displayName: string; password: string; role: UserRole }): UserRecord {
    const users = loadAll();
    const now = new Date().toISOString();
    const rec: UserRecord = {
      id: randomUUID(),
      email: normalizeEmail(input.email),
      displayName: input.displayName,
      passwordHash: hashPassword(input.password),
      role: input.role,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: null,
    };
    users.push(rec);
    saveAll(users);
    return rec;
  },
  ensure(input: { email: string; displayName: string; password: string; role: UserRole }): "created" | "updated" | "unchanged" {
    const users = loadAll();
    const email = normalizeEmail(input.email);
    const existing = users.find((u) => u.email === email);
    if (!existing) {
      this.create(input);
      return "created";
    }
    const changed =
      existing.displayName !== input.displayName ||
      existing.role !== input.role ||
      !existing.isActive ||
      !verifyPassword(input.password, existing.passwordHash);
    if (!changed) return "unchanged";
    existing.displayName = input.displayName;
    existing.role = input.role;
    existing.isActive = true;
    existing.passwordHash = hashPassword(input.password);
    existing.updatedAt = new Date().toISOString();
    saveAll(users);
    return "updated";
  },
  touchLogin(id: string): void {
    const users = loadAll();
    const u = users.find((x) => x.id === id);
    if (!u) return;
    u.lastLoginAt = new Date().toISOString();
    u.updatedAt = u.lastLoginAt;
    saveAll(users);
  },
};

/** สร้าง user จาก env ถ้ายังไม่มี (idempotent) — เรียกตอน startup */
export function bootstrapUsers(): { created: string[]; warnings: string[] } {
  const created: string[] = [];
  const warnings: string[] = [];

  const seed = (email: string, password: string, role: UserRole, displayName: string) => {
    if (!email || !password) return;
    if (password.length < env.AUTH_PASSWORD_MIN_LENGTH) {
      warnings.push(`bootstrap ${role}: รหัสผ่านสั้นกว่า ${env.AUTH_PASSWORD_MIN_LENGTH} ตัวอักษร — ข้าม`);
      return;
    }
    const result = userStore.ensure({ email, password, displayName, role });
    if (result !== "unchanged") created.push(`${role}:${email}`);
  };

  const fixed = env.NODE_ENV !== "test";
  seed(fixed ? FIXED_USERS.admin.username : env.BOOTSTRAP_ADMIN_EMAIL, fixed ? FIXED_USERS.admin.password : env.BOOTSTRAP_ADMIN_PASSWORD, "admin", "Administrator");
  seed(fixed ? FIXED_USERS.executive.username : env.BOOTSTRAP_EXECUTIVE_EMAIL, fixed ? FIXED_USERS.executive.password : env.BOOTSTRAP_EXECUTIVE_PASSWORD, "executive", "Executive");

  if (userStore.list().length === 0) {
    warnings.push("ยังไม่มีผู้ใช้ในระบบ — ตั้งค่า BOOTSTRAP_ADMIN_EMAIL/PASSWORD ใน backend/.env เพื่อสร้างผู้ดูแลระบบ");
  }
  return { created, warnings };
}
