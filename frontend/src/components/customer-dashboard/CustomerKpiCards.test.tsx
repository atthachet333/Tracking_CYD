// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import type { CustomerDashboardSummary } from "@/types/customer-dashboard";
import { CustomerKpiCards } from "./CustomerKpiCards";

const summary: CustomerDashboardSummary = {
  totalCustomers: 56,
  uniqueCompanies: 52,
  uniqueCases: 52,
  inProgress: 20,
  completed: 6,
  issues: 25,
  unclassified: 5,
  completionRate: 10.71,
  issueRate: 44.64,
  inProgressRate: 35.71,
};

afterEach(cleanup);

describe("CustomerKpiCards", () => {
  it("Loading → แสดง skeleton (ยังไม่มีตัวเลข)", () => {
    const { container } = render(
      <CustomerKpiCards summary={undefined} isLoading isError={false} onRetry={() => {}} active={null} onSelect={() => {}} />,
    );
    expect(container.querySelector(".shimmer")).not.toBeNull();
    expect(screen.queryByText("ลูกค้าทั้งหมด")).toBeNull();
  });

  it("Error → แสดงปุ่มลองใหม่ และเรียก onRetry", () => {
    const onRetry = vi.fn();
    render(<CustomerKpiCards summary={undefined} isLoading={false} isError onRetry={onRetry} active={null} onSelect={() => {}} />);
    const btn = screen.getByText("ลองใหม่");
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("Success → แสดง KPI จากข้อมูล (label + rate)", () => {
    render(<CustomerKpiCards summary={summary} isLoading={false} isError={false} onRetry={() => {}} active={null} onSelect={() => {}} />);
    expect(screen.getByText("ลูกค้าทั้งหมด")).not.toBeNull();
    expect(screen.getByText("เคสที่มีปัญหา")).not.toBeNull();
    expect(screen.getByText(/44.64%/)).not.toBeNull(); // issueRate จาก API
    expect(screen.getByText(/อัตราปิดสำเร็จ 10.71%/)).not.toBeNull();
  });

  it("Drill-down → คลิก KPI เรียก onSelect ด้วยกลุ่มที่ถูกต้อง", () => {
    const onSelect = vi.fn();
    render(<CustomerKpiCards summary={summary} isLoading={false} isError={false} onRetry={() => {}} active={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText("เคสที่มีปัญหา"));
    expect(onSelect).toHaveBeenCalledWith("issues");
    fireEvent.click(screen.getByText("ลูกค้าทั้งหมด"));
    expect(onSelect).toHaveBeenCalledWith("all");
  });
});
