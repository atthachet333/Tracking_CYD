import { describe, it, expect } from "vitest";
import { formatNumber, slaColor, clamp, cn } from "./utils";

describe("utils", () => {
  it("formatNumber ใส่ comma", () => {
    expect(formatNumber(1248)).toBe("1,248");
    expect(formatNumber(undefined)).toBe("0");
  });

  it("slaColor แบ่งช่วงถูกต้อง", () => {
    expect(slaColor(98)).toBe("#16A34A");
    expect(slaColor(93)).toBe("#F59E0B");
    expect(slaColor(80)).toBe("#EF4444");
    expect(slaColor(0)).toBe("#94A3B8");
  });

  it("clamp จำกัดค่า", () => {
    expect(clamp(150, 0, 100)).toBe(100);
    expect(clamp(-5, 0, 100)).toBe(0);
  });

  it("cn รวม class", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
