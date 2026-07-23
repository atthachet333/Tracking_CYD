import { useNavigate } from "react-router-dom";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/primitives";

export function ForbiddenPage() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 text-center">
      <div>
        <ShieldX className="mx-auto mb-3 h-16 w-16 text-danger/70" strokeWidth={1.5} />
        <h1 className="text-xl font-bold">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-muted">หน้านี้สำหรับผู้ดูแลระบบเท่านั้น</p>
        <div className="mt-5">
          <Button variant="primary" onClick={() => navigate("/dashboard")}>กลับหน้าหลัก</Button>
        </div>
      </div>
    </div>
  );
}
