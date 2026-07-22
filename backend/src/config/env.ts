/* ============================================================
   Environment configuration + validation (typed)
   - โหลด/ตรวจสอบ env ตอน startup
   - ไม่ crash เมื่อ credential ยังว่าง (แค่ configured=false)
   - ไม่เปิดเผย private key
   ============================================================ */
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, "$2");
  }
}

const here = dirname(fileURLToPath(import.meta.url));
if (process.env.NODE_ENV !== "test") {
  loadEnvFile(resolve(here, "../../../.env"));
  loadEnvFile(resolve(here, "../../.env"));
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BACKEND_PORT: z.coerce.number().int().positive().default(6678),
  FRONTEND_ORIGIN: z.string().default("http://localhost:6677"),

  // ชีตต้นทาง/ปลายทางสำหรับระบบ sync
  GOOGLE_SOURCE_SPREADSHEET_ID: z.string().default(""),
  GOOGLE_TARGET_SPREADSHEET_ID: z.string().default(""),
  GOOGLE_TARGET_ADMIN_SHEET: z.string().default("ADMIN"),
  GOOGLE_TARGET_DOCUMENTS_SHEET: z.string().default("DOCUMENTS"),
  // แท็บสำหรับเขียน "สรุปยอด" ที่คำนวณจาก Sheet 2 ลงใน Sheet 1 (ปลายทาง)
  GOOGLE_TARGET_SUMMARY_SHEET: z.string().default("SUMMARY"),

  // (legacy) ใช้กับ dashboard endpoints เดิม — ถ้าว่างจะ fallback เป็น source id
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().default(""),
  GOOGLE_SHEETS_DEFAULT_GID: z.coerce.number().int().nonnegative().default(0),
  GOOGLE_SHEETS_DEFAULT_RANGE: z.string().default("A:ZZ"),
  GOOGLE_SHEETS_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  GOOGLE_SHEETS_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  GOOGLE_SHEETS_AUTH_MODE: z.enum(["service_account"]).default("service_account"),

  // Customer dashboard (อ่านสถานะลูกค้าจากชีตต้นทาง)
  CUSTOMER_DASHBOARD_SOURCE_GID: z.coerce.number().int().nonnegative().default(1532373081),
  CUSTOMER_DASHBOARD_STATUS_HEADER: z.string().default("สถานะลูกค้า"),
  CUSTOMER_DASHBOARD_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(45),

  // Documents dashboard (แท็บ DOCUMENTS ในชีตปลายทาง)
  DOCUMENTS_DASHBOARD_GID: z.coerce.number().int().nonnegative().default(1341336506),
  DOCUMENTS_DASHBOARD_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(45),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().default(""),
  GOOGLE_PRIVATE_KEY: z.string().default(""),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // แสดงเฉพาะชื่อฟิลด์ที่ผิด ไม่แสดงค่า (กันรั่วไหล)
  const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  // eslint-disable-next-line no-console
  console.error(`[env] การตั้งค่า environment ไม่ถูกต้อง: ${fields}`);
  throw new Error("Invalid environment configuration");
}

export const env: Env = parsed.data;

/** private key ใน .env ใช้ \n เป็น escape — แปลงกลับเป็นบรรทัดจริง */
export function getPrivateKey(): string {
  return env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
}

/** id ของชีตต้นทาง */
export function sourceSpreadsheetId(): string {
  return env.GOOGLE_SOURCE_SPREADSHEET_ID;
}
/** id ของชีตปลายทาง */
export function targetSpreadsheetId(): string {
  return env.GOOGLE_TARGET_SPREADSHEET_ID;
}
/** id สำหรับ dashboard เดิม (fallback → source) */
export function legacySpreadsheetId(): string {
  return env.GOOGLE_SHEETS_SPREADSHEET_ID || env.GOOGLE_SOURCE_SPREADSHEET_ID;
}

/** มี credential (email + private key) ครบหรือยัง */
export function hasCredentials(): boolean {
  return Boolean(env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY);
}

/** Google Sheets ถูกตั้งค่าครบสำหรับ sync หรือยัง (credential + source + target) */
export function isGoogleConfigured(): boolean {
  return Boolean(
    hasCredentials() &&
      env.GOOGLE_SOURCE_SPREADSHEET_ID &&
      env.GOOGLE_TARGET_SPREADSHEET_ID,
  );
}

/** รายชื่อ env ที่ยังขาด (สำหรับ log/health — ไม่รวมค่า) */
export function missingGoogleEnv(): string[] {
  const missing: string[] = [];
  if (!env.GOOGLE_SERVICE_ACCOUNT_EMAIL) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!env.GOOGLE_PRIVATE_KEY) missing.push("GOOGLE_PRIVATE_KEY");
  if (!env.GOOGLE_SOURCE_SPREADSHEET_ID) missing.push("GOOGLE_SOURCE_SPREADSHEET_ID");
  if (!env.GOOGLE_TARGET_SPREADSHEET_ID) missing.push("GOOGLE_TARGET_SPREADSHEET_ID");
  return missing;
}
