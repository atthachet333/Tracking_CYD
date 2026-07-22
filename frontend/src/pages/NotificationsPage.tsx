import { Bell, Clock, AlertTriangle, CheckCircle2, User, FileText } from "lucide-react";
import { useNotifications } from "@/hooks/useApi";
import { Card, PageHeader, EmptyState, ErrorState, Skeleton, Button, TagSoft } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";

const ICONS: Record<string, typeof Bell> = { clock: Clock, alert: AlertTriangle, check: CheckCircle2, user: User, doc: FileText };
const COLORS: Record<string, string> = {
  amber: "bg-warning/15 text-warning",
  red: "bg-danger/10 text-danger",
  green: "bg-success/10 text-success",
  blue: "bg-brand-600/10 text-brand-600",
  purple: "bg-purple/10 text-purple",
};

export function NotificationsPage() {
  const { data, isLoading, isError, error, refetch } = useNotifications();
  const pushToast = useUiStore((s) => s.pushToast);
  const list = data ?? [];

  return (
    <div>
      <PageHeader
        title="การแจ้งเตือน (Notifications)"
        subtitle="งานใกล้ครบกำหนด งานเกินกำหนด การอนุมัติ และการเปลี่ยนสถานะ"
        actions={<Button onClick={() => pushToast({ title: "อ่านทั้งหมด", desc: "ทำเครื่องหมายว่าอ่านแล้ว", type: "success" })}><CheckCircle2 className="h-4 w-4" /> อ่านทั้งหมด</Button>}
      />
      <Card className="p-5">
        {isLoading ? (
          <Skeleton className="h-64" />
        ) : isError ? (
          <ErrorState message={(error as Error)?.message ?? "โหลดการแจ้งเตือนไม่สำเร็จ"} onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <EmptyState msg="ยังไม่มีการแจ้งเตือน" icon="inbox" />
        ) : (
          <div className="flex flex-col">
            {list.map((n) => {
              const Icon = ICONS[n.icon] ?? Bell;
              return (
                <div key={n.id} className={cn("flex items-start gap-3.5 border-b border-line/60 py-4 dark:border-slate-800/60", n.unread && "bg-brand-600/[.03]")}>
                  <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", COLORS[n.color] ?? COLORS.blue)}>
                    <Icon className="h-[19px] w-[19px]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {n.title}
                      {n.unread && <TagSoft>ใหม่</TagSoft>}
                    </div>
                    <p className="mt-0.5 text-xs text-muted dark:text-slate-400">{n.desc}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-muted">{n.time}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
