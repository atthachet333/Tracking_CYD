/* ============================================================
   Entity Application Services
   คำนวณ employees / tasks / customers / reports จาก cases จริง
   เอกสาร/อนุมัติ/แจ้งเตือน: ยังไม่มีแหล่งข้อมูล → คืน [] (empty state)
   ============================================================ */
import type {
  Employee, Task, DocumentItem, Customer, NotificationItem, ReportData, OrgNode, Paginated, ListQuery,
} from "@tracking-cyd/shared";
import { googleSheetsService } from "../integrations/google-sheets/google-sheets.service";
import {
  calculateWorkloadByEmployee, calculateCustomers, casesToTasks,
  calculateDepartmentPerformance, calculateServiceDistribution, calculateMonthlyTrends,
} from "./calculations";

function paginate<T>(items: T[], page: number, pageSize: number): Paginated<T> {
  const start = (page - 1) * pageSize;
  return { data: items.slice(start, start + pageSize), total: items.length, page, pageSize };
}

export const employeeService = {
  async list(q: ListQuery): Promise<Paginated<Employee>> {
    const cases = await googleSheetsService.getAllCases();
    let items = calculateWorkloadByEmployee(cases);
    if (q.q) {
      const s = q.q.toLowerCase();
      items = items.filter((e) => e.name.toLowerCase().includes(s) || e.role.toLowerCase().includes(s));
    }
    if (q.status && q.status !== "all") items = items.filter((e) => e.load === q.status);
    return paginate(items, q.page, q.pageSize);
  },
  async getById(id: number): Promise<Employee | undefined> {
    const cases = await googleSheetsService.getAllCases();
    return calculateWorkloadByEmployee(cases).find((e) => e.id === id);
  },
  /** ไม่มีข้อมูลลำดับชั้นใน sheet → ไม่สร้างคนสมมุติ */
  async orgChart(): Promise<OrgNode[]> {
    return [];
  },
};

export const taskService = {
  async list(q: ListQuery): Promise<Paginated<Task>> {
    const cases = await googleSheetsService.getAllCases();
    let items = casesToTasks(cases);
    if (q.q) {
      const s = q.q.toLowerCase();
      items = items.filter((t) => t.title.toLowerCase().includes(s) || t.id.toLowerCase().includes(s) || t.customer.toLowerCase().includes(s));
    }
    if (q.status && q.status !== "all") items = items.filter((t) => t.status === q.status);
    return paginate(items, q.page, q.pageSize);
  },
};

export const documentService = {
  async list(q: ListQuery): Promise<Paginated<DocumentItem>> {
    return paginate<DocumentItem>([], q.page, q.pageSize);
  },
  async approvals(): Promise<DocumentItem[]> {
    return [];
  },
};

export const customerService = {
  async list(q: ListQuery): Promise<Paginated<Customer>> {
    const cases = await googleSheetsService.getAllCases();
    let items = calculateCustomers(cases);
    if (q.q) {
      const s = q.q.toLowerCase();
      items = items.filter((c) => c.name.toLowerCase().includes(s));
    }
    return paginate(items, q.page, q.pageSize);
  },
};

export const notificationService = {
  async list(): Promise<NotificationItem[]> {
    return [];
  },
};

export const reportService = {
  async get(): Promise<ReportData> {
    const cases = await googleSheetsService.getAllCases();
    return {
      departments: calculateDepartmentPerformance(cases),
      services: calculateServiceDistribution(cases),
      topCustomers: [...calculateCustomers(cases)].sort((a, b) => b.value - a.value).slice(0, 5),
      monthly: calculateMonthlyTrends(cases),
    };
  },
};
