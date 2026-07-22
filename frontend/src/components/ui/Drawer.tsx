import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function Drawer({
  open, onClose, title, children,
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[95] bg-slate-900/50 backdrop-blur-[2px]"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-y-0 right-0 z-[96] flex w-[420px] max-w-[92vw] flex-col bg-white shadow-cardHover dark:bg-[#111a2e]"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4 dark:border-slate-800">
              <h3 className="text-base font-bold">{title}</h3>
              <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface dark:hover:bg-slate-800">
                <X className="h-[18px] w-[18px]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
