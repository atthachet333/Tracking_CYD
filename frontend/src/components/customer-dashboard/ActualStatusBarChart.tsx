import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import type { CustomerActualStatusItem } from "@/types/customer-dashboard";
import { groupColor } from "./groups";
import { EmptyState } from "@/components/ui/primitives";

const AXIS = { fontSize: 12, fontFamily: "IBM Plex Sans Thai", fill: "#94a3b8" };
const tooltipStyle = { borderRadius: 12, border: "1px solid rgba(148,163,184,.3)", fontSize: 13, fontFamily: "IBM Plex Sans Thai", background: "#0f1728", color: "#e2e8f0" };

/** Horizontal bar: จำนวนเคสตามค่าสถานะจริงในชีต */
export function ActualStatusBarChart({ data }: { data: CustomerActualStatusItem[] }) {
  if (!data.length) return <EmptyState msg="ยังไม่มีข้อมูลสถานะ" icon="database" />;
  const rows = data.slice(0, 12);
  const height = Math.max(200, rows.length * 34 + 20);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.15)" horizontal={false} />
        <XAxis type="number" tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="status" width={128} tick={{ ...AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(148,163,184,.08)" }} formatter={(v: number) => [`${v} เคส`, ""]} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22} animationDuration={800}>
          {rows.map((d) => <Cell key={d.status} fill={groupColor(d.group)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
