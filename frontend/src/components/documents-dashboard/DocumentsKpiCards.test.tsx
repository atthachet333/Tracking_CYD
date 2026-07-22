// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import type { DocumentsSummary } from "@/types/documents-dashboard";
import { DocumentsKpiCards } from "./DocumentsKpiCards";

const summary: DocumentsSummary = {
  totalItems: 9, inProgress: 0, completed: 9, issues: 0, unclassified: 0,
  uniqueCompanies: 3, totalEmployees: 4, completionRate: 100, issueRate: 0,
};

afterEach(cleanup);

describe("DocumentsKpiCards", () => {
  it("Loading → skeleton", () => {
    const { container } = render(<DocumentsKpiCards summary={undefined} isLoading isError={false} onRetry={() => {}} />);
    expect(container.querySelector(".shimmer")).not.toBeNull();
  });

  it("Error → ปุ่มลองใหม่", () => {
    const onRetry = vi.fn();
    render(<DocumentsKpiCards summary={undefined} isLoading={false} isError onRetry={onRetry} />);
    fireEvent.click(screen.getByText("ลองใหม่"));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("Success → KPI 6 ใบจากข้อมูลจริง", () => {
    render(<DocumentsKpiCards summary={summary} isLoading={false} isError={false} onRetry={() => {}} />);
    expect(screen.getByText("งานเอกสารทั้งหมด")).not.toBeNull();
    expect(screen.getByText("เสร็จสิ้น")).not.toBeNull();
    expect(screen.getByText("บริษัททั้งหมด")).not.toBeNull();
    expect(screen.getByText("ผู้รับผิดชอบ")).not.toBeNull();
  });

  it("Drill-down → คลิก 'เสร็จสิ้น' เรียก onSelectGroup", () => {
    const onSelectGroup = vi.fn();
    render(<DocumentsKpiCards summary={summary} isLoading={false} isError={false} onRetry={() => {}} onSelectGroup={onSelectGroup} />);
    fireEvent.click(screen.getByText("เสร็จสิ้น"));
    expect(onSelectGroup).toHaveBeenCalledWith("completed");
  });
});
