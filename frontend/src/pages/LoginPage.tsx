import { useState, type FormEvent } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Eye, EyeOff, LogIn, Loader2, AlertTriangle } from "lucide-react";
import { useLogin, useAuthStatus } from "@/hooks/useAuth";
import { BRAND } from "@/config/brand";
import { ApiError } from "@/services/api-client";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const status = useAuthStatus();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (status === "authenticated") return <Navigate to={from} replace />;

  const expired = new URLSearchParams(location.search).get("expired") === "1";

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    login.mutate({ email, password }, {
      onSuccess: () => navigate(from, { replace: true }),
      onError: (err) => setError(err instanceof ApiError ? err.message : "เข้าสู่ระบบไม่สำเร็จ"),
    });
  };

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-[#0b1220]">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <img src={BRAND.logoPath} alt={BRAND.logoAlt} width={64} height={64} className="h-16 w-16 rounded-2xl bg-white object-contain p-1 shadow-sm ring-1 ring-line/60 dark:ring-slate-700" style={{ aspectRatio: "1 / 1" }} />
          <div>
            <div className="text-lg font-bold tracking-tight">{BRAND.name}</div>
            <div className="text-[13px] text-muted">ระบบสรุปภาพรวมผู้บริหาร</div>
          </div>
        </div>

        <form onSubmit={onSubmit} className="surface-card space-y-4 p-6">
          <h1 className="text-center text-[17px] font-bold">เข้าสู่ระบบ</h1>

          {expired && (
            <div className="flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2 text-[12.5px] text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4 shrink-0" /> เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-[12.5px] text-danger" role="alert">
              <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-[13px] font-semibold">อีเมลหรือชื่อผู้ใช้</label>
            <input id="email" type="text" autoComplete="username" autoFocus required value={email} onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-line bg-white px-3 text-[14px] outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-[#0f1728]" />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-[13px] font-semibold">รหัสผ่าน</label>
            <div className="relative">
              <input id="password" type={show ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="h-10 w-full rounded-lg border border-line bg-white px-3 pr-10 text-[14px] outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-[#0f1728]" />
              <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-surface dark:hover:bg-slate-800">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={login.isPending}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-[14px] font-semibold text-white transition hover:bg-brand-700 disabled:opacity-70">
            {login.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="mt-4 text-center font-num text-[11px] text-slate-400">© 2026 {BRAND.companyName}</div>
      </div>
    </div>
  );
}
