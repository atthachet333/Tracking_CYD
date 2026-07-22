import { ExternalLink } from "lucide-react";
import type { CustomerCaseItem } from "@/types/customer-dashboard";
import { Drawer } from "@/components/ui/Drawer";
import { StatusChip } from "./StatusChip";

function isUrl(v: string): boolean {
  return /^https?:\/\//i.test(v.trim());
}

function Field({ label, value }: { label: string; value: string }) {
  const v = value.trim();
  return (
    <div className="border-b border-line/60 py-2 dark:border-slate-800/60">
      <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      {v ? (
        isUrl(v) ? (
          <a href={v} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:underline">
            เปิดลิงก์ <ExternalLink className="h-3.5 w-3.5" />
          </a>
        ) : (
          <div className="mt-0.5 whitespace-pre-wrap text-[13.5px]">{v}</div>
        )
      ) : (
        <div className="mt-0.5 text-[13.5px] text-slate-400">—</div>
      )}
    </div>
  );
}

/** Detail Drawer แสดงข้อมูลลูกค้า/เคส ครบทุกคอลัมน์ */
export function CompanyDetailDrawer({ item, open, onClose }: { item: CustomerCaseItem | null; open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title={item?.company || "รายละเอียดเคส"}>
      {item && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <StatusChip raw={item.customerStatus} group={item.statusGroup} />
            <span className="tnum text-xs text-muted">{item.caseNo || "—"}</span>
          </div>
          <Field label="วันที่" value={item.date ?? ""} />
          <Field label="รหัสเคส" value={item.caseNo} />
          <Field label="ชื่อบริษัท" value={item.company} />
          <Field label="ผู้รับผิดชอบ" value={item.assignee} />
          <Field label="คุยรายละเอียดเบื้องต้น" value={item.initialDetail} />
          <Field label="ทำใบเสนอราคา" value={item.quotation} />
          <Field label="ลิงก์ใบเสนอราคา" value={item.quotationLink} />
          <Field label="ติดตามผลครั้งที่ 1" value={item.followUp1} />
          <Field label="ติดตามผลครั้งที่ 2" value={item.followUp2} />
          <Field label="ติดตามผลครั้งที่ 3" value={item.followUp3} />
          <Field label="สถานะลูกค้า" value={item.customerStatus} />
          <Field label="มัดจำ (ส่งขาด)" value={item.deposit} />
          <Field label="ร่างสัญญา" value={item.contractDraft} />
          <Field label="ลิงก์สัญญา" value={item.contractLink} />
          <Field label="source_sheet" value={item.sourceSheet} />
          <Field label="source_row" value={String(item.sourceRow)} />
        </div>
      )}
    </Drawer>
  );
}
