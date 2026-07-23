/* ============================================================
   File-backed JSON store (persistent, no native deps)
   - เพียงพอสำหรับ deployment เดี่ยว; ถ้าสเกลหลาย instance ควรเปลี่ยนเป็น DB
   - เขียนแบบ atomic (เขียน temp แล้ว rename)
   ============================================================ */
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { authDataDir } from "../../config/env";

function ensureDir(dir: string): void {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function dataFile(name: string): string {
  const dir = authDataDir();
  ensureDir(dir);
  return join(dir, name);
}

export function readJson<T>(file: string, fallback: T): T {
  try {
    if (!existsSync(file)) return fallback;
    return JSON.parse(readFileSync(file, "utf8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(file: string, value: unknown): void {
  ensureDir(dirname(file));
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  renameSync(tmp, file);
}

/** append หนึ่งบรรทัด JSON (สำหรับ audit log แบบ append-only) */
export function appendJsonl(file: string, value: unknown): void {
  ensureDir(dirname(file));
  writeFileSync(file, `${JSON.stringify(value)}\n`, { flag: "a", encoding: "utf8" });
}

export function readJsonl<T>(file: string): T[] {
  try {
    if (!existsSync(file)) return [];
    return readFileSync(file, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as T);
  } catch {
    return [];
  }
}
