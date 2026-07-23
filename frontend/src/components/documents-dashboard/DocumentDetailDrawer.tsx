import type { DocumentTaskItem } from "@/types/documents-dashboard";
import { Drawer } from "@/components/ui/Drawer";
import { StatusChip } from "@/components/customer-dashboard/StatusChip";
import { labelOf } from "@/config/column-labels";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-line/60 py-2 dark:border-slate-800/60">
      <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-0.5 whitespace-pre-wrap text-[13.5px]">{value.trim() || "—"}</div>
    </div>
  );
}

/** Detail Drawer — งานเอกสาร 7 คอลัมน์ + รายละเอียดเต็ม */
export function DocumentDetailDrawer({ item, open, onClose }: { item: DocumentTaskItem | null; open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title={item?.company || "รายละเอียดงานเอกสาร"}>
      {item && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <StatusChip raw={item.caseStatus} group={item.statusGroup} />
            <span className="tnum text-xs text-muted">{item.caseNo || "—"}</span>
          </div>
          <Field label={labelOf("workDate")} value={item.workDate ?? ""} />
          <Field label={labelOf("caseNo")} value={item.caseNo} />
          <Field label={labelOf("assignee")} value={item.assignee} />
          <Field label={labelOf("company")} value={item.company} />
          <Field label={labelOf("initialDetail")} value={item.detail} />
          <Field label={labelOf("paymentStatus")} value={item.paymentStatus} />
          <Field label={labelOf("caseStatus")} value={item.caseStatus} />
          <Field label={labelOf("sourceSheet")} value={item.sourceSheet} />
          <Field label={labelOf("sourceRow")} value={String(item.sourceRow)} />
        </div>
      )}
    </Drawer>
  );
}
