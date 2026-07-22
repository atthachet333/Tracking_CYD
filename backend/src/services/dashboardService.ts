/* ============================================================
   Dashboard Application Service
   ดึง cases จาก Google Sheets → คำนวณด้วย calculations (ไม่มี mock)
   ============================================================ */
import type { DashboardSummary, TrendPoint, Insight } from "@tracking-cyd/shared";
import { googleSheetsService } from "../integrations/google-sheets/google-sheets.service";
import { calculateDashboardSummary, calculateMonthlyTrends, calculateInsights } from "./calculations";

export const dashboardService = {
  async getSummary(): Promise<DashboardSummary> {
    const cases = await googleSheetsService.getAllCases();
    return calculateDashboardSummary(cases);
  },
  async getTrends(): Promise<TrendPoint[]> {
    const cases = await googleSheetsService.getAllCases();
    return calculateMonthlyTrends(cases);
  },
  async getInsights(): Promise<Insight[]> {
    const cases = await googleSheetsService.getAllCases();
    return calculateInsights(cases);
  },
};
