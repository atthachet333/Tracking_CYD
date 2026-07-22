/* ============================================================
   CSV export (client-side) — รองรับภาษาไทย (UTF-8 BOM ให้ Excel เปิดถูก)
   ============================================================ */

const BOM = String.fromCharCode(0xfeff);

function escapeCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** สร้างสตริง CSV (มี BOM) — pure, ทดสอบได้ */
export function buildCsv<T>(columns: { key: keyof T | string; label: string }[], rows: T[]): string {
  const header = columns.map((c) => escapeCell(c.label)).join(",");
  const body = rows
    .map((row) => columns.map((c) => escapeCell((row as Record<string, unknown>)[c.key as string])).join(","))
    .join("\n");
  return `${BOM}${header}\n${body}`;
}

/** สร้างและดาวน์โหลดไฟล์ CSV จาก array ของ object ตาม columns ที่กำหนด */
export function downloadCsv<T>(
  filename: string,
  columns: { key: keyof T | string; label: string }[],
  rows: T[],
): void {
  const blob = new Blob([buildCsv(columns, rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
