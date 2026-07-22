import type { CustomerStatusGroup } from "@/types/customer-dashboard";

/** สี/ป้ายของแต่ละกลุ่มสถานะ (ใช้ร่วมกันทุก widget เพื่อความสม่ำเสมอ) */
export const GROUP_META: Record<CustomerStatusGroup, { label: string; color: string }> = {
  in_progress: { label: "กำลังดำเนินการ", color: "#8B5CF6" },
  completed: { label: "ปิดเคสสำเร็จ", color: "#16A34A" },
  issues: { label: "เคสที่มีปัญหา", color: "#EF4444" },
  unclassified: { label: "ยังไม่ระบุสถานะ", color: "#94A3B8" },
};

export function groupColor(group: CustomerStatusGroup): string {
  return GROUP_META[group].color;
}
