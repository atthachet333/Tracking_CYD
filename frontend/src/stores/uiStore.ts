import { create } from "zustand";

export interface Toast {
  id: number;
  title: string;
  desc: string;
  type: "success" | "warn" | "error" | "info";
}

interface UiState {
  theme: "light" | "dark";
  sidebarCollapsed: boolean;
  mobileSidebarOpen: boolean;
  cmdkOpen: boolean;
  toasts: Toast[];
  toggleTheme: () => void;
  toggleSidebar: () => void;
  setMobileSidebar: (open: boolean) => void;
  setCmdk: (open: boolean) => void;
  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 0;

export const useUiStore = create<UiState>((set) => ({
  theme: "light",
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  cmdkOpen: false,
  toasts: [],
  toggleTheme: () =>
    set((s) => {
      const theme = s.theme === "light" ? "dark" : "light";
      document.documentElement.classList.toggle("dark", theme === "dark");
      return { theme };
    }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileSidebar: (open) => set({ mobileSidebarOpen: open }),
  setCmdk: (open) => set({ cmdkOpen: open }),
  pushToast: (t) =>
    set((s) => {
      const id = ++toastSeq;
      setTimeout(() => useUiStore.getState().dismissToast(id), 3400);
      return { toasts: [...s.toasts, { ...t, id }] };
    }),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));
