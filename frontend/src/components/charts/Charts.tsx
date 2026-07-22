import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ComposedChart, Line,
} from "recharts";
import type { DashboardSummary, TrendPoint, Department, ServiceType, Employee } from "@/types";

const AXIS = { fontSize: 12, fontFamily: "IBM Plex Sans Thai" };
const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #e6ecf4",
  fontSize: 13,
  fontFamily: "IBM Plex Sans Thai",
};

export function LoadDonut({ dist }: { dist: DashboardSummary["loadDistribution"] }) {
  const data = [
    { name: "ภาระสูง", value: dist.high, color: "#EF4444" },
    { name: "ปานกลาง", value: dist.mid, color: "#F59E0B" },
    { name: "ต่ำ", value: dist.low, color: "#16A34A" },
  ];
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={2} animationDuration={800}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans Thai" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function AttendanceBar({ data }: { data: DashboardSummary["weeklyAttendance"] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f8" vertical={false} />
        <XAxis dataKey="day" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "เข้างาน"]} />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={26} animationDuration={800}>
          {data.map((d) => (
            <Cell key={d.day} fill={d.value < 70 ? "#CBD5E1" : "#1D4ED8"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f8" vertical={false} />
        <XAxis dataKey="month" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis yAxisId="left" tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis yAxisId="right" orientation="right" domain={[85, 100]} tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans Thai" }} />
        <Bar yAxisId="left" dataKey="done" name="งานสำเร็จ" fill="#1D4ED8" radius={[5, 5, 0, 0]} maxBarSize={22} />
        <Line yAxisId="right" dataKey="sla" name="SLA %" stroke="#16A34A" strokeWidth={3} dot={{ r: 3 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function DeptCompareBar({ data }: { data: Department[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f8" horizontal={false} />
        <XAxis type="number" domain={[80, 100]} tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="name" width={120} tick={{ ...AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, "SLA"]} />
        <Bar dataKey="sla" radius={[0, 6, 6, 0]} maxBarSize={28} animationDuration={800}>
          {data.map((d) => (
            <Cell key={d.id} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ServiceDonut({ data }: { data: ServiceType[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={2} animationDuration={800}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, fontFamily: "IBM Plex Sans Thai" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function WorkloadBar({ data }: { data: Employee[] }) {
  const chartData = data.map((e) => ({ name: e.name.split(" ")[0], active: e.active, done: e.done }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f8" vertical={false} />
        <XAxis dataKey="name" tick={{ ...AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={AXIS} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans Thai" }} />
        <Bar dataKey="active" name="กำลังทำ" fill="#F59E0B" radius={[5, 5, 0, 0]} maxBarSize={26} />
        <Bar dataKey="done" name="เสร็จแล้ว" fill="#1D4ED8" radius={[5, 5, 0, 0]} maxBarSize={26} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return <span className="text-xs text-muted">—</span>;
  const w = 74;
  const h = 26;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * (h - 4) - 2}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="inline-block h-6 w-[74px] align-middle">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
