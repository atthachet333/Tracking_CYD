/* ============================================================
   Sheets Controller — endpoint /api/sheets/*
   Controller เรียก Service เท่านั้น (ไม่แตะ Google API ตรง ๆ)
   ============================================================ */
import type { FastifyRequest } from "fastify";
import { sheetRowsQuerySchema } from "../schemas/index";
import { googleSheetsService } from "../integrations/google-sheets/google-sheets.service";

export const sheetsController = {
  status() {
    return googleSheetsService.getStatus();
  },
  metadata() {
    return googleSheetsService.getMetadata();
  },
  headers() {
    return googleSheetsService.getHeaders();
  },
  rows(req: FastifyRequest) {
    const q = sheetRowsQuerySchema.parse(req.query);
    return googleSheetsService.getRows({
      page: q.page,
      pageSize: q.pageSize,
      search: q.search,
      sortBy: q.sortBy,
      sortOrder: q.sortOrder,
    });
  },
  refresh() {
    return googleSheetsService.refresh();
  },
};
