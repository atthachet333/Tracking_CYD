import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppRoutes } from "@/routes/AppRoutes";
import { Toaster } from "@/components/ui/Toaster";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { useUiStore } from "@/stores/uiStore";
import { useBootstrapAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/stores/authStore";

export default function App() {
  const setCmdk = useUiStore((s) => s.setCmdk);
  const navigate = useNavigate();

  // โหลดผู้ใช้ปัจจุบันจาก /api/auth/me ตอนเปิดแอป
  useBootstrapAuth();

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

  // session หมดอายุ/ยังไม่ล็อกอิน (API คืน 401) → เคลียร์ auth + กลับ login
  useEffect(() => {
    const onUnauthorized = () => {
      const { status, clear } = useAuthStore.getState();
      clear();
      if (status === "authenticated") navigate("/login?expired=1", { replace: true });
      else if (!window.location.pathname.startsWith("/login")) navigate("/login", { replace: true });
    };
    window.addEventListener("auth:unauthorized", onUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", onUnauthorized);
  }, [navigate]);

  return (
    <>
      <AppRoutes />
      <Toaster />
      <CommandPalette />
    </>
  );
}
