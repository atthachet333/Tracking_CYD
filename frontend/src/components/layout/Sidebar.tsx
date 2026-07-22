import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";
import { useUiStore } from "@/stores/uiStore";
import { useNotifications } from "@/hooks/useApi";

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen);
  const setMobile = useUiStore((s) => s.setMobileSidebar);

  const { data: notifications } = useNotifications();
  const badges: Record<string, number> = {
    approvals: 0,
    notifications: notifications?.filter((n) => n.unread).length ?? 0,
    over: 0,
  };

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-[55] bg-slate-900/50 lg:hidden" onClick={() => setMobile(false)} />}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex flex-col border-r border-line bg-white transition-all duration-300 dark:border-slate-800 dark:bg-[#111a2e]",
          collapsed ? "w-[76px]" : "w-[264px]",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 border-b border-line/70 px-5 py-4 dark:border-slate-800">
          <div className="header-grad grid h-10 w-10 shrink-0 place-items-center rounded-xl font-num text-[15px] font-extrabold text-white shadow-lg">
            CP
          </div>
          {!collapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <div className="text-[14px] font-bold leading-tight">CHAIYADET</div>
              <div className="font-num text-[10px] tracking-widest text-muted">PROGRESS CO., LTD.</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
          {NAV.map((g) => (
            <div key={g.group}>
              {!collapsed && (
                <div className="px-3 pb-1.5 pt-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g.group}</div>
              )}
              {g.items.map((it) => {
                const Icon = it.icon;
                const badge = it.badgeKey ? badges[it.badgeKey] : 0;
                return (
                  <NavLink
                    key={it.to}
                    to={it.to}
                    end={it.to === "/dashboard" || it.to === "/dashboard/settings"}
                    onClick={() => setMobile(false)}
                    className={({ isActive }) =>
                      cn(
                        "relative mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition",
                        isActive
                          ? "bg-brand-600/10 font-semibold text-brand-600 dark:text-brand-300"
                          : "text-muted hover:bg-surface hover:text-ink dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
                        collapsed && "justify-center",
                      )
                    }
                  >
                    <Icon className="h-[19px] w-[19px] shrink-0" />
                    {!collapsed && <span className="flex-1 truncate">{it.label}</span>}
                    {!collapsed && badge > 0 && (
                      <span className="rounded-full bg-danger px-1.5 py-0.5 font-num text-[10.5px] font-bold text-white">{badge}</span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {!collapsed && (
          <div className="border-t border-line/70 px-5 py-3 font-num text-[11px] text-slate-400 dark:border-slate-800">
            เวอร์ชัน <b className="text-muted">1.0.0</b> · © 2026
          </div>
        )}
      </aside>
    </>
  );
}
