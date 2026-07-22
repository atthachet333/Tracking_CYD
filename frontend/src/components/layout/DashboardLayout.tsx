import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useUiStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className={cn("min-w-0 transition-all duration-300", collapsed ? "lg:ml-[76px]" : "lg:ml-[264px]")}>
        <Header />
        <main className="mx-auto max-w-[1600px] px-4 pb-16 pt-6 sm:px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
