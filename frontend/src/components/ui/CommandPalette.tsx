import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Search, CornerDownLeft } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

interface Cmd {
  label: string;
  action: () => void;
  hint: string;
}

export function CommandPalette() {
  const open = useUiStore((s) => s.cmdkOpen);
  const setCmdk = useUiStore((s) => s.setCmdk);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);

  const can = useAuthStore((s) => s.can);
  const commands = useMemo<Cmd[]>(() => {
    const pages: Cmd[] = NAV.flatMap((g) =>
      g.items
        .filter((it) => !it.permission || can(it.permission))
        .map((it) => ({ label: it.label, hint: "หน้า", action: () => navigate(it.to) })),
    );
    return [
      ...pages,
      { label: "สลับธีม Light / Dark", hint: "การกระทำ", action: toggleTheme },
    ];
  }, [navigate, toggleTheme, can]);

  const filtered = useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())),
    [commands, q],
  );

  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
    }
  }, [open]);

  useEffect(() => {
    if (sel >= filtered.length) setSel(0);
  }, [filtered, sel]);

  const run = (i: number) => {
    const c = filtered[i];
    if (c) {
      setCmdk(false);
      c.action();
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => (s + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => (s - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(sel);
    } else if (e.key === "Escape") {
      setCmdk(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[130] flex items-start justify-center bg-slate-900/55 pt-[12vh] backdrop-blur-sm"
          onClick={() => setCmdk(false)}
        >
          <motion.div
            initial={{ scale: 0.96, y: -8 }}
            animate={{ scale: 1, y: 0 }}
            className="w-[620px] max-w-[92vw] overflow-hidden rounded-2xl border border-line bg-white shadow-cardHover dark:border-slate-800 dark:bg-[#111a2e]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5 dark:border-slate-800">
              <Search className="h-5 w-5 text-muted" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKey}
                placeholder="พิมพ์คำสั่งหรือค้นหาหน้า..."
                className="flex-1 bg-transparent text-base outline-none placeholder:text-muted"
              />
              <kbd className="rounded border border-line px-1.5 text-[11px] text-muted dark:border-slate-700">ESC</kbd>
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted">ไม่พบคำสั่ง “{q}”</div>
              ) : (
                filtered.map((c, i) => (
                  <button
                    key={c.label}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => run(i)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm",
                      i === sel ? "bg-surface dark:bg-slate-800" : "",
                    )}
                  >
                    <span className="flex-1">{c.label}</span>
                    <span className="text-[11px] text-muted">{c.hint}</span>
                    {i === sel && <CornerDownLeft className="h-3.5 w-3.5 text-muted" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
