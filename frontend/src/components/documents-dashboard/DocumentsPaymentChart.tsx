import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { PaymentDistributionItem, PaymentGroup } from "@/types/documents-dashboard";
import { EmptyState } from "@/components/ui/primitives";

const PAYMENT_COLOR: Record<PaymentGroup, string> = {
  paid: "#0EA5A4",     // เขียวอมฟ้า
  pending: "#EAB308",  // เหลือง
  unpaid: "#94A3B8",   // เทา
};

const tooltipStyle = { borderRadius: 12, border: "1px solid rgba(148,163,184,.3)", fontSize: 13, fontFamily: "IBM Plex Sans Thai", background: "#0f1728", color: "#e2e8f0" };

/** Donut สัดส่วนสถานะการชำระ */
export function DocumentsPaymentChart({ data }: { data: PaymentDistributionItem[] }) {
  const total = data.reduce((n, d) => n + d.count, 0);
  if (total === 0) return <EmptyState msg="ยังไม่มีข้อมูลการชำระ" icon="database" />;
  const chart = data.filter((d) => d.count > 0).map((d) => ({ name: d.label, value: d.count, color: PAYMENT_COLOR[d.key] }));
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={chart} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} animationDuration={800} stroke="none">
            {chart.map((d) => <Cell key={d.name} fill={d.color} />)}
          </Pie>
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v} งาน`, ""]} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontFamily: "IBM Plex Sans Thai" }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 top-[-28px] grid place-items-center">
        <div className="text-center">
          <div className="text-[26px] font-extrabold leading-none tnum">{total}</div>
          <div className="mt-1 text-[11px] text-muted">งานทั้งหมด</div>
        </div>
      </div>
    </div>
  );
}
