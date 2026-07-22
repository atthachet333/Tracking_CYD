/* ============================================================
   API Client — ห่อ fetch + parse error format มาตรฐาน
   ทุก request ไปที่ /api (Vite proxy → backend :6678)
   ============================================================ */
import type { ApiErrorBody } from "@/types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly requestId?: string;
  constructor(message: string, code: string, statusCode: number, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json", ...(init?.body ? { "Content-Type": "application/json" } : {}) },
    ...init,
  });

  if (!res.ok) {
    let code = `HTTP_${res.status}`;
    let message = `เกิดข้อผิดพลาด (HTTP ${res.status})`;
    let requestId: string | undefined;
    try {
      const body = (await res.json()) as Partial<ApiErrorBody>;
      if (body?.error) {
        code = body.error.code ?? code;
        message = body.error.message ?? message;
        requestId = body.error.requestId;
      }
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(message, code, res.status, requestId);
  }

  return (await res.json()) as T;
}

export const httpGet = <T>(path: string): Promise<T> => request<T>(path);
export const httpPost = <T>(path: string, body?: unknown): Promise<T> =>
  request<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });

/** สร้าง query string จาก object */
export function toQuery(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}
