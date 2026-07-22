import { describe, it, expect } from "vitest";
import { buildSummary, buildSummaryMatrix, type SourceRows } from "./summary.mapper";
import { ADMIN_HEADERS } from "./sync.types";

const A = ADMIN_HEADERS.indexOf("ผู้รับผิดชอบ");
const Q = ADMIN_HEADERS.indexOf("ทำใบเสนอราคา");
const S = ADMIN_HEADERS.indexOf("สถานะลูกค้า");
const D = ADMIN_HEADERS.indexOf("มัดจำ");
const CL = ADMIN_HEADERS.indexOf("ลิงก์สัญญา");

/** สร้าง ADMIN row ตามลำดับหัวจริง */
function row(fields: Partial<Record<number, string>>): string[] {
  return ADMIN_HEADERS.map((_, i) => fields[i] ?? "");
}

describe("buildSummary", () => {
  const sources: SourceRows[] = [
    {
      slug: "p-kim",
      sourceSheet: "พี่คิม",
      rows: [
        row({ [A]: "พี่คิม", [S]: "รอเสนอ", [Q]: "ทำแล้ว", [D]: "10000", [CL]: "http://c/1" }),
        row({ [A]: "พี่คิม", [S]: "ปิดการขาย", [Q]: "ทำแล้ว" }),
      ],
    },
    {
      slug: "am",
      sourceSheet: "แอม",
      rows: [
        row({ [A]: "แอม", [S]: "" }), // สถานะว่าง → "ไม่ระบุ"
      ],
    },
  ];

  it("นับ total และตัวชี้วัดรวม", () => {
    const s = buildSummary(sources, "2026-07-22T00:00:00.000Z");
    expect(s.totalCases).toBe(3);
    expect(s.quotedCount).toBe(2);
    expect(s.depositCount).toBe(1);
    expect(s.contractCount).toBe(1);
  });

  it("จัดกลุ่มตามผู้รับผิดชอบและสถานะ (เรียงจากมากไปน้อย)", () => {
    const s = buildSummary(sources, "2026-07-22T00:00:00.000Z");
    expect(s.byAssignee).toEqual([
      { key: "พี่คิม", label: "พี่คิม", count: 2 },
      { key: "แอม", label: "แอม", count: 1 },
    ]);
    const statusLabels = s.byCustomerStatus.map((m) => m.label);
    expect(statusLabels).toContain("ไม่ระบุ");
    expect(s.byCustomerStatus.reduce((n, m) => n + m.count, 0)).toBe(3);
  });

  it("ใช้ชื่อ source เป็น fallback เมื่อไม่มีผู้รับผิดชอบในแถว", () => {
    const s = buildSummary([{ slug: "x", sourceSheet: "พี่วี", rows: [row({})] }], "t");
    expect(s.byAssignee).toEqual([{ key: "พี่วี", label: "พี่วี", count: 1 }]);
  });
});

describe("buildSummaryMatrix", () => {
  it("สร้างเมทริกซ์ที่มีหัวข้อและยอดรวม", () => {
    const s = buildSummary(
      [{ slug: "p-kim", sourceSheet: "พี่คิม", rows: [row({ [A]: "พี่คิม", [S]: "รอเสนอ" })] }],
      "2026-07-22T00:00:00.000Z",
    );
    const m = buildSummaryMatrix(s);
    expect(m[0][0]).toContain("สรุปยอด");
    expect(m).toContainEqual(["เคสทั้งหมด", "1"]);
    expect(m).toContainEqual(["ผู้รับผิดชอบ", "จำนวนเคส"]);
    expect(m).toContainEqual(["พี่คิม", "1"]);
  });
});
