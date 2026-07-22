import {
  LayoutGrid, ListTodo, Users, UserCheck, BarChart3,
  Bell, Settings, FileSpreadsheet, Files, type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: "approvals" | "notifications" | "over";
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    group: "ภาพรวม",
    items: [
      { to: "/dashboard", label: "Executive Overview", icon: LayoutGrid },
      { to: "/dashboard/customer-overview", label: "ภาพรวมลูกค้าและสถานะเคส", icon: UserCheck },
      { to: "/dashboard/team", label: "ภาพรวมแอดมินและเอกสาร", icon: Users },
      { to: "/dashboard/documents-overview", label: "ภาพรวมแผนกเอกสาร", icon: Files },
    ],
  },
  {
    group: "งาน",
    items: [
      { to: "/dashboard/tasks", label: "งานทั้งหมด", icon: ListTodo },
    ],
  },
  {
    group: "ข้อมูล & วิเคราะห์",
    items: [
      { to: "/dashboard/customers", label: "ลูกค้า", icon: Users },
      { to: "/dashboard/reports", label: "รายงานและวิเคราะห์", icon: BarChart3 },
    ],
  },
  {
    group: "ระบบ",
    items: [
      { to: "/dashboard/notifications", label: "การแจ้งเตือน", icon: Bell, badgeKey: "notifications" },
      { to: "/dashboard/settings/integrations/google-sheets", label: "เชื่อมต่อ Google Sheets", icon: FileSpreadsheet },
      { to: "/dashboard/settings", label: "ตั้งค่าระบบ", icon: Settings },
    ],
  },
];
