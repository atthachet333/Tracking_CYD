import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { GROUP_META } from "@/components/customer-dashboard/groups";
import { EmptyState } from "@/components/ui/primitives";

const AXIS = { fontSize: 12, fontFamily: "IBM Plex Sans Thai", fill: "#94a3b8" };
const tooltipStyle = { borderRadius: 12, border: "1px solid rgba(148,163,184,.3)", fontSize: 13, fontFamily: "IBM Plex Sans Thai", background: "#0f1728", color: "#e2e8f0" };

export interface DeptRow {
  name: string;
  total: number;
  in_progress: number;
  completed: number;
  issues: number;
}

/** เปรียบเทียบ Admin vs Documents ตามกลุ่มสถานะ */
export function DepartmentComparisonChart({ data }: { data: DeptRow[] }) {
  if (!data.length || data.every((d) => d.total === 0)) return <EmptyState msg="ยังไม่มีข้อมูลเปรียบเทียบ" icon="database" />;
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" vertical={false} />
        <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,.08)" }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans Thai" }} />
        <Bar dataKey="total" name="ทั้งหมด" fill="#1D4ED8" radius={[5, 5, 0, 0]} maxBarSize={30} />
        <Bar dataKey="in_progress" name={GROUP_META.in_progress.label} fill={GROUP_META.in_progress.color} radius={[5, 5, 0, 0]} maxBarSize={30} />
        <Bar dataKey="completed" name={GROUP_META.completed.label} fill={GROUP_META.completed.color} radius={[5, 5, 0, 0]} maxBarSize={30} />
        <Bar dataKey="issues" name={GROUP_META.issues.label} fill={GROUP_META.issues.color} radius={[5, 5, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ResponsiveContainer>
  );
}
