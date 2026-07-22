import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import type { DocumentsAssigneeStat } from "@/types/documents-dashboard";
import { WORKLOAD_META } from "./workload";
import { EmptyState } from "@/components/ui/primitives";

const AXIS = { fontSize: 12, fontFamily: "IBM Plex Sans Thai", fill: "#94a3b8" };
const tooltipStyle = { borderRadius: 12, border: "1px solid rgba(148,163,184,.3)", fontSize: 13, fontFamily: "IBM Plex Sans Thai", background: "#0f1728", color: "#e2e8f0" };

/** ปริมาณงานต่อผู้รับผิดชอบ (สีตามระดับภาระงาน) */
export function DocumentsWorkloadChart({ data }: { data: DocumentsAssigneeStat[] }) {
  if (!data.length) return <EmptyState msg="ยังไม่มีข้อมูลผู้รับผิดชอบ" icon="database" />;
  const rows = data.slice(0, 12);
  const height = Math.max(200, rows.length * 40 + 20);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="assignee" width={110} tick={{ ...AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,.08)" }} formatter={(v: number) => [`${v} งาน`, ""]} />
        <Bar dataKey="total" radius={[0, 6, 6, 0]} maxBarSize={24} animationDuration={800}>
          {rows.map((d) => <Cell key={d.assignee} fill={WORKLOAD_META[d.workloadLevel].color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
