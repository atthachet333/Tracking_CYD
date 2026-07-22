/* Query Keys รวมศูนย์ (TanStack Query) */
import type { ListParams } from "@/services/dashboard-api";
import type { SheetRowsParams } from "@/services/sheets-api";
import type { ProblemCasesParams, CustomersParams } from "@/services/customer-dashboard-api";
import type { DocumentsItemsParams } from "@/services/documents-dashboard-api";
import type { UnifiedTasksParams } from "@/services/unified-tasks-api";

export const queryKeys = {
  health: ["health"] as const,
  dashboard: {
    summary: ["dashboard", "summary"] as const,
    trends: ["dashboard", "trends"] as const,
    insights: ["dashboard", "insights"] as const,
  },
  sheets: {
    status: ["sheets", "status"] as const,
    metadata: ["sheets", "metadata"] as const,
    headers: ["sheets", "headers"] as const,
    summary: ["sheets", "summary"] as const,
    rows: (p?: SheetRowsParams) => ["sheets", "rows", p ?? {}] as const,
  },
  customerDashboard: {
    summary: ["customer-dashboard", "summary"] as const,
    distribution: ["customer-dashboard", "status-distribution"] as const,
    actualStatuses: ["customer-dashboard", "actual-statuses"] as const,
    recentCases: ["customer-dashboard", "recent-cases"] as const,
    inProgressCases: ["customer-dashboard", "in-progress-cases"] as const,
    completedCases: ["customer-dashboard", "completed-cases"] as const,
    trends: ["customer-dashboard", "trends"] as const,
    problemCases: (p?: ProblemCasesParams) => ["customer-dashboard", "problem-cases", p ?? {}] as const,
    customers: (p?: CustomersParams) => ["customer-dashboard", "customers", p ?? {}] as const,
  },
  adminDashboard: {
    summary: ["admin-dashboard", "summary"] as const,
    distribution: ["admin-dashboard", "status-distribution"] as const,
    assignees: ["admin-dashboard", "assignees"] as const,
    companies: ["admin-dashboard", "companies"] as const,
    recentItems: ["admin-dashboard", "recent-items"] as const,
    trends: ["admin-dashboard", "trends"] as const,
  },
  documentsDashboard: {
    summary: ["documents-dashboard", "summary"] as const,
    distribution: ["documents-dashboard", "status-distribution"] as const,
    payment: ["documents-dashboard", "payment-distribution"] as const,
    assignees: ["documents-dashboard", "assignees"] as const,
    companies: ["documents-dashboard", "companies"] as const,
    recentItems: ["documents-dashboard", "recent-items"] as const,
    trends: ["documents-dashboard", "trends"] as const,
    headers: ["documents-dashboard", "headers"] as const,
    items: (p?: DocumentsItemsParams) => ["documents-dashboard", "items", p ?? {}] as const,
  },
  unifiedTasks: (p?: UnifiedTasksParams) => ["tasks", "unified", p ?? {}] as const,
  employees: (p?: ListParams) => ["employees", p ?? {}] as const,
  orgChart: ["employees", "org-chart"] as const,
  tasks: (p?: ListParams) => ["tasks", p ?? {}] as const,
  documents: (p?: ListParams) => ["documents", p ?? {}] as const,
  approvals: ["approvals"] as const,
  customers: (p?: ListParams) => ["customers", p ?? {}] as const,
  reports: ["reports"] as const,
  notifications: ["notifications"] as const,
};
