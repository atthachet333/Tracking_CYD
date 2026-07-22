import { useEffect } from "react";
import { AppRoutes } from "@/routes/AppRoutes";
import { Toaster } from "@/components/ui/Toaster";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useUiStore } from "@/stores/uiStore";

export default function App() {
  const setCmdk = useUiStore((s) => s.setCmdk);

  // คีย์ลัดระดับแอป: Ctrl/Cmd + K เปิด Command Palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdk(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setCmdk]);

  return (
    <>
      <AppRoutes />
      <Toaster />
      <CommandPalette />
    </>
  );
}
