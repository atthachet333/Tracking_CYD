import { Menu, Search, Sun, Moon, Maximize, Bell, Calendar } from "lucide-react";
import { useUiStore } from "@/stores/uiStore";
import { useNotifications } from "@/hooks/useApi";
import { cn } from "@/lib/utils";

export function Header() {
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setMobile = useUiStore((s) => s.setMobileSidebar);
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen);
  const setCmdk = useUiStore((s) => s.setCmdk);
  const { data: notifications } = useNotifications();
  const unread = notifications?.filter((n) => n.unread).length ?? 0;

  const onMenu = () => {
    if (window.matchMedia("(max-width:1023px)").matches) setMobile(!mobileOpen);
    else toggleSidebar();
  };

  const fullscreen = () => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.();
    else void document.exitFullscreen?.();
  };

  const HBtn = ({ children, onClick, label }: { children: React.ReactNode; onClick?: () => void; label: string }) => (
    <button aria-label={label} title={label} onClick={onClick} className="relative grid h-9 w-9 place-items-center rounded-lg text-white/90 transition hover:bg-white/15">
      {children}
    </button>
  );

  return (
    <header className="header-grad sticky top-0 z-50 flex h-16 items-center gap-3.5 px-5 text-white shadow-lg">
      <HBtn onClick={onMenu} label="เมนู">
        <Menu className="h-[19px] w-[19px]" />
      </HBtn>

      <button
        onClick={() => setCmdk(true)}
        className="hidden h-10 max-w-[540px] flex-1 items-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-3.5 text-left text-[13.5px] text-white/70 transition hover:bg-white/20 sm:flex"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1">ค้นหาพนักงาน, ลูกค้า, Case No., เอกสาร, SLA...</span>
        <kbd className="rounded bg-white/20 px-1.5 py-0.5 font-num text-[10.5px]">Ctrl / ⌘ K</kbd>
      </button>

      <div className="flex-1 sm:hidden" />

      <div className="hidden items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-[12.5px] md:flex">
        <Calendar className="h-4 w-4" />
        <span>21 ก.ค. 2569 – 21 ส.ค. 2569</span>
      </div>

      <HBtn onClick={() => setCmdk(true)} label="ค้นหา">
        <Search className="h-[19px] w-[19px] sm:hidden" />
      </HBtn>
      <HBtn onClick={toggleTheme} label="สลับธีม">
        {theme === "dark" ? <Sun className="h-[19px] w-[19px]" /> : <Moon className="h-[19px] w-[19px]" />}
      </HBtn>
      <HBtn onClick={fullscreen} label="เต็มจอ">
        <Maximize className="h-[19px] w-[19px]" />
      </HBtn>
      <HBtn label="การแจ้งเตือน">
        <Bell className="h-[19px] w-[19px]" />
        {unread > 0 && (
          <span className={cn("absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 font-num text-[9.5px] font-bold")}>
            {unread}
          </span>
        )}
      </HBtn>

      <div className="flex items-center gap-2.5 rounded-xl py-0.5 pl-1 pr-1.5">
        <div className="hidden text-right leading-tight md:block">
          <div className="text-[13px] font-semibold">Administrator</div>
          <div className="text-[11px] text-white/80">ผู้ดูแลระบบ</div>
        </div>
        <img src="https://i.pravatar.cc/80?img=12" alt="ผู้ใช้" className="h-9 w-9 rounded-xl border-2 border-white/30 object-cover" />
      </div>
    </header>
  );
}
