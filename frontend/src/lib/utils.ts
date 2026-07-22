import { clsx, type ClassValue } from "clsx";

/** รวม className แบบมีเงื่อนไข */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** จัดรูปแบบตัวเลขแบบมี comma */
export function formatNumber(n: number | undefined): string {
  return (n ?? 0).toLocaleString("en-US");
}

/** สีตามระดับ SLA */
export function slaColor(v: number): string {
  if (v >= 96) return "#16A34A";
  if (v >= 92) return "#F59E0B";
  if (v > 0) return "#EF4444";
  return "#94A3B8";
}

/** URL รูป avatar (mock) */
export function avatarUrl(img: number): string {
  return img ? `https://i.pravatar.cc/96?img=${img}` : "";
}

/** ป้ายระดับภาระงาน */
export const loadLabel: Record<string, string> = {
  high: "สูง",
  mid: "ปานกลาง",
  low: "ต่ำ",
};

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
