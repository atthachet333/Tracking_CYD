import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { useDocumentsHeaders, useDocumentsSummary } from "@/hooks/useDocumentsDashboard";
import { Card, SectionTitle, Button, Skeleton } from "@/components/ui/primitives";

/** พาเนลข้อมูลแท็บ DOCUMENTS บนหน้า Google Sheets Integration */
export function DocumentsIntegrationPanel() {
  const navigate = useNavigate();
  const headers = useDocumentsHeaders();
  const summary = useDocumentsSummary();
  const meta = headers.data?.meta ?? summary.data?.meta;
  const mapping = headers.data?.mapping ?? {};
  const preview = headers.data?.preview ?? [];

  return (
    <Card className="mb-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle title="แท็บแผนกเอกสาร (DOCUMENTS)" sub="ตรวจ header/preview จากข้อมูลจริง" />
        <Button onClick={() => navigate("/dashboard/documents-overview")}>ไปหน้าภาพรวมแผนกเอกสาร <ArrowRight className="h-4 w-4" /></Button>
      </div>

      {headers.isLoading ? <Skeleton className="mt-3 h-40" /> : (
        <div className="mt-3 space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Info label="Sheet ID" value={String(meta?.sheetId ?? "—")} mono />
            <Info label="Sheet Title" value={meta?.sheetTitle ?? "—"} />
            <Info label="จำนวนแถว" value={String(meta?.rowsRead ?? 0)} mono />
            <Info label="คอลัมน์" value={String(meta?.headers.length ?? 0)} mono />
          </div>

          {meta && meta.warnings.length > 0 && (
            <div className="space-y-1.5">
              {meta.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-1.5 rounded-lg bg-warning/10 p-2 text-[11.5px] text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="mb-2 text-[13px] font-semibold">Header Mapping</div>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {Object.entries(mapping).map(([field, header]) => (
                <div key={field} className="flex items-center justify-between text-[12.5px]">
                  <span className="tnum text-muted">{field}</span>
                  {header ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-success"><CheckCircle2 className="h-3.5 w-3.5" /> {header}</span>
                  ) : <span className="inline-flex items-center gap-1 text-warning"><AlertTriangle className="h-3.5 w-3.5" /> ยังไม่ได้ map</span>}
                </div>
              ))}
            </div>
          </div>

          {preview.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold"><FileText className="h-4 w-4" /> Preview ({preview.length} แถว)</div>
              <div className="max-h-56 overflow-auto rounded-lg border border-line dark:border-slate-800">
                <table className="w-full border-collapse text-[11.5px]">
                  <thead className="sticky top-0 bg-surface dark:bg-[#0f1728]">
                    <tr>{(meta?.headers ?? []).slice(0, 14).map((h, i) => <th key={i} className="whitespace-nowrap px-2 py-1.5 text-left font-semibold text-muted">{h || `col${i + 1}`}</th>)}</tr>
                  </thead>
                  <tbody>
                    {preview.map((row, ri) => (
                      <tr key={ri} className="border-t border-line/60 dark:border-slate-800/60">
                        {(meta?.headers ?? []).slice(0, 14).map((_, ci) => <td key={ci} className="max-w-[160px] truncate px-2 py-1.5" title={row[ci] ?? ""}>{row[ci] ?? ""}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-line p-3 dark:border-slate-800">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={mono ? "tnum mt-0.5 font-semibold" : "mt-0.5 truncate font-semibold"} title={value}>{value}</div>
    </div>
  );
}
