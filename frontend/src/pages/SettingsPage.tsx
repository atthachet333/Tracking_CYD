import { RefreshCw, ShieldCheck, Server, Palette, Database, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, PageHeader, SectionTitle, Button } from "@/components/ui/primitives";
import { useUiStore } from "@/stores/uiStore";
import { useDashboardSummary, useSheetStatus } from "@/hooks/useApi";
import { api } from "@/services/api";

const ROLES = [
  ["Super Admin", "จัดการระบบและสิทธิ์ทั้งหมด", "bg-danger/10 text-danger"],
  ["ผู้ดูแลข้อมูล", "จัดการข้อมูลส่วนใหญ่", "bg-brand-600/10 text-brand-600"],
  ["Department Manager", "ดูข้อมูลของทีม", "bg-teal/10 text-teal"],
  ["Document Controller", "จัดการเอกสาร", "bg-purple/10 text-purple"],
  ["Staff", "ดูเฉพาะงานตัวเอง", "bg-warning/15 text-warning"],
  ["Executive Viewer", "ดูและ Export เท่านั้น", "bg-success/10 text-success"],
];

export function SettingsPage() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const pushToast = useUiStore((s) => s.pushToast);
  const summary = useDashboardSummary();
  const sheet = useSheetStatus();
  const navigate = useNavigate();

  const checkHealth = async () => {
    try {
      const res = await api.health();
      pushToast({ title: "Backend พร้อมใช้งาน", desc: `${res.service} · ${res.status}`, type: "success" });
    } catch (e) {
      pushToast({ title: "เชื่อมต่อ Backend ไม่สำเร็จ", desc: (e as Error).message, type: "error" });
    }
  };

  return (
    <div>
      <PageHeader title="ตั้งค่าระบบ (Settings)" subtitle="การแสดงผล การเชื่อมต่อ และสิทธิ์ผู้ใช้งาน" />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionTitle title="การแสดงผล" />
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div><div className="flex items-center gap-2 text-sm font-semibold"><Palette className="h-4 w-4" /> โหมดมืด (Dark Mode)</div><div className="text-xs text-muted">ปัจจุบัน: {theme === "dark" ? "มืด" : "สว่าง"}</div></div>
              <Button variant="primary" onClick={toggleTheme}><RefreshCw className="h-4 w-4" /> สลับธีม</Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <SectionTitle title="สถานะระบบ (Backend)" />
          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-xl bg-surface p-3 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 text-sm"><Server className="h-4 w-4 text-brand-600" /> Backend API</div>
              <Button onClick={checkHealth}><RefreshCw className="h-4 w-4" /> ตรวจสอบ</Button>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface p-3 text-sm dark:bg-slate-800/50">
              <span>ข้อมูลพนักงานในระบบ</span>
              <b className="tnum text-success">{summary.data?.totalEmployees ?? 0} คน</b>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface p-3 text-sm dark:bg-slate-800/50">
              <span>งานทั้งหมด</span>
              <b className="tnum text-success">{summary.data?.totalTasks ?? 0} รายการ</b>
            </div>
            <p className="text-xs text-muted">ข้อมูลทั้งหมดมาจาก Google Sheets ผ่าน Backend (ไม่มี Mock Data)</p>
          </div>
        </Card>
      </div>

      <Card className="mb-4 p-5">
        <SectionTitle title="การเชื่อมต่อ (Integrations)" />
        <button
          onClick={() => navigate("/dashboard/settings/integrations/google-sheets")}
          className="flex w-full items-center gap-3 rounded-xl border border-line p-3.5 text-left transition hover:border-brand-600 dark:border-slate-800"
        >
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600/10 text-brand-600"><Database className="h-5 w-5" /></div>
          <div className="flex-1">
            <div className="text-sm font-semibold">Google Sheets</div>
            <div className="text-xs text-muted">
              {sheet.data?.connected ? `เชื่อมต่อแล้ว · ${sheet.data.rowCount} แถว` : sheet.data?.configured ? "เชื่อมต่อไม่สำเร็จ" : "ยังไม่ได้ตั้งค่า"}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted" />
        </button>
      </Card>

      <Card className="p-5">
        <SectionTitle title="สิทธิ์ผู้ใช้งาน (Role-Based Access Control)" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map(([name, desc, cls]) => (
            <div key={name} className="rounded-xl border border-line p-3.5 dark:border-slate-800">
              <div className={`mb-2.5 grid h-9 w-9 place-items-center rounded-lg ${cls}`}><ShieldCheck className="h-[18px] w-[18px]" /></div>
              <div className="text-sm font-semibold">{name}</div>
              <p className="mt-0.5 text-xs text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
