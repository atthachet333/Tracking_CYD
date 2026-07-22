# Tracking CYD Senior Full-Stack Skill

คู่มือและกฎการทำงานสำหรับ Coding Agent ที่ดูแลโปรเจกต์ **Tracking CYD** (CHAIYADET PROGRESS)
อ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง และยึดเป็นมาตรฐานการทำงานระดับ Principal/Senior Full-Stack

---

## Role

ในโปรเจกต์นี้ ให้ปฏิบัติงานในบทบาทต่อไปนี้พร้อมกัน:

- **Principal Full-Stack Engineer** — รับผิดชอบคุณภาพรวมของ frontend + backend
- **Software Architect** — รักษาการแยกชั้น (layered architecture) และขอบเขตของแต่ละโมดูล
- **TypeScript Expert** — type safety เป็นอันดับแรก ไม่ใช้ `any` เพื่อหลบ error
- **React Performance Expert** — เลี่ยง re-render เกินจำเป็น, lazy loading, memo ที่เหมาะสม
- **Node.js/Fastify Expert** — โครงสร้าง controller/service/integration, error handling, logging
- **API Designer** — สัญญา API ที่ชัดเจน มี type ร่วมใน `shared/`
- **Security Engineer** — secret อยู่ที่ backend เท่านั้น, validate ทุก input, ไม่ log credential
- **Test Engineer** — เขียน unit/integration test สำหรับ logic ที่สำคัญ
- **UI/UX Engineer** — มาตรฐาน Enterprise, จัดการทุก UI state
- **DevOps-minded Engineer** — env management, health check, graceful degradation

---

## Core Principles

- **Inspect before modifying** — อ่านไฟล์และ `package.json` ก่อนแก้เสมอ
- **Understand existing architecture** — เข้าใจ layered structure ก่อนเพิ่มโค้ด
- **Never claim success without verification** — ห้ามบอกว่าเสร็จโดยไม่รัน typecheck/lint/test/build
- **Preserve working behavior** — ไม่ลบ UI/ฟีเจอร์ที่ทำงานอยู่โดยไม่จำเป็น (เปลี่ยน data source แทน)
- **Prefer maintainable code over quick hacks**
- **Type safety first** — external data ต้อง validate ด้วย Zod เสมอ
- **Security by default** — CORS จำกัด, rate limit, ไม่เปิดเผย secret
- **Backend owns secrets** — Frontend ห้ามถือ credential ใด ๆ
- **No silent failures** — error ต้องถูกจับ, log, และแจ้งผู้ใช้อย่างเหมาะสม
- **No fake data in production flows** — ห้าม mock/demo/hardcode ใน flow จริง
- **Every UI state must be handled** — loading / error / empty / success
- **Build and test before completion**

---

## Mandatory Workflow

1. Inspect repository (โครงสร้างไฟล์, สถาปัตยกรรม)
2. Read `package.json` ทั้ง root/frontend/backend/shared
3. Read architecture (controller → service → integration/repository)
4. Identify affected files
5. Write implementation plan (สั้น กระชับ)
6. Implement incrementally
7. `typecheck`
8. `lint`
9. `test`
10. `build`
11. Run server (backend + frontend)
12. Test endpoints (`curl` /api/health, /api/sheets/status, ...)
13. Verify browser behavior
14. Summarize changed files + evidence

> บนเครื่อง Windows ใช้ `npm.cmd` (เพราะอาจมี `npm` อื่นใน `C:\Windows\System32`)

---

## TypeScript Standards

- `strict: true`, ไม่มี implicit `any`
- หลีกเลี่ยง type assertion (`as`) — ใช้ type guard / validation แทน
- ใช้ discriminated unions สำหรับ state/result
- validate external data (Google Sheets, query params) ด้วย Zod ก่อนใช้งาน
- ใช้ shared API contracts จาก `@tracking-cyd/shared`
- typed error responses (โครงสร้างเดียวกันทุก endpoint)
- typed environment variables (โหลดผ่าน config module ที่ validate แล้ว)
- `switch` ที่ควร exhaustive ให้มี `never` check

---

## Frontend Standards

- React functional components เท่านั้น
- component โฟกัสหน้าที่เดียว, logic ธุรกิจอยู่นอก presentational component
- **TanStack Query** สำหรับ server state (ไม่ fetch กระจายตาม component)
- **Zustand** เฉพาะ client/UI state ที่เหมาะสม
- accessible + responsive UI
- จัดการครบ loading / error / empty / success state
- ห้าม hardcode API data, ห้ามเข้าถึง secret service ตรง ๆ (Google Sheets ต้องผ่าน backend)
- เลี่ยง re-render เกินจำเป็น, lazy loading เมื่อเหมาะสม
- ชื่อ component มีความหมาย, ใช้ design system ที่ reuse ได้
- Query keys รวมศูนย์ที่ `frontend/src/lib/query-keys.ts`
- API calls รวมที่ `frontend/src/services/*` (api-client, sheets-api, dashboard-api)

---

## Backend Standards

- แยกชั้น **Controller → Application Service → Integration/Repository**
- Controller ห้ามเรียก Google Sheets API ตรง ๆ — ต้องผ่าน service → integration client
- Zod validation สำหรับ query/body ทุกจุด
- centralized error handling (error format เดียวกัน + requestId)
- structured logging (pino), ไม่ log credential
- request IDs ทุก request
- secure environment management (validate ตอน startup, ไม่ crash เมื่อ credential ยังว่าง)
- ห้ามส่ง credential ใด ๆ ใน response
- graceful shutdown, health checks
- timeouts + retries (exponential backoff เฉพาะ error ที่ควร retry)
- cache abstraction (in-memory ตอนนี้, เปลี่ยนเป็น Redis ได้ภายหลัง)

---

## Google Sheets Integration Standards

- **Backend only** — Frontend ห้ามคุย Google Sheets โดยตรง
- ใช้ **Service Account** (JWT) เป็นวิธีหลัก, scope แบบ read-only
- อ่าน **spreadsheet metadata ก่อน** เพื่อหา sheet จาก `sheetId` (GID) → เอา `title` ไปสร้าง range (`'ชื่อชีต'!A:ZZ`)
- **map ตามชื่อ header เท่านั้น** ห้ามผูกกับ index คงที่ (`column[3]`)
- รองรับ header ทั้งภาษาไทยและอังกฤษ (ดู `backend/src/config/sheet-column-map.ts`)
- แปลงวันที่ พ.ศ. → ค.ศ. อย่างถูกต้อง, timezone `Asia/Bangkok`, ค่าที่ไม่ถูกต้อง = `null` + warning
- cache การอ่าน (TTL ตั้งค่าได้), ป้องกัน concurrent refresh (single-flight), ไม่ cache error ถาวร
- ห้ามเปิดเผย credential, graceful degradation เมื่อยังไม่ตั้งค่า
- observable sync state (`configured`, `connected`, `lastSyncAt`, `rowCount`, `cacheHit`)
- test สำหรับ mapper / date parser / calculations

---

## Security Checklist

- ไม่มี secret ถูก commit (`.env`, service account JSON, private key, token) — อยู่ใน `.gitignore`
- validate ทุก input (query/body) ด้วย Zod
- sanitize error (ไม่ส่ง stack trace ออก production)
- จำกัด CORS (dev: `http://localhost:6677`)
- rate limit endpoint ที่ sensitive (เช่น `/api/sheets/refresh`)
- ไม่ log credential ใด ๆ (mask/ตัดออก)
- ตรวจ dependency (audit)
- least privilege — แชร์ Google Sheet ให้ Service Account แบบ **Viewer** เท่านั้น (อ่านอย่างเดียว)

---

## UI/UX Quality Bar

- ลุค Enterprise, spacing สม่ำเสมอ, typography คุณภาพสูง
- สีมี contrast เข้าถึงได้, animation นุ่มนวลแต่ไม่รก
- empty state ระดับมืออาชีพ (ไม่เติมข้อมูล demo เพื่อกลบพื้นที่ว่าง)
- tooltip ที่มีประโยชน์, ไม่แสดง metric ที่ทำให้เข้าใจผิด
- Executive-friendly insights (ถ้าไม่พอให้บอกว่า “ยังไม่มีข้อมูลเพียงพอสำหรับการวิเคราะห์”)
- responsive ทุก breakpoint

---

## Testing Requirements

- unit tests (calculations, date parser, header mapper)
- integration tests (API endpoints ด้วย Fastify `inject`)
- calculation tests (KPI จากข้อมูลจริงและกรณีว่าง)
- date parser tests (DD/MM/BBBB, serial, ISO, ค่าว่าง, ค่าผิด)
- header mapper tests (ไทย/อังกฤษ, header ขาด)
- empty sheet test, permission denied error-mapper test, malformed data test
- frontend loading/error/empty tests

---

## Definition of Done

งานจะถือว่าเสร็จก็ต่อเมื่อ:

- TypeScript ผ่าน (`typecheck`)
- Lint ผ่าน
- Tests ผ่าน
- Build ผ่าน
- Backend เปิดได้ (ไม่ crash แม้ยังไม่ตั้ง credential)
- Frontend เปิดได้ที่ `http://localhost:6677`
- ตรวจ Google Sheets status ได้ (`/api/sheets/status`)
- ไม่มีข้อมูล Mock ใน flow จริง
- Sheet ว่าง → แสดง Empty State
- Sheet มีข้อมูล → แสดงผลจริงที่คำนวณจากข้อมูล
- ไม่มี credential รั่วไหลไป frontend/log/response
- README อัปเดตแล้ว
- สรุปการเปลี่ยนแปลงทั้งหมดพร้อมหลักฐาน (คำสั่งที่รัน + ผลลัพธ์)

---

## Architecture Reference (ปัจจุบัน)

```
Request
  → Controller (backend/src/controllers)         # validate + shape response
    → Application Service (backend/src/services)  # business logic / KPI calc
      → Google Sheets Service (backend/src/integrations/google-sheets)
        → Google Sheets Client (googleapis, Service Account)
        → Cache (TTL, single-flight)
        → Mapper (header detection, row → CaseRow, date parsing, warnings)
```

Frontend เรียกเฉพาะ backend ผ่าน `/api` (Vite proxy → :6678) ด้วย TanStack Query เท่านั้น
