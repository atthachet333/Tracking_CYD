import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { Permission } from "@tracking-cyd/shared";
import { useAuthStatus, usePermission } from "@/hooks/useAuth";

function FullscreenLoader() {
  return (
    <div className="grid min-h-screen place-items-center text-muted">
      <Loader2 className="h-7 w-7 animate-spin" />
    </div>
  );
}

/** ต้องล็อกอินก่อนจึงเข้า dashboard ได้ */
export function ProtectedRoute() {
  const status = useAuthStatus();
  const location = useLocation();
  if (status === "loading") return <FullscreenLoader />;
  if (status === "anonymous") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** ต้องมี permission จึงเข้า route ได้ (ไม่งั้น → /403) */
export function RequirePermission({ permission }: { permission: Permission }) {
  const status = useAuthStatus();
  const allowed = usePermission(permission);
  if (status === "loading") return <FullscreenLoader />;
  if (status === "anonymous") return <Navigate to="/login" replace />;
  if (!allowed) return <Navigate to="/403" replace />;
  return <Outlet />;
}

/** ซ่อน/แสดง element ตาม permission (UX เท่านั้น — backend ยังตรวจจริง) */
export function PermissionGuard({ permission, children, fallback = null }: { permission: Permission; children: ReactNode; fallback?: ReactNode }) {
  const allowed = usePermission(permission);
  return <>{allowed ? children : fallback}</>;
}
