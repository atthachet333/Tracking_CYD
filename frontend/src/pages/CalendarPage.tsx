import { PageHeader, Card, SectionTitle, TagSoft } from "@/components/ui/primitives";

const EVENTS: Record<number, { text: string; type: "over" | "leave" | "train" | "meet" }[]> = {
  22: [{ text: "ครบกำหนด TSK-1042", type: "over" }],
  23: [{ text: "ลาพักร้อน สมชาย", type: "leave" }],
  25: [{ text: "อบรม Compliance", type: "train" }],
  26: [{ text: "ประชุมทีม 10:00", type: "meet" }],
  28: [{ text: "ครบกำหนด DOC-2404", type: "over" }],
  30: [{ text: "ยื่นภาษี ภ.พ.30", type: "over" }],
};
const TYPE_STYLE = {
  over: "bg-danger/15 text-danger",
  leave: "bg-success/15 text-success",
  train: "bg-purple/15 text-purple",
  meet: "bg-brand-600/15 text-brand-600",
};

export function CalendarPage() {
  const firstDay = 3;
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: 31 }, (_, i) => i + 1)];

  return (
    <div>
      <PageHeader title="ปฏิทินงาน (Calendar & Work Schedule)" subtitle="วันครบกำหนด วันลา การอบรม และนัดหมาย" />
      <Card className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle title="กรกฎาคม 2569" />
          <div className="flex flex-wrap gap-2">
            <TagSoft>● ครบกำหนด</TagSoft>
            <TagSoft>● ลางาน</TagSoft>
            <TagSoft>● อบรม</TagSoft>
            <TagSoft>● นัดหมาย</TagSoft>
          </div>
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1.5">
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-muted">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((d, i) => (
            <div key={i} className={`min-h-[92px] rounded-xl border border-line/70 p-1.5 dark:border-slate-800 ${d === 21 ? "bg-brand-600/[.06]" : ""}`}>
              {d && (
                <>
                  <div className={`tnum text-[13px] ${d === 21 ? "font-extrabold text-brand-600" : "text-muted"}`}>{d}</div>
                  {(EVENTS[d] ?? []).map((ev, j) => (
                    <div key={j} className={`mt-1 truncate rounded px-1.5 py-0.5 text-[10.5px] font-semibold ${TYPE_STYLE[ev.type]}`} title={ev.text}>
                      {ev.text}
                    </div>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
