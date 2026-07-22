import type { ReactNode } from "react";
import { Database, Inbox, AlertTriangle } from "lucide-react";
import { cn, loadLabel } from "@/lib/utils";
import type { LoadLevel } from "@/types";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("surface-card", className)}>{children}</div>;
}

/** Avatar: ใช้รูปถ้ามี img>0 ไม่งั้นแสดงอักษรย่อ (สำหรับข้อมูลจาก Sheet ที่ไม่มีรูป) */
export function Avatar({ name, img, size = 32, className }: { name: string; img?: number; size?: number; className?: string }) {
  const dim = { width: size, height: size };
  if (img && img > 0) {
    return <img src={`https://i.pravatar.cc/96?img=${img}`} alt={name} loading="lazy" style={dim} className={cn("rounded-lg object-cover", className)} />;
  }
  const initial = (name || "?").trim().charAt(0) || "?";
  return (
    <div style={dim} className={cn("grid place-items-center rounded-lg bg-brand-600/10 font-num font-bold text-brand-600", className)}>
      {initial}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[22px] font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-muted dark:text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-3.5 flex items-center justify-between gap-2">
      <h3 className="text-[15px] font-bold">{title}</h3>
      {sub && <span className="text-xs text-muted dark:text-slate-400">{sub}</span>}
    </div>
  );
}

export function EmptyState({ msg = "ยังไม่มีข้อมูล", hint, icon = "database" }: { msg?: string; hint?: string; icon?: "database" | "inbox" | "alert" }) {
  const Icon = icon === "inbox" ? Inbox : icon === "alert" ? AlertTriangle : Database;
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <Icon className="mb-2 h-11 w-11 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
      <div className="text-sm font-semibold">{msg}</div>
      {hint && <div className="mt-1 text-xs text-muted dark:text-slate-400">{hint}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <AlertTriangle className="mb-2 h-11 w-11 text-danger/70" strokeWidth={1.5} />
      <div className="text-sm font-semibold">เกิดข้อผิดพลาด</div>
      <div className="mt-1 text-xs text-muted dark:text-slate-400">{message}</div>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:bg-surface dark:border-slate-700 dark:hover:bg-slate-800">
          ลองใหม่
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("shimmer rounded-lg bg-line/70 dark:bg-slate-800", className)} />;
}

export function LoadChip({ level }: { level: LoadLevel }) {
  const styles: Record<LoadLevel, string> = {
    high: "bg-danger/10 text-danger",
    mid: "bg-warning/15 text-amber-700 dark:text-amber-400",
    low: "bg-success/10 text-success",
  };
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", styles[level])}>{loadLabel[level]}</span>;
}

const STATUS_STYLE: Record<string, string> = {
  wait: "bg-warning/15 text-amber-700 dark:text-amber-400",
  prog: "bg-brand-600/10 text-brand-600 dark:text-brand-300",
  near: "bg-purple/10 text-purple",
  over: "bg-danger/10 text-danger",
  back: "bg-danger/10 text-danger",
  done: "bg-success/10 text-success",
};

export function StatusBadge({ status, text }: { status: string; text: string }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold", STATUS_STYLE[status] ?? "bg-slate-100 text-slate-600")}>{text}</span>;
}

export function TagSoft({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-line/70 px-2.5 py-0.5 text-[11px] font-semibold text-muted dark:bg-slate-800 dark:text-slate-400">{children}</span>;
}

export function Button({
  children, onClick, variant = "ghost", className, type = "button",
}: {
  children: ReactNode; onClick?: () => void; variant?: "primary" | "ghost"; className?: string; type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-lg px-3.5 text-[13px] font-semibold transition",
        variant === "primary"
          ? "bg-brand-600 text-white hover:bg-brand-700"
          : "border border-line bg-white text-ink hover:bg-surface dark:border-slate-700 dark:bg-[#111a2e] dark:text-slate-200 dark:hover:bg-slate-800",
        className,
      )}
    >
      {children}
    </button>
  );
}
