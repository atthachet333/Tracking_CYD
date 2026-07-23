/* ============================================================
   Auth API — /api/auth/* (session cookie)
   ============================================================ */
import { httpGet, httpPost } from "./api-client";
import type { AuthUser, LoginResponse } from "@tracking-cyd/shared";

export const authApi = {
  login: (email: string, password: string) => httpPost<LoginResponse>("/auth/login", { email, password }),
  logout: () => httpPost<{ ok: true }>("/auth/logout"),
  me: () => httpGet<{ user: AuthUser }>("/auth/me"),
};
