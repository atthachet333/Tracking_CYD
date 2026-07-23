/* ============================================================
   @tracking-cyd/shared · Types
   Type definitions ที่ใช้ร่วมกันระหว่าง Frontend และ Backend
   ============================================================ */

export type LoadLevel = "high" | "mid" | "low";
export type TaskStatus = "wait" | "prog" | "near" | "over" | "done";
export type DocStatus = "wait" | "back" | "done";
export type CustomerTier = "Platinum" | "Gold" | "Silver";
export type InsightType = "warn" | "danger" | "success" | "info";

export interface Employee {
  id: number;
  name: string;
  role: string;
  dept: string;
  load: LoadLevel;
  active: number;
  done: number;
  sla: number;
  online: boolean;
  img: number;
  perf: number;
  email: string;
  phone: string;
  trend: number[];
  leaveLeft: number;
  joinYear: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  count: number;
  sla: number;
  color: string;
}

export interface OrgNode {
  id: number;
  name: string;
  role: string;
  active: number;
  img: number;
  reportsTo: number | null;
}

export interface Task {
  id: string;
  title: string;
  customer: string;
  owner: string;
  ownerImg: number;
  status: TaskStatus;
  statusText: string;
  due: string;
  progress: number;
  priority: LoadLevel;
  sla: number;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: string;
  owner: string;
  img: number;
  status: DocStatus;
  statusText: string;
  date: string;
  checklist: number;
  checkDone: number;
}

export interface Approval extends DocumentItem {
  stage: string;
}

export interface Customer {
  id: number;
  name: string;
  type: string;
  tier: CustomerTier;
  cases: number;
  docs: number;
  pending: number;
  sla: number;
  value: number;
  contact: string;
}

export interface ServiceType {
  name: string;
  count: number;
  pct: number;
  color: string;
}

export interface NotificationItem {
  id: number;
  icon: string;
  color: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export interface Insight {
  type: InsightType;
  icon: string;
  title: string;
  desc: string;
}

export interface DashboardSummary {
  totalEmployees: number;
  onlineToday: number;
  highLoad: number;
  onLeave: number;
  avgPerf: number;
  teamSla: number;
  inProgress: number;
  docsClosed: number;
  totalTasks: number;
  doneTasks: number;
  totalCustomers: number;
  serviceValue: number;
  loadDistribution: { high: number; mid: number; low: number };
  weeklyAttendance: { day: string; value: number }[];
  training: { total: number; done: number };
  capacity: number;
  burnoutRisk: number;
  workloadForecast: number;
  topPerformers: { id: number; name: string; role: string; img: number; perf: number }[];
}

export interface TrendPoint {
  month: string;
  done: number;
  sla: number;
}

export interface ReportData {
  departments: Department[];
  services: ServiceType[];
  topCustomers: Customer[];
  monthly: TrendPoint[];
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

/* ============================================================
   Google Sheets Integration · shared contracts
   ============================================================ */

/** ฟิลด์มาตรฐานของหนึ่งเคส หลังผ่าน header mapping จาก Google Sheet */
export interface CaseRow {
  caseNo: string;
  customerName: string;
  status: string;
  derivedStatus: TaskStatus;
  assignee: string;
  department: string;
  serviceType: string;
  documentType: string;
  dueDate: string | null;
  createdDate: string | null;
  closedDate: string | null;
  progress: number;
  sla: string;
  amount: number;
  raw: Record<string, string>;
}

export interface SheetTabMeta {
  sheetId: number;
  title: string;
  rowCount: number;
  columnCount: number;
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: SheetTabMeta[];
}

/** สถานะการเชื่อมต่อฝั่งเดียว (ต้นทาง/ปลายทาง) */
export interface SheetSideStatus {
  connected: boolean;
  spreadsheetId: string | null;
  spreadsheetTitle: string | null;
  sheets: string[];
}

export interface SheetStatus {
  configured: boolean;
  connected: boolean;
  spreadsheetId: string | null;
  sheetId: number | null;
  sheetTitle: string | null;
  lastSyncAt: string | null;
  rowCount: number;
  cacheHit?: boolean;
  /** true = กำลังเสิร์ฟข้อมูลสำรอง (last-known-good) ระหว่าง Google API มีปัญหา/หมดอายุ */
  stale?: boolean;
  warnings: string[];
  // สำหรับระบบ sync (ต้นทาง/ปลายทาง)
  source?: SheetSideStatus;
  target?: SheetSideStatus;
}

/** ผลลัพธ์การ sync แท็บหนึ่งเข้า ADMIN */
export interface SyncResult {
  success: true;
  slug?: string;
  sourceSheet: string;
  targetSheet: string;
  rowsRead: number;
  rowsWritten: number;
  emptyRowsSkipped: number;
  repeatedHeadersSkipped: number;
  invalidRowsSkipped: number;
  duplicateRows: number;
  syncedAt: string;
}

export interface SyncSourceFailure {
  success: false;
  slug: string;
  sourceSheet: string;
  error: {
    code: string;
    message: string;
  };
}

export interface SyncAllResult {
  success: boolean;
  targetSheet: string;
  syncedAt: string;
  results: Array<SyncResult | SyncSourceFailure>;
}

/** หนึ่งบรรทัดของตารางสรุป (per กลุ่ม เช่น ผู้รับผิดชอบ / สถานะลูกค้า) */
export interface SummaryMetric {
  key: string;
  label: string;
  count: number;
}

/** สถานะการดึงสรุปของแต่ละ source (แท็บใน Sheet 2) */
export interface SummarySource {
  slug: string;
  sourceSheet: string;
  ok: boolean;
  rowsRead: number;
  error?: string;
}

/** สรุปยอดที่คำนวณจาก Sheet 2 (ต้นทาง) เพื่อแสดง/บันทึกร่วมกับ Sheet 1 */
export interface SheetSummary {
  generatedAt: string;
  totalCases: number;
  depositCount: number;
  quotedCount: number;
  contractCount: number;
  byAssignee: SummaryMetric[];
  byCustomerStatus: SummaryMetric[];
  sources: SummarySource[];
  /** true เมื่อเขียนตารางสรุปลงแท็บ SUMMARY ของ Sheet 1 แล้ว */
  written?: boolean;
  targetSheet?: string;
}

export interface MappingWarning {
  field: string;
  message: string;
}

export interface SheetHeadersResult {
  headers: string[];
  mapping: Record<string, string | null>;
  unmapped: string[];
  warnings: MappingWarning[];
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SheetRowsResult {
  data: CaseRow[];
  pagination: Pagination;
  meta: {
    source: string;
    sheetTitle: string | null;
    lastSyncAt: string | null;
    warnings: MappingWarning[];
  };
}

/* ============================================================
   Customer Dashboard · ภาพรวมลูกค้าและสถานะเคส (จาก Google Sheet ต้นทาง)
   ============================================================ */

/** กลุ่มสถานะลูกค้าที่จัดหมวดแล้ว */
export type CustomerStatusGroup = "in_progress" | "completed" | "issues" | "unclassified";

/** meta ประกอบทุก endpoint ของ customer-dashboard (ไม่มี credential) */
export interface CustomerDashboardMeta {
  source: "google-sheets";
  spreadsheetId: string | null; // masked บางส่วน
  sheetId: number;              // gid ต้นทางที่ตั้งค่าไว้ (traceability)
  sheetTitle: string | null;    // ชื่อแท็บของ gid นั้น
  statusHeader: string;         // header ที่ใช้จำแนก ("สถานะลูกค้า")
  tabsAggregated: string[];     // แท็บที่นำมารวมจริง
  rowsRead: number;
  lastUpdatedAt: string | null;
  cacheHit?: boolean;
  warnings: string[];
}

export interface CustomerDashboardSummary {
  totalCustomers: number;   // จำนวน record (business key) ไม่ซ้ำ
  uniqueCompanies: number;  // จำนวนบริษัทไม่ซ้ำ (normalized)
  uniqueCases: number;      // จำนวนรหัสเคสไม่ซ้ำ
  inProgress: number;
  completed: number;
  issues: number;
  unclassified: number;
  completionRate: number;   // %
  issueRate: number;        // %
  inProgressRate: number;   // %
}

/** สัดส่วนตามกลุ่ม (Donut) */
export interface CustomerStatusDistributionItem {
  key: CustomerStatusGroup;
  label: string;
  count: number;
  percentage: number;
}

/** จำนวนตามค่าสถานะจริงในชีต (Bar chart) */
export interface CustomerActualStatusItem {
  status: string; // ค่าดิบ เช่น "ลูกค้าปฏิเสธ"
  count: number;
  group: CustomerStatusGroup;
}

/** หนึ่งเคส/ลูกค้า — คอลัมน์ครบตามชีตต้นทาง (map จาก header จริง) */
export interface CustomerCaseItem {
  date: string | null;
  caseNo: string;
  company: string;
  assignee: string;
  initialDetail: string;   // คุยรายละเอียดเบื้องต้น
  quotation: string;       // ทำใบเสนอราคา
  quotationLink: string;   // ลิงก์ใบเสนอราคา
  followUp1: string;       // ติดตามผลครั้งที่ 1
  followUp2: string;       // ติดตามผลครั้งที่ 2
  followUp3: string;       // ติดตามผลครั้งที่ 3
  customerStatus: string;  // ค่าดิบจาก "สถานะลูกค้า"
  statusGroup: CustomerStatusGroup;
  deposit: string;         // มัดจำ (ส่งขาด)
  contractDraft: string;   // ร่างสัญญา
  contractLink: string;    // ลิงก์สัญญา
  latestFollowUp: string;  // ติดตามล่าสุด (derived)
  sourceSheet: string;
  sourceRow: number;
}

export interface CustomerTrendPoint {
  period: string; // YYYY-MM
  total: number;
  completed: number;
  issues: number;
}

export interface CustomerInsight {
  type: InsightType;
  title: string;
  desc: string;
}

/* Response envelopes */
export interface CustomerSummaryResponse {
  data: CustomerDashboardSummary;
  insights: CustomerInsight[];
  meta: CustomerDashboardMeta;
}
export interface CustomerStatusDistributionResponse {
  data: CustomerStatusDistributionItem[];
  actual: CustomerActualStatusItem[];
  meta: CustomerDashboardMeta;
}
export interface CustomerRecentCasesResponse {
  data: CustomerCaseItem[];
  meta: CustomerDashboardMeta;
}
/** ใช้ร่วมกันโดย recent / in-progress / completed (list เต็มของกลุ่ม) */
export type CustomerCasesResponse = CustomerRecentCasesResponse;
export interface CustomerActualStatusesResponse {
  data: CustomerActualStatusItem[];
  meta: CustomerDashboardMeta;
}
export interface CustomerProblemCasesResponse {
  data: CustomerCaseItem[];
  pagination: Pagination;
  meta: CustomerDashboardMeta;
}
/** ตารางลูกค้าทั้งหมด (paginated + filters) */
export interface CustomerListResponse {
  data: CustomerCaseItem[];
  pagination: Pagination;
  meta: CustomerDashboardMeta;
}
export interface CustomerTrendsResponse {
  data: CustomerTrendPoint[];
  meta: CustomerDashboardMeta;
}

/* ============================================================
   Admin Dashboard · ภาพรวมแอดมิน (แท็บ ADMIN) — reuse Customer shapes
   ============================================================ */
export interface AdminAssigneesResponse {
  data: DocumentsAssigneeStat[];
  meta: CustomerDashboardMeta;
}
export interface AdminCompaniesResponse {
  data: DocumentsCompanyStat[];
  meta: CustomerDashboardMeta;
}

/* ============================================================
   Documents Dashboard · ภาพรวมแผนกเอกสาร (แท็บ DOCUMENTS)
   ============================================================ */

export type WorkloadLevel = "idle" | "normal" | "moderate" | "high" | "critical";
export type PaymentGroup = "paid" | "pending" | "partial" | "problem" | "unclassified";

/** หนึ่งงานเอกสาร (map จาก header จริงในแท็บ DOCUMENTS — 7 คอลัมน์ธุรกิจ) */
export interface DocumentTaskItem {
  workDate: string | null;
  caseNo: string;
  company: string;
  assignee: string;
  detail: string;           // รายละเอียดเบื้องต้น
  paymentStatus: string;    // ค่าดิบ "สถานะการชำระ"
  paymentGroup: PaymentGroup;
  caseStatus: string;       // ค่าดิบ "สถานะเคส"
  actualStatus: string;     // = caseStatus (คงไว้เพื่อ compatibility)
  statusGroup: CustomerStatusGroup;
  latestFollowUp: string;
  quotationLink: string;
  contractLink: string;
  sourceSheet: string;
  sourceRow: number;
}

export interface DocumentsDashboardMeta {
  source: "google-sheets";
  spreadsheetId: string | null;
  sheetId: number;
  sheetTitle: string | null;
  statusHeader: string | null; // header ที่ใช้จำแนก (อาจ fallback)
  headers: string[];           // header จริงทั้งหมด
  rowsRead: number;
  lastUpdatedAt: string | null;
  cacheHit?: boolean;
  warnings: string[];
}

export interface DocumentsSummary {
  totalItems: number;
  inProgress: number;
  completed: number;
  issues: number;
  unclassified: number;
  uniqueCompanies: number;
  totalEmployees: number;
  completionRate: number;
  issueRate: number;
  pendingPayment: number;  // รอชำระ
  paidPayment: number;     // ชำระเรียบร้อย
}

/** สัดส่วนสถานะการชำระ */
export interface PaymentDistributionItem {
  key: PaymentGroup;
  label: string;
  count: number;
  percentage: number;
}

export interface DocumentsAssigneeStat {
  assignee: string;
  total: number;
  inProgress: number;
  completed: number;
  issues: number;
  unclassified: number;
  pendingPayment: number;
  companies: number;
  latestDate: string | null;
  workloadLevel: WorkloadLevel;
}

export interface DocumentsCompanyStat {
  company: string;
  total: number;
  assignees: string[];
  latestStatus: string;
  latestPayment: string;
  latestDetail: string;
  latestDate: string | null;
}

export interface DocumentsSummaryResponse {
  data: DocumentsSummary;
  insights: CustomerInsight[];
  meta: DocumentsDashboardMeta;
}
export interface DocumentsStatusDistributionResponse {
  data: CustomerStatusDistributionItem[];
  actual: CustomerActualStatusItem[];
  meta: DocumentsDashboardMeta;
}
export interface DocumentsPaymentDistributionResponse {
  data: PaymentDistributionItem[];
  actual: CustomerActualStatusItem[]; // ค่าชำระดิบ (group=… ไม่ใช้ แต่ count ใช้)
  meta: DocumentsDashboardMeta;
}
export interface DocumentsAssigneesResponse {
  data: DocumentsAssigneeStat[];
  meta: DocumentsDashboardMeta;
}
export interface DocumentsCompaniesResponse {
  data: DocumentsCompanyStat[];
  meta: DocumentsDashboardMeta;
}
export interface DocumentsItemsResponse {
  data: DocumentTaskItem[];
  pagination: Pagination;
  meta: DocumentsDashboardMeta;
}
export interface DocumentsRecentResponse {
  data: DocumentTaskItem[];
  meta: DocumentsDashboardMeta;
}
export interface DocumentsTrendsResponse {
  data: CustomerTrendPoint[];
  meta: DocumentsDashboardMeta;
}
export interface DocumentsHeadersResponse {
  headers: string[];
  mapping: Record<string, string | null>;
  unmapped: string[];
  preview: string[][];
  meta: DocumentsDashboardMeta;
}

/* ============================================================
   Unified Tasks · งานทั้งหมด (Admin + Documents)
   ============================================================ */

export type TaskDepartment = "admin" | "documents";

export interface UnifiedTaskLink {
  label: string;
  url: string;
}

export interface UnifiedTask {
  id: string;
  department: TaskDepartment;
  departmentLabel: string; // "แอดมิน" | "เอกสาร"
  workDate: string | null;
  caseNo: string;
  companyName: string;
  assignee: string;
  detail: string;
  quotationStatus: string | null;
  paymentStatus: string | null;
  followUp1: string | null;
  followUp2: string | null;
  followUp3: string | null;
  customerStatus: string | null;
  actualStatus: string;
  statusGroup: CustomerStatusGroup;
  latestFollowUp: string;
  links: UnifiedTaskLink[];
  sourceSheet: string;
  sourceRow: number;
}

export interface UnifiedTasksResponse {
  data: UnifiedTask[];
  pagination: Pagination;
  summary: { all: number; admin: number; documents: number };
  meta: {
    warnings: string[];
    columnLabels: Record<string, string>;
    departments: { key: TaskDepartment; label: string }[];
  };
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: unknown[];
    requestId: string;
  };
}

export interface HealthResponse {
  status: "ok";
  service: string;
  timestamp: string;
  dependencies: {
    googleSheets: {
      configured: boolean;
      connected: boolean;
    };
  };
}
