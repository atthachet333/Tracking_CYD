/* ============================================================
   Centralized error handler → ApiErrorBody เดียวกันทุก endpoint
   { error: { code, message, details, requestId } }
   - ไม่ส่ง stack trace ออก production
   - ไม่ log credential
   ============================================================ */
import type { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { GoogleSheetsError } from "../integrations/google-sheets/google-sheets.errors";
import { env } from "../config/env";

export class NotFoundError extends Error {
  readonly statusCode = 404;
  readonly code = "NOT_FOUND";
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export function errorHandler(
  error: FastifyError | ZodError | GoogleSheetsError | NotFoundError,
  req: FastifyRequest,
  reply: FastifyReply,
): void {
  const requestId = req.id;

  if (error instanceof ZodError) {
    reply.status(400).send({
      error: { code: "VALIDATION_ERROR", message: "พารามิเตอร์ไม่ถูกต้อง", details: error.issues, requestId },
    });
    return;
  }

  if (error instanceof GoogleSheetsError) {
    // log แบบไม่รวม credential
    req.log.warn({ code: error.code, url: req.url, requestId }, "google sheets error");
    reply.status(error.statusCode).send({
      error: { code: error.code, message: error.message, details: error.details, requestId },
    });
    return;
  }

  if (error instanceof NotFoundError) {
    reply.status(404).send({ error: { code: "NOT_FOUND", message: error.message, details: [], requestId } });
    return;
  }

  const statusCode = typeof (error as FastifyError).statusCode === "number" ? (error as FastifyError).statusCode! : 500;
  req.log.error({ err: error.name, url: req.url, requestId }, "unhandled error");

  reply.status(statusCode).send({
    error: {
      code: statusCode >= 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR",
      message: statusCode >= 500 ? "เกิดข้อผิดพลาดภายในระบบ" : error.message,
      details: env.NODE_ENV === "production" ? [] : [error.message],
      requestId,
    },
  });
}
