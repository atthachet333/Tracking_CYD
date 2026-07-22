/* Sync Controller — เรียก service เท่านั้น */
import { syncService } from "./sync.service";
import { summaryService } from "./summary.service";

export const syncController = {
  status() {
    return syncService.getConnectionStatus();
  },
  syncPKim() {
    return syncService.syncAdminPKim();
  },
  syncAdminSource(slug: string) {
    return syncService.syncAdminSource(slug);
  },
  syncAdminAll() {
    return syncService.syncAdminAll();
  },
  /** GET: คำนวณสรุปยอดจาก Sheet 2 (ไม่เขียนกลับ) */
  summary() {
    return summaryService.getSummary(false);
  },
  /** POST: คำนวณ + เขียนตารางสรุปลงแท็บ SUMMARY ของ Sheet 1 */
  rebuildSummary() {
    return summaryService.getSummary(true);
  },
};
