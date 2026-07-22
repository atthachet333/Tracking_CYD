// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import type { CustomerDashboardSummary } from "@/types/customer-dashboard";
import { ExecutiveKpiCards } from "./ExecutiveKpiCards";

const summary: CustomerDashboardSummary = {
  totalCustomers: 56, uniqueCompanies: 52, uniqueCases: 52,
  inProgress: 20, completed: 6, issues: 25, unclassified: 5,
  completionRate: 10.71, issueRate: 44.64, inProgressRate: 35.71,
};

afterEach(cleanup);

describe("ExecutiveKpiCards", () => {
  it("Loading → skeleton, ยังไม่มีตัวเลข", () => {
    const { container } = render(<ExecutiveKpiCards summary={undefined} isLoading isError={false} onRetry={() => {}} active={null} onSelect={() => {}} />);
    expect(container.querySelector(".shimmer")).not.toBeNull();
  });

  it("Error → ปุ่มลองใหม่ เรียก onRetry", () => {
    const onRetry = vi.fn();
    render(<ExecutiveKpiCards summary={undefined} isLoading={false} isError onRetry={onRetry} active={null} onSelect={() => {}} />);
    fireEvent.click(screen.getByText("ลองใหม่"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("แสดง KPI 4 ใบ ตามลำดับที่กำหนด", () => {
    render(<ExecutiveKpiCards summary={summary} isLoading={false} isError={false} onRetry={() => {}} active="all" onSelect={() => {}} />);
    const labels = Array.from(document.querySelectorAll("button[title]"))
      .map((b) => b.getAttribute("title") ?? "")
      .filter((t) => t.includes("—"));
    expect(labels[0]).toContain("ลูกค้าทั้งหมด — 56");
    expect(labels[1]).toContain("ปิดเคสสำเร็จ — 6");
    expect(labels[2]).toContain("ปัญหาที่พบเจอ — 25");
    expect(labels[3]).toContain("กำลังดำเนินการ — 20");
  });

  it("แสดง rate จริงจาก API + บริษัท/เคสไม่ซ้ำ", () => {
    render(<ExecutiveKpiCards summary={summary} isLoading={false} isError={false} onRetry={() => {}} active="all" onSelect={() => {}} />);
    expect(screen.getByText("Completion Rate 10.71%")).not.toBeNull();
    expect(screen.getByText("Issue Rate 44.64%")).not.toBeNull();
    expect(screen.getByText(/บริษัทไม่ซ้ำ 52 · เคสไม่ซ้ำ 52/)).not.toBeNull();
  });

  it("Drill-down → เรียก onSelect ด้วยกลุ่มถูกต้อง", () => {
    const onSelect = vi.fn();
    render(<ExecutiveKpiCards summary={summary} isLoading={false} isError={false} onRetry={() => {}} active="all" onSelect={onSelect} />);
    fireEvent.click(screen.getByText("ปัญหาที่พบเจอ"));
    expect(onSelect).toHaveBeenCalledWith("issues");
    fireEvent.click(screen.getByText("ปิดเคสสำเร็จ"));
    expect(onSelect).toHaveBeenCalledWith("completed");
  });
});
