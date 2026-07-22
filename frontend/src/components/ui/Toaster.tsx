import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Bell } from "lucide-react";
import { useUiStore, type Toast } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

const CFG: Record<Toast["type"], { icon: typeof Bell; bar: string; ic: string }> = {
  success: { icon: CheckCircle2, bar: "border-l-success", ic: "text-success" },
  warn: { icon: AlertTriangle, bar: "border-l-warning", ic: "text-warning" },
  error: { icon: XCircle, bar: "border-l-danger", ic: "text-danger" },
  info: { icon: Bell, bar: "border-l-brand-600", ic: "text-brand-600" },
};

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  const dismiss = useUiStore((s) => s.dismissToast);

  return (
    <div className="fixed bottom-6 right-6 z-[120] flex flex-col gap-2.5">
      <AnimatePresence>
        {toasts.map((t) => {
          const c = CFG[t.type];
          const Icon = c.icon;
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 120 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 120 }}
              onClick={() => dismiss(t.id)}
              className={cn("surface-card flex min-w-[280px] max-w-[360px] cursor-pointer items-start gap-3 border-l-4 p-3.5", c.bar)}
            >
              <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", c.ic)} />
              <div>
                <div className="text-[13.5px] font-semibold">{t.title}</div>
                <div className="mt-0.5 text-xs text-muted dark:text-slate-400">{t.desc}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
