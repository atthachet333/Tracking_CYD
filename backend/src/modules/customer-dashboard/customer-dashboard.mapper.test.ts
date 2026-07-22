import { describe, it, expect } from "vitest";
import { mapSourceToCustomerCases, hasCustomerStatusColumn } from "./customer-dashboard.mapper";

const SYNCED = "2026-07-22T00:00:00.000Z";

/** header ที่ "สถานะลูกค้า" อยู่คอลัมน์ index 2 (พิสูจน์ว่าไม่ผูก column J/9) */
const HEADER = ["วันที่", "รหัสเคส", "สถานะลูกค้า", "ชื่อบริษัท"];

describe("mapSourceToCustomerCases", () => {
  const values: string[][] = [
    ["ใบรายงานสถานะลูกค้า (แถวชื่อเรื่อง)"], // ไม่ใช่ header
    HEADER, // header อยู่แถวที่ 2 (dynamic detection)
    ["2026-05-01", "C-1", "ลงนามแล้ว", "Alpha"],
    [], // แถวว่าง → ข้าม
    ["2026-05-02", "C-2", "ลูกค้าปฏฺิเสธ", "Beta"], // typo → issues
    HEADER, // header ซ้ำกลางชีต → ข้าม
    ["2026-06-01", "C-2", "กำลังพิจารณา", "Beta-2"], // caseNo ซ้ำ = business key แยก (ROW)
    ["2026-06-02", "", "", "GammaNoCase"], // มีบริษัทแต่ status ว่าง → unclassified
  ];

  it("ตรวจพบคอลัมน์สถานะจาก header จริง (ไม่ใช่ index ตายตัว)", () => {
    expect(hasCustomerStatusColumn(values)).toBe(true);
  });

  it("ข้ามแถวว่าง/หัวซ้ำ และจำแนกกลุ่มถูกต้อง", () => {
    const res = mapSourceToCustomerCases(values, "พี่คิม", "พี่คิม", SYNCED);
    expect(res.hasStatusColumn).toBe(true);
    // 4 เคสจริง (C-1, C-2, C-2 dup, Gamma) — หัวซ้ำ/แถวว่างไม่ถูกนับ
    expect(res.cases).toHaveLength(4);

    const byCase = (no: string, company: string) =>
      res.cases.find((c) => c.caseNo === no && c.company === company);
    expect(byCase("C-1", "Alpha")?.statusGroup).toBe("completed");
    expect(byCase("C-2", "Beta")?.statusGroup).toBe("issues");
    expect(byCase("C-2", "Beta")?.customerStatus).toBe("ลูกค้าปฏฺิเสธ"); // เก็บค่าดิบ
    expect(byCase("C-2", "Beta-2")?.statusGroup).toBe("in_progress"); // caseNo ซ้ำ = คนละ record
    expect(res.cases.find((c) => c.company === "GammaNoCase")?.statusGroup).toBe("unclassified");
  });

  it("assignee/sourceSheet ถูกเติมจาก source", () => {
    const res = mapSourceToCustomerCases(values, "พี่คิม", "พี่คิม", SYNCED);
    expect(res.cases.every((c) => c.assignee === "พี่คิม")).toBe(true);
    expect(res.cases.every((c) => c.sourceSheet === "พี่คิม")).toBe(true);
  });

  it("แท็บที่ไม่มีคอลัมน์สถานะ → hasStatusColumn=false และทุกเคส unclassified", () => {
    const noStatus: string[][] = [
      ["วันที่", "รหัสเคส", "ชื่อบริษัท"],
      ["2026-05-01", "D-1", "Delta"],
      ["2026-05-02", "D-2", "Echo"],
    ];
    expect(hasCustomerStatusColumn(noStatus)).toBe(false);
    const res = mapSourceToCustomerCases(noStatus, "พี่แอน", "พี่แอน", SYNCED);
    expect(res.hasStatusColumn).toBe(false);
    expect(res.cases).toHaveLength(2);
    expect(res.cases.every((c) => c.statusGroup === "unclassified")).toBe(true);
  });
});
