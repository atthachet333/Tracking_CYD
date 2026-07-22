/* Compatibility shim — ใช้ dashboard-api เป็นหลัก
   (คงไว้เพื่อความเข้ากันได้กับโค้ดเดิมที่ import { api }) */
export { dashboardApi as api } from "./dashboard-api";
export type { ListParams } from "./dashboard-api";
