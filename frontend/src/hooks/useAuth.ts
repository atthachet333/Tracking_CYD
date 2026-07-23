import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/services/auth-api";
import { useAuthStore } from "@/stores/authStore";
import type { Permission } from "@tracking-cyd/shared";

/** โหลดผู้ใช้ปัจจุบันจาก /api/auth/me ครั้งเดียวตอน mount app */
export function useBootstrapAuth() {
  const setUser = useAuthStore((s) => s.setUser);
  const setStatus = useAuthStore((s) => s.setStatus);
  useEffect(() => {
    let alive = true;
    setStatus("loading");
    authApi.me()
      .then((r) => { if (alive) setUser(r.user); })
      .catch(() => { if (alive) setUser(null); });
    return () => { alive = false; };
  }, [setUser, setStatus]);
}

export const useCurrentUser = () => useAuthStore((s) => s.user);
export const useAuthStatus = () => useAuthStore((s) => s.status);
export const usePermission = (permission: Permission) => useAuthStore((s) => s.can(permission));

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => authApi.login(email, password),
    onSuccess: (r) => setUser(r.user),
  });
}

export function useLogout() {
  const clear = useAuthStore((s) => s.clear);
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => clear(),
  });
}
