/* ============================================================
   Session store (file-backed)
   - เก็บ hash ของ token เท่านั้น (ไม่เก็บ raw token)
   - มี expiry + revoke
   ============================================================ */
import { randomBytes, createHash, randomUUID } from "node:crypto";
import { env } from "../../config/env";
import { dataFile, readJson, writeJson } from "./file-db";

export interface SessionRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
  ipAddress: string | null;
  userAgent: string | null;
}

const FILE = () => dataFile("sessions.json");

function loadAll(): SessionRecord[] {
  return readJson<SessionRecord[]>(FILE(), []);
}
function saveAll(s: SessionRecord[]): void {
  writeJson(FILE(), s);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const sessionStore = {
  /** สร้าง session ใหม่ คืน raw token (เก็บใน cookie) — token จริงไม่ถูกบันทึก */
  create(userId: string, meta: { ip: string | null; ua: string | null }): { token: string; record: SessionRecord } {
    const token = randomBytes(32).toString("hex");
    const now = Date.now();
    const record: SessionRecord = {
      id: randomUUID(),
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(now + env.AUTH_SESSION_TTL_SECONDS * 1000).toISOString(),
      createdAt: new Date(now).toISOString(),
      revokedAt: null,
      ipAddress: meta.ip,
      userAgent: meta.ua,
    };
    const all = loadAll().filter((s) => new Date(s.expiresAt).getTime() > now && !s.revokedAt); // prune ระหว่างทาง
    all.push(record);
    saveAll(all);
    return { token, record };
  },

  /** ตรวจ token → session ที่ยัง valid (ไม่หมดอายุ/ไม่ถูก revoke) */
  verify(token: string): SessionRecord | null {
    if (!token) return null;
    const h = hashToken(token);
    const s = loadAll().find((x) => x.tokenHash === h);
    if (!s) return null;
    if (s.revokedAt) return null;
    if (new Date(s.expiresAt).getTime() <= Date.now()) return null;
    return s;
  },

  revokeByToken(token: string): void {
    if (!token) return;
    const h = hashToken(token);
    const all = loadAll();
    const s = all.find((x) => x.tokenHash === h);
    if (s && !s.revokedAt) {
      s.revokedAt = new Date().toISOString();
      saveAll(all);
    }
  },
};
