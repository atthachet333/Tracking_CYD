import { describe, it, expect } from "vitest";
import { buildCsv } from "./csv";

describe("buildCsv", () => {
  it("มี BOM, header และ escape ค่าที่มี comma/quote/newline", () => {
    const csv = buildCsv(
      [{ key: "company", label: "บริษัท" }, { key: "note", label: "หมายเหตุ" }],
      [
        { company: "Alpha, Inc", note: 'has "quote"' },
        { company: "เบต้า", note: "line1\nline2" },
      ],
    );
    expect(csv.charCodeAt(0)).toBe(0xfeff); // BOM
    const lines = csv.slice(1).split("\n");
    expect(lines[0]).toBe("บริษัท,หมายเหตุ");
    expect(csv).toContain('"Alpha, Inc"');
    expect(csv).toContain('"has ""quote"""');
    expect(csv).toContain('"line1\nline2"');
    expect(csv).toContain("เบต้า");
  });

  it("ค่าว่าง/undefined → เซลล์ว่าง", () => {
    const csv = buildCsv([{ key: "a", label: "A" }, { key: "b", label: "B" }], [{ a: "x" }]);
    expect(csv.slice(1).split("\n")[1]).toBe("x,");
  });
});
