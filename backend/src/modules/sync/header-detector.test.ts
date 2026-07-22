import { describe, it, expect } from "vitest";
import { detectHeaderRow, countHeaderMatches } from "./header-detector";

const HEADER = ["วันที่", "รหัสเคส", "ชื่อบริษัท", "คุยรายละเอียดเบื้องต้น", "สถานะลูกค้า"];

describe("detectHeaderRow", () => {
  it("หาแถวหัวที่ไม่ได้อยู่แถวแรก", () => {
    const values = [["ชื่อชีต พี่คิม"], ["ข้อความอื่น"], HEADER, ["01/07/2569", "C-1", "บ.เอ"]];
    const d = detectHeaderRow(values);
    expect(d).not.toBeNull();
    expect(d?.headerRowIndex).toBe(2);
    expect(d?.columnMap.caseNo).toBe(1);
    expect(d?.columnMap.company).toBe(2);
  });

  it("คืน null เมื่อไม่พบหัวตาราง", () => {
    expect(detectHeaderRow([["a", "b"], ["c", "d"]])).toBeNull();
  });
});

describe("countHeaderMatches", () => {
  it("แถวหัว match มาก, แถวข้อมูล match น้อย", () => {
    expect(countHeaderMatches(HEADER)).toBeGreaterThanOrEqual(4);
    expect(countHeaderMatches(["01/07/2569", "C-1", "บ.เอ"])).toBeLessThan(3);
  });
});
