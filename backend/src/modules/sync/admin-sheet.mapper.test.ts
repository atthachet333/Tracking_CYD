import { describe, it, expect } from "vitest";
import { mapSourceToAdmin, buildAdminMatrix } from "./admin-sheet.mapper";
import { ADMIN_HEADERS } from "./sync.types";

const HEADER = [
  "วันที่", "รหัสเคส", "ชื่อบริษัท", "คุยรายละเอียดเบื้องต้น", "ทำใบเสนอราคา", "ลิงก์ใบเสนอราคา",
  "ติดตามผลครั้งที่ 1", "ติดตามผลครั้งที่ 2", "ติดตามผลครั้งที่ 3", "สถานะลูกค้า", "มัดจำ", "ร่างสัญญา", "ลิงก์สัญญา",
];
const EMPTY = ["", "", "", "", "", "", "", "", "", "", "", "", ""];

function buildValues(): string[][] {
  return [
    ["อัพเดตแอดมิน — แท็บ พี่คิม"],                                        // 0 junk
    HEADER,                                                                 // 1 header
    ["01/07/2569", "C-001", "บ.เอ", "คุยแล้ว", "ทำแล้ว", "http://q1", "", "", "", "สนใจ", "", "", ""], // 2 valid
    EMPTY,                                                                  // 3 empty
    HEADER,                                                                 // 4 repeated header
    ["02/07/2569", "C-001", "บ.เอ (ซ้ำ)", "", "", "", "", "", "", "", "", "", ""], // 5 duplicate caseNo
    ["03/07/2569", "", "บ.บี", "", "", "", "", "", "", "", "", "", ""],     // 6 no caseNo (มี company)
    EMPTY,                                                                  // 7 empty
    EMPTY,                                                                  // 8 empty
    ["04/07/2569", "", "", "note", "", "", "", "", "", "", "", "", ""],     // 9 invalid (ไม่มี case/company)
  ];
}

describe("mapSourceToAdmin", () => {
  const r = mapSourceToAdmin(buildValues(), "พี่คิม", "พี่คิม", "2026-07-22T00:00:00.000Z");

  it("นับสถิติถูกต้อง", () => {
    expect(r.rowsRead).toBe(8);
    expect(r.rowsWritten).toBe(3);
    expect(r.emptyRowsSkipped).toBe(3);
    expect(r.repeatedHeadersSkipped).toBe(1);
    expect(r.invalidRowsSkipped).toBe(1);
    expect(r.duplicateRows).toBe(1);
  });

  it("เพิ่มผู้รับผิดชอบ = พี่คิม และ source_sheet", () => {
    expect(r.adminRows[0][2]).toBe("พี่คิม"); // ผู้รับผิดชอบ
    expect(r.adminRows[0][14]).toBe("พี่คิม"); // source_sheet
    expect(r.adminRows[0][17]).toBe("2026-07-22T00:00:00.000Z"); // synced_at
  });

  it("source_record_id ตามกติกา", () => {
    expect(r.adminRows[0][16]).toBe("พี่คิม::C-001");            // มีรหัสเคส
    expect(r.adminRows[1][16]).toBe("พี่คิม::C-001::ROW-6");     // รหัสเคสซ้ำ → ต่อ ::ROW-แถว
    expect(r.adminRows[2][16]).toBe("พี่คิม::ROW-7");           // ไม่มีรหัสเคส
  });

  it("แถวมีจำนวนคอลัมน์เท่า ADMIN_HEADERS", () => {
    expect(r.adminRows[0]).toHaveLength(ADMIN_HEADERS.length);
  });
});

describe("buildAdminMatrix (upsert by source_sheet)", () => {
  it("คงข้อมูล source_sheet อื่น + แทนที่เฉพาะพี่คิม + header ถูกต้อง", () => {
    const header = [...ADMIN_HEADERS];
    const existing = [
      header,
      ["01/06/69", "A-1", "แอม", "บ.เก่า", "", "", "", "", "", "", "", "", "", "", "แอม", "2", "แอม::A-1", "t"],
      ["02/06/69", "K-9", "พี่คิม", "บ.เก่าคิม", "", "", "", "", "", "", "", "", "", "", "พี่คิม", "3", "พี่คิม::K-9", "t"],
    ];
    const newRows = [
      ["01/07/69", "C-001", "พี่คิม", "บ.ใหม่", "", "", "", "", "", "", "", "", "", "", "พี่คิม", "2", "พี่คิม::C-001", "t2"],
    ];
    const matrix = buildAdminMatrix(existing, newRows, "พี่คิม");
    // header + แอม(คงไว้) + พี่คิมใหม่ = 3 แถว
    expect(matrix).toHaveLength(3);
    expect(matrix[0]).toEqual(header);
    expect(matrix[1][14]).toBe("แอม");     // ข้อมูลแอมยังอยู่
    expect(matrix[2][16]).toBe("พี่คิม::C-001"); // พี่คิมเป็นข้อมูลใหม่
    // ไม่มีพี่คิมเดิม (K-9) หลงเหลือ
    expect(matrix.some((r) => r[16] === "พี่คิม::K-9")).toBe(false);
  });
});
