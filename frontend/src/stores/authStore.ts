import { create } from "zustand";
import type { AuthUser, Permission } from "@tracking-cyd/shared";
import { hasPermission } from "@tracking-cyd/shared";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (user: AuthUser | null) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;
  can: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: "loading",
  setUser: (user) => set({ user, status: user ? "authenticated" : "anonymous" }),
  setStatus: (status) => set({ status }),
  clear: () => set({ user: null, status: "anonymous" }),
  can: (permission) => hasPermission(get().user?.role ?? null, permission),
}));
