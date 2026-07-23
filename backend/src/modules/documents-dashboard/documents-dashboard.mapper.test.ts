import { describe, it, expect } from "vitest";
import { mapDocuments } from "./documents-dashboard.mapper";

const HEADER = ["วันที่", "รหัสเคส", "ผู้รับผิดชอบ", "ชื่อบริษัท", "รายละเอียดเบื้องต้น", "ทำใบเสนอราคา", "สถานะลูกค้า"];

describe("mapDocuments", () => {
  const values: string[][] = [
    ["รายงานแผนกเอกสาร (แถวชื่อเรื่อง)"],       // ไม่ใช่ header
    HEADER,                                       // header อยู่แถวที่ 2 (dynamic)
    ["08/06/2026", "C-1", "พี่อััง", "บ.A", "รายละเอียด 1", "ดำเนินการเรียบร้อย", ""], // status ว่าง → fallback quotation
    [],                                            // empty → ข้าม
    ["09/06/2026", "C-2", "พี่แอน", "บ.B", "รายละเอียด 2", "", "เอกสารไม่ครบ"],        // status ตรง → issues
    HEADER,                                        // header ซ้ำ → ข้าม
    ["10/06/2026", "C-3", "พี่แอน", "บ.B", "รายละเอียด 3", "กำลังดำเนินการ", ""],       // fallback → in_progress
  ];

  it("ตรวจ header dynamic + ข้าม empty/หัวซ้ำ", () => {
    const r = mapDocuments(values, "DOCUMENTS");
    expect(r.items).toHaveLength(3);
    expect(r.headers).toEqual(HEADER);
    expect(r.mapping.caseNo).toBe("รหัสเคส");
    expect(r.mapping.company).toBe("ชื่อบริษัท");
  });

  it("status fallback: คอลัมน์สถานะว่าง → ใช้ 'ทำใบเสนอราคา'", () => {
    const r = mapDocuments(values, "DOCUMENTS");
    const c1 = r.items.find((i) => i.caseNo === "C-1");
    expect(c1?.actualStatus).toBe("ดำเนินการเรียบร้อย");
    expect(c1?.statusGroup).toBe("completed");
  });

  it("status ตรงคอลัมน์ → ใช้ค่าจริง (issues)", () => {
    const r = mapDocuments(values, "DOCUMENTS");
    expect(r.items.find((i) => i.caseNo === "C-2")?.statusGroup).toBe("issues");
    expect(r.items.find((i) => i.caseNo === "C-3")?.statusGroup).toBe("in_progress");
  });

  it("normalize ผู้รับผิดชอบ (typo)", () => {
    const r = mapDocuments(values, "DOCUMENTS");
    expect(r.items.find((i) => i.caseNo === "C-1")?.assignee).toBe("พี่อัง");
  });

  it("ไม่พบ header → warning ไม่ crash", () => {
    const r = mapDocuments([["a", "b"], ["1", "2"]], "DOCUMENTS");
    expect(r.items).toHaveLength(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("โครงสร้าง 7 คอลัมน์จริง: map สถานะการชำระ + สถานะเคส แยกกัน", () => {
    const H7 = ["วันที่", "รหัสเคส", "ผู้รับผิดชอบ", "ชื่อบริษัท", "รายละเอียดเบื้องต้น", "สถานะการชำระ", "สถานะเคส"];
    const v: string[][] = [
      H7,
      ["08/06/2026", "D-1", "พี่แอน", "บ.A", "รายละเอียดยาว ๆ ของงานเอกสาร", "ชำระแล้ว 7", "ดำเนินการเรียบร้อย"],
      ["10/06/2026", "D-2", "สนุ๊ก", "บ.B", "รายละเอียด 2", "รอชำระค่าตีวีซ่า 23/07", "กำลังดำเนินการ"],
      ["12/06/2026", "D-3", "พี่อัง", "บ.C", "รายละเอียด 3", "", ""],
    ];
    const r = mapDocuments(v, "DOCUMENTS");
    expect(r.items).toHaveLength(3);
    expect(r.mapping.paymentStatus).toBe("สถานะการชำระ");
    expect(r.mapping.status).toBe("สถานะเคส"); // caseStatus มาจาก "สถานะเคส"

    const d1 = r.items.find((i) => i.caseNo === "D-1")!;
    expect(d1.caseStatus).toBe("ดำเนินการเรียบร้อย");
    expect(d1.statusGroup).toBe("completed");
    expect(d1.paymentStatus).toBe("ชำระแล้ว 7");
    expect(d1.paymentGroup).toBe("paid");

    const d2 = r.items.find((i) => i.caseNo === "D-2")!;
    expect(d2.statusGroup).toBe("in_progress");
    expect(d2.paymentGroup).toBe("pending");

    const d3 = r.items.find((i) => i.caseNo === "D-3")!;
    expect(d3.statusGroup).toBe("unclassified");
    expect(d3.paymentGroup).toBe("unclassified");
  });
});
