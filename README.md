# CHAIYADET PROGRESS · ระบบภาพรวมแผนก Admin & เอกสาร

Full-Stack Enterprise Dashboard ที่ดึงข้อมูล **จริง** จาก **Google Sheets** ผ่าน Backend
(ไม่มี Mock Data — ถ้าชีตว่างจะแสดง Empty State, ถ้ามีข้อมูลจะคำนวณ KPI จากข้อมูลจริง)

- **frontend**: React + Vite + TypeScript + Tailwind + TanStack Query → `http://localhost:6677`
- **backend**: Node.js + Fastify + TypeScript + googleapis → `http://localhost:6678`
- **shared**: types + zod schemas ใช้ร่วมกัน

---

## สถาปัตยกรรม

```
Frontend (React) ── /api ──► Vite proxy ──► Backend (Fastify :6678)
                                              │
        Controller → Application Service → Google Sheets Service
                                              │
                    Google Sheets Client (Service Account, read-only)
                    + Cache (TTL, single-flight) + Mapper (header/date)
                                              │
                                     Google Sheets API v4
```

Frontend **ไม่** ติดต่อ Google Sheets โดยตรง — ทุกอย่างผ่าน Backend เท่านั้น (credential อยู่ที่ backend)

---

## โครงสร้างโฟลเดอร์ (ย่อ)

```
backend/src/
├── config/            env.ts (typed+validated), sheet-column-map.ts (header aliases)
├── integrations/google-sheets/
│   ├── google-sheets.client.ts    # googleapis + Service Account + retry
│   ├── google-sheets.service.ts   # orchestrate: metadata→read→map→cache
│   ├── google-sheets.mapper.ts    # header mapping + date parse + warnings
│   ├── google-sheets.cache.ts     # TTL cache + single-flight
│   ├── google-sheets.errors.ts    # error codes + mapping
│   └── google-sheets.types.ts
├── services/          dashboardService, entityService, calculations.ts (pure KPI)
├── controllers/       apiController, sheetsController
├── routes/            apiRoutes.ts
├── middleware/        errorHandler.ts (ApiErrorBody + requestId)
├── lib/               date.ts (พ.ศ./serial/ISO parser)
└── server.ts          # fastify + helmet + cors + rate-limit + graceful shutdown

frontend/src/
├── services/          api-client.ts, sheets-api.ts, dashboard-api.ts
├── lib/               query-keys.ts
├── hooks/             useApi.ts (TanStack Query + refresh mutation)
├── components/dashboard/ SheetConnection.tsx (sync bar + empty state)
├── pages/             ... + GoogleSheetsIntegrationPage.tsx
```

---

## การติดตั้ง & เปิดระบบ

> บน **Windows** แนะนำใช้ `npm.cmd` (กัน `npm` ตัวอื่นใน `C:\Windows\System32`)

```bat
npm.cmd install
npm.cmd run dev
```

- Frontend: http://localhost:6677
- Backend: http://localhost:6678
- Health: http://localhost:6678/api/health
- Sheets status: http://localhost:6678/api/sheets/status

---

## ตั้งค่า Google Cloud + Service Account

1. สร้าง **Google Cloud Project** ที่ https://console.cloud.google.com
2. เปิดใช้งาน **Google Sheets API** (APIs & Services → Enable APIs)
3. สร้าง **Service Account** (IAM & Admin → Service Accounts)
4. สร้าง **Key** ชนิด JSON ให้ Service Account (Keys → Add Key → JSON)
5. คัดลอก **client_email** และ **private_key** จากไฟล์ JSON
6. เปิด Google Sheet → **Share** → ใส่ client_email → สิทธิ์ **Viewer**
7. ใส่ค่าใน `backend/.env` (คัดลอกจาก `backend/.env.example`):

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=1-w8ptKcra1t4V-IgT6q3rQf-QYq1-glz_EGv4O88ltw
GOOGLE_SHEETS_DEFAULT_GID=0
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@yyy.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

> **Private Key** ต้องครอบด้วย `"..."` และคง `\n` ไว้ — ระบบจะแปลง `\n` เป็นบรรทัดจริงให้เอง

8. **Restart backend** (`npm.cmd run dev:backend`)

**ห้าม commit**: `.env`, service account JSON, private key, token, credential — มีอยู่ใน `.gitignore` แล้ว

---

## ตรวจสอบการเชื่อมต่อ

```bat
curl.exe -i http://localhost:6678/api/health
curl.exe -i http://localhost:6678/api/sheets/status
curl.exe -i http://localhost:6677
curl.exe -i http://localhost:6677/api/sheets/status

REM Customer dashboard
curl.exe -i http://localhost:6678/api/customer-dashboard/summary
curl.exe -i http://localhost:6678/api/customer-dashboard/status-distribution
curl.exe -i http://localhost:6678/api/customer-dashboard/actual-statuses
curl.exe -i "http://localhost:6678/api/customer-dashboard/customers?page=1&pageSize=20"
curl.exe -i http://localhost:6678/api/customer-dashboard/in-progress-cases
curl.exe -i http://localhost:6678/api/customer-dashboard/completed-cases
curl.exe -i "http://localhost:6678/api/customer-dashboard/problem-cases?page=1&pageSize=20"

REM Documents dashboard + Unified tasks
curl.exe -i http://localhost:6678/api/documents-dashboard/summary
curl.exe -i http://localhost:6678/api/documents-dashboard/assignees
curl.exe -i http://localhost:6678/api/documents-dashboard/companies
curl.exe -i "http://localhost:6678/api/documents-dashboard/items?page=1&pageSize=20"
curl.exe -i "http://localhost:6678/api/tasks/unified?page=1&pageSize=20"
curl.exe -i "http://localhost:6678/api/tasks/unified?department=documents"
```

หรือเปิดหน้า **ตั้งค่า → การเชื่อมต่อ Google Sheets** ในเว็บ (`/dashboard/settings/integrations/google-sheets`)
→ กด **Test Connection** / **Sync Now**

---

## API Endpoints

| Method | Endpoint | รายละเอียด |
|--------|----------|-----------|
| GET | `/api/health` | สถานะระบบ + dependency googleSheets |
| GET | `/api/sheets/status` | configured / connected / lastSyncAt / rowCount |
| GET | `/api/sheets/metadata` | title + รายชื่อ sheet (sheetId, title, row/col count) |
| GET | `/api/sheets/headers` | header แถวแรก + mapping + warnings |
| GET | `/api/sheets/rows` | `?page=&pageSize=&search=&sortBy=&sortOrder=` |
| POST | `/api/sheets/refresh` | ล้าง cache แล้วอ่านใหม่ (rate-limited) |
| GET | `/api/dashboard/summary` | KPI คำนวณจาก cases จริง |
| GET | `/api/dashboard/trends` | แนวโน้มรายเดือน |
| GET | `/api/dashboard/insights` | Insight (หรือ “ข้อมูลไม่พอ”) |
| GET | `/api/customer-dashboard/summary` | KPI ลูกค้า (total/uniqueCompanies/uniqueCases/completed/issues/inProgress/unclassified + rates) + insights · `?refresh=true` |
| GET | `/api/customer-dashboard/status-distribution` | สัดส่วนตามกลุ่ม (donut) + `actual[]` ค่าสถานะจริง (bar) |
| GET | `/api/customer-dashboard/actual-statuses` | จำนวนตามค่าสถานะจริง (เรียงมากไปน้อย) |
| GET | `/api/customer-dashboard/customers` | ตารางลูกค้าทั้งหมด (ครบทุกคอลัมน์) · `?page=&pageSize=&search=&status=&statusGroup=&assignee=&dateFrom=&dateTo=&sortBy=&sortOrder=` |
| GET | `/api/customer-dashboard/recent-cases` | เคสล่าสุด (จัดกลุ่มสถานะแล้ว) |
| GET | `/api/customer-dashboard/problem-cases` | เฉพาะกลุ่ม issues · `?page=&pageSize=&search=&status=` |
| GET | `/api/customer-dashboard/in-progress-cases` | เคสกลุ่มกำลังดำเนินการ |
| GET | `/api/customer-dashboard/completed-cases` | เคสกลุ่มปิดสำเร็จ |
| GET | `/api/customer-dashboard/trends` | แนวโน้มรายเดือนจากวันที่จริง |
| GET | `/api/documents-dashboard/summary` | KPI งานเอกสาร (total/inProgress/completed/issues/unclassified/uniqueCompanies/totalEmployees + rates) + insights |
| GET | `/api/documents-dashboard/status-distribution` | สัดส่วนกลุ่ม + `actual[]` ค่าสถานะจริง |
| GET | `/api/documents-dashboard/assignees` `/workload` | สถิติรายผู้รับผิดชอบ + ระดับภาระงาน |
| GET | `/api/documents-dashboard/companies` | บริษัทที่ดูแล (จำนวนงาน/ผู้รับผิดชอบ/สถานะล่าสุด) |
| GET | `/api/documents-dashboard/items` | ตารางงานเอกสาร · `?page=&pageSize=&search=&status=&statusGroup=&assignee=&company=&dateFrom=&dateTo=&sortBy=&sortOrder=` |
| GET | `/api/documents-dashboard/recent-items` `/problem-items` `/trends` `/headers` | ล่าสุด / ปัญหา / แนวโน้ม / header+preview |
| GET | `/api/tasks/unified` | งานรวม Admin + Documents · `?department=admin\|documents&…` + `summary{all,admin,documents}` |
| GET | `/api/employees` `/employees/:id` `/employees/org-chart` | derived จาก assignee |
| GET | `/api/tasks` `/customers` `/reports` | derived จาก cases |
| GET | `/api/documents` `/approvals` `/notifications` | ว่าง (ยังไม่มีแหล่งข้อมูล) |

รูปแบบ error เดียวกันทุก endpoint:

```json
{ "error": { "code": "GOOGLE_SHEETS_NOT_CONFIGURED", "message": "...", "details": [], "requestId": "..." } }
```

Error codes: `GOOGLE_SHEETS_NOT_CONFIGURED`, `GOOGLE_SHEETS_PERMISSION_DENIED`, `GOOGLE_SHEETS_NOT_FOUND`, `GOOGLE_SHEET_TAB_NOT_FOUND`, `GOOGLE_SHEETS_RATE_LIMITED`, `GOOGLE_SHEETS_INVALID_DATA`, `GOOGLE_SHEETS_CONNECTION_FAILED`, `VALIDATION_ERROR`

---

## ภาพรวมลูกค้าและสถานะเคส (Customer Dashboard)

หน้า `/dashboard/customer-overview` สรุปสถานะลูกค้าจาก **ชีตต้นทางจริง** (ไม่มี mock / ไม่ hardcode)

- แหล่งข้อมูล: แท็บผู้รับผิดชอบใน source spreadsheet (พี่คิม / แอม / พี่วิ / พี่แอน) — แหล่งเดียวกับ Admin Sync
- ดึงคอลัมน์ **"สถานะลูกค้า" จาก header จริง** (dynamic header detection) — ไม่ผูกกับคอลัมน์ J / index 9
- dedup ด้วย business key เดียวกับ Admin Sync (`mapSourceToAdmin` → `source_record_id`)
- จัดกลุ่มสถานะแบบ configurable ที่ `backend/src/modules/customer-dashboard/customer-status.config.ts`
  (`in_progress` / `completed` / `issues` / `unclassified`) — normalize: trim, ลด whitespace, lowercase อังกฤษ, ตัด phinthu ที่พิมพ์เกิน
- cache TTL `CUSTOMER_DASHBOARD_CACHE_TTL_SECONDS` (ค่าเริ่มต้น 45s) + `?refresh=true`

> **หมายเหตุสำคัญ (data source):** `gid=1532373081` ที่ระบุไว้คือแท็บ **"runnumber"** ซึ่ง **ไม่มี** คอลัมน์ "สถานะลูกค้า"
> ระบบจึง resolve gid นี้เพื่อ traceability + ออก warning แล้วรวมสถานะจากแท็บผู้รับผิดชอบที่มี header จริงแทน
> ตั้งค่าได้ที่ `CUSTOMER_DASHBOARD_SOURCE_GID` / `CUSTOMER_DASHBOARD_STATUS_HEADER`

ทุก response มี `meta` (masked `spreadsheetId`, `sheetId`, `sheetTitle`, `statusHeader`, `tabsAggregated`, `rowsRead`, `warnings`) — ไม่มี credential

**Executive Overview (`/dashboard`)** ถูกปรับเป็น customer-focused:
- KPI 4 ใบตามลำดับ: **ลูกค้าทั้งหมด → ปิดเคสสำเร็จ → ปัญหาที่พบเจอ → กำลังดำเนินการ** (คลิกเพื่อกรองตารางลูกค้า) — เอา KPI เดิม (มูลค่าบริการรวม / งานสำเร็จเดิม / SLA เฉลี่ย + กราฟ SLA) ออก
- Section: Donut (กลุ่ม) · Bar (สถานะจริง) · ตารางลูกค้าทั้งหมด (ครบทุกคอลัมน์ + ค้นหา/กรองสถานะ/กรองผู้รับผิดชอบ/เรียง/pagination/Export CSV/Detail Drawer/sticky header/scroll) · เคสมีปัญหา · กำลังดำเนินการ · ปิดสำเร็จล่าสุด · Insight (rule-based จากตัวเลขจริง)
- **รายงาน (`/dashboard/reports`)** วิเคราะห์จากสถานะลูกค้า: rates, donut, bar, stacked bar แยกผู้รับผิดชอบ, trend, ตารางรายละเอียด + Export CSV
- **งานทั้งหมด (`/dashboard/tasks`)** ดึงข้อมูลลูกค้าจริงครบทุกคอลัมน์ (วันที่ / รหัสเคส / บริษัท / รายละเอียด / ใบเสนอราคา / ติดตาม 1-3 / สถานะ / มัดจำ / ร่างสัญญา / ลิงก์สัญญา / ผู้รับผิดชอบ)

> **หมายเหตุ (Integration mapping):** `sheet-column-map` เดิม (feeds `CaseRow` + legacy dashboard) ถูก **คงไว้** เพื่อไม่ให้ integration เดิมพัง — การ map คอลัมน์ลูกค้า (followUp/deposit/contract ฯลฯ) จัดการแบบ dynamic-by-header ในโมดูล customer-dashboard แล้ว หน้า Google Sheets Integration ยังทำงานตามเดิม (headers/preview/mapping/row count/sheet id)

Sidebar: เพิ่มเมนู **"ภาพรวมลูกค้าและสถานะเคส"** และ **"เชื่อมต่อ Google Sheets"**; นำเมนู **ศูนย์จัดการงานเอกสาร / ศูนย์อนุมัติเอกสาร / ปฏิทินงาน** ออกจาก Sidebar + Routing (หน้าและ API เดิมยังคงอยู่ ไม่ถูกลบ)

---

## แผนกเอกสาร (Documents Dashboard) + งานรวม (Unified Tasks)

โมดูล `backend/src/modules/documents-dashboard/` อ่านแท็บ **DOCUMENTS** (gid `1341336506`) ในชีตปลายทางจริง — map ตาม header จริง (dynamic detection, ไม่ผูก index), จำแนกสถานะ configurable, cache TTL + refresh

> **หมายเหตุสำคัญ (data จริงที่พบ):** แท็บ DOCUMENTS มีโครงสร้างคอลัมน์เหมือน ADMIN แต่คอลัมน์ **"สถานะลูกค้า" ว่างทุกแถว** — ค่าขั้นตอนจริงอยู่ใน **"ทำใบเสนอราคา"** (เช่น "ดำเนินการเรียบร้อย") ระบบจึง **resolve สถานะแบบ fallback** (status header → ทำใบเสนอราคา → ติดตามล่าสุด) พร้อมออก warning โปร่งใส · ผู้รับผิดชอบมี typo (พี่อััง) จึง normalize ก่อนนับ

หน้าใหม่/ปรับปรุง:
- **`/dashboard/documents-overview`** — ภาพรวมแผนกเอกสาร (KPI 6, สถานะ, workload, ตารางผู้รับผิดชอบ/บริษัท, งานล่าสุด, insight)
- **`/dashboard` (Executive Overview)** — รวม Admin + Documents: KPI 4 (ลูกค้า / งานทั้งหมด / เสร็จสิ้น / ต้องติดตาม) + KPI รอง + เปรียบเทียบแผนก + สถานะรวม + workload + top companies + งานล่าสุด (ไม่มีตารางยาว)
- **`/dashboard/team`** — เปลี่ยนชื่อเป็น **"ภาพรวมแอดมินและเอกสาร"** แสดงพนักงานจริงจาก assignee + แยกทีม Admin/เอกสาร + workload
- **`/dashboard/tasks` (งานทั้งหมด)** — รายการงานรวม Admin + Documents (`/api/tasks/unified`) พร้อม filter แผนก/สถานะ/ผู้รับผิดชอบ, deep-link `?department=&statusGroup=&assignee=`, Export CSV, Detail Drawer
- หน้า Google Sheets Integration — เพิ่มพาเนล DOCUMENTS (header/mapping/preview/row count/warnings)

---

## พฤติกรรมเมื่อชีตว่าง (Empty Sheet)

- KPI ทั้งหมด = **0**
- ตาราง/กราฟ/Org Chart = ว่าง (ไม่มีข้อมูลปลอม)
- Insight = “ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์”
- Dashboard แสดง **Empty State** พร้อมปุ่ม: เปิด Google Sheets · รีเฟรชข้อมูล · ตรวจสอบการเชื่อมต่อ

เมื่อมีข้อมูล → ระบบคำนวณและแสดงผลจริงทันทีหลังกด Sync/Refresh

---

## Header Mapping (ไม่ผูกกับตำแหน่งคอลัมน์)

ระบบอ่าน **ชื่อ header จากแถวแรก** แล้ว map เป็นฟิลด์มาตรฐาน รองรับทั้งไทย/อังกฤษ
เช่น `Case No / เลขเคส / รหัสเคส` → `caseNo`, `ลูกค้า / Customer / บริษัท` → `customerName`
แก้ไข alias ได้ที่ `backend/src/config/sheet-column-map.ts`
หากคอลัมน์จำเป็น (`caseNo`, `customerName`, `status`) ขาด → ระบบไม่ crash, คืน warnings และหน้า Settings จะเตือน

รองรับวันที่: `DD/MM/YYYY`, `DD/MM/BBBB (พ.ศ.)`, `YYYY-MM-DD`, serial ของ Google Sheets, สตริงไทย, ค่าว่าง → `null` (timezone Asia/Bangkok)

---

## Testing

```bat
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

## Environment Loading

Backend loads environment variables before validation from:

- `.env` at the repository root
- `backend/.env`
- existing process environment variables, which take priority

Copy `.env.example` to `.env` and fill the Google values. Keep real credentials out of source control.

## Admin Sync Sources

Admin sync endpoints:

```bat
curl.exe -i -X POST http://localhost:6678/api/sync/admin/p-kim
curl.exe -i -X POST http://localhost:6678/api/sync/admin/am
curl.exe -i -X POST http://localhost:6678/api/sync/admin/p-vee
curl.exe -i -X POST http://localhost:6678/api/sync/admin/p-ann
curl.exe -i -X POST http://localhost:6678/api/sync/admin/all
```

Configured sources live in `backend/src/modules/sync/admin-sources.ts`. Each source uses the shared mapper/service path and upserts only rows with its own `source_sheet`; `all` runs sources sequentially and returns per-source results.

Backend: date parser, header mapper, mapper (ไทย/อังกฤษ/ว่าง), calculations (KPI จริง + empty), error mapper, integration (health/status/summary/empty)
Frontend: utils, sheets-api helpers, query builder

---

## ระบบ Sync ต้นทาง → ปลายทาง (ADMIN)

อ่านแท็บ **“พี่คิม”** จากชีตต้นทาง “อัพเดตแอดมิน” → เขียนลงแท็บ **ADMIN** ของชีตปลายทาง “ข้อมูลเว็บรวม Admin&เอกสาร”

Environment (ใน `backend/.env`):

```bash
GOOGLE_SOURCE_SPREADSHEET_ID=...      # ชีตต้นทาง
GOOGLE_TARGET_SPREADSHEET_ID=...      # ชีตปลายทาง
GOOGLE_TARGET_ADMIN_SHEET=ADMIN
GOOGLE_TARGET_DOCUMENTS_SHEET=DOCUMENTS
```

> ต้องแชร์ทั้งชีตต้นทางและปลายทางให้ Service Account (ต้นทาง = Viewer, ปลายทาง = **Editor** เพราะต้องเขียน)

ติดตั้ง dependency (มีอยู่ใน `backend/package.json` แล้ว — `npm.cmd install` ที่ root เพียงพอ; หากต้องการเพิ่มเอง):

```bat
npm.cmd install googleapis @fastify/rate-limit --workspace backend
```

Endpoints ใหม่:

| Method | Endpoint | รายละเอียด |
|--------|----------|-----------|
| GET | `/api/sheets/status` | สถานะ **ต้นทาง + ปลายทาง** (configured, source{...}, target{...}) |
| POST | `/api/sync/admin/p-kim` | sync พี่คิม → ADMIN (rate-limited, กัน sync ซ้อน → 409) |

`GET /api/sheets/status` ตัวอย่าง:

```json
{
  "configured": true,
  "connected": true,
  "source": { "connected": true, "spreadsheetTitle": "อัพเดตแอดมิน", "sheets": ["runnumber","พี่คิม","แอม","..."] },
  "target": { "connected": true, "spreadsheetTitle": "ข้อมูลเว็บรวม Admin&เอกสาร", "sheets": ["ADMIN","DOCUMENTS"] }
}
```

`POST /api/sync/admin/p-kim` ตัวอย่าง:

```json
{
  "success": true, "sourceSheet": "พี่คิม", "targetSheet": "ADMIN",
  "rowsRead": 80, "rowsWritten": 72, "emptyRowsSkipped": 4,
  "repeatedHeadersSkipped": 2, "invalidRowsSkipped": 2, "duplicateRows": 0, "syncedAt": "..."
}
```

**หลักการ sync:** หาแถวหัวตารางแบบ dynamic (ไม่ต้องอยู่แถวแรก) · map ตามชื่อหัวคอลัมน์ (ไม่อิงตำแหน่ง) · ข้ามแถวว่าง/หัวซ้ำ/แถวไม่ถูกต้อง · เติม `ผู้รับผิดชอบ=พี่คิม`, `source_sheet`, `source_row`, `source_record_id`, `synced_at` · เขียนแบบ **upsert by source_sheet** (แทนที่เฉพาะข้อมูลพี่คิม, คงข้อมูล source อื่นไว้, ไม่แตะแท็บอื่น, ไม่ล้างทั้ง spreadsheet)

`source_record_id`: มีรหัสเคส → `พี่คิม::รหัสเคส`; รหัสเคสซ้ำ → `พี่คิม::รหัสเคส::ROW-แถว`; ไม่มีรหัสเคส → `พี่คิม::ROW-แถว`

ทดสอบ:
```bat
curl.exe -i http://localhost:6678/api/sheets/status
curl.exe -i -X POST http://localhost:6678/api/sync/admin/p-kim
```

---

## Troubleshooting

| อาการ | สาเหตุ/วิธีแก้ |
|-------|----------------|
| `GOOGLE_SHEETS_NOT_CONFIGURED` | ยังไม่กรอก email/private key ใน `backend/.env` |
| `GOOGLE_SHEETS_PERMISSION_DENIED` | ยังไม่แชร์ชีตให้ Service Account (Viewer) |
| `GOOGLE_SHEET_TAB_NOT_FOUND` | `GOOGLE_SHEETS_DEFAULT_GID` ไม่ตรงกับ sheet ในไฟล์ |
| Private key error | ต้องครอบด้วย `"..."` และคง `\n` |
| Backend ไม่ขึ้น | ตรวจ port 6678 ว่าถูกใช้อยู่หรือไม่ |

---

## Security Notes

- credential อยู่ที่ backend เท่านั้น (ไม่ส่งไป frontend/response/log)
- CORS จำกัดที่ `FRONTEND_ORIGIN`
- rate limit ที่ `/api/sheets/refresh`
- Zod validate ทุก input, error sanitize (ไม่มี stack trace ใน production)
- แชร์ชีตแบบ **Viewer** (อ่านอย่างเดียว)

---
© 2026 CHAIYADET PROGRESS CO., LTD. · เวอร์ชัน 1.0.0
