import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";
import { PERMISSIONS, hasPermission } from "@tracking-cyd/shared";
import { FIXED_USERS } from "./user.store";

it("มีบัญชีระบบตามที่กำหนด", () => {
  expect(FIXED_USERS).toEqual({
    admin: { username: "admin", password: "admin1234" },
    executive: { username: "executive", password: "cyd12345" },
  });
});

describe("password hashing (bcrypt)", () => {
  it("hash ไม่ใช่ plain text และ verify ได้", () => {
    const hash = hashPassword("s3cret-pass");
    expect(hash).not.toBe("s3cret-pass");
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt prefix
    expect(verifyPassword("s3cret-pass", hash)).toBe(true);
    expect(verifyPassword("wrong", hash)).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
  });
});

describe("permission matrix (RBAC)", () => {
  it("executive อ่าน/ส่งออกได้ แต่ห้าม write/settings/audit", () => {
    expect(hasPermission("executive", "dashboardRead")).toBe(true);
    expect(hasPermission("executive", "exportData")).toBe(true);
    expect(hasPermission("executive", "reportRead")).toBe(true);
    expect(hasPermission("executive", "syncExecute")).toBe(false);
    expect(hasPermission("executive", "rebuildExecute")).toBe(false);
    expect(hasPermission("executive", "googleSheetsWrite")).toBe(false);
    expect(hasPermission("executive", "settingsManage")).toBe(false);
    expect(hasPermission("executive", "integrationManage")).toBe(false);
    expect(hasPermission("executive", "auditRead")).toBe(false);
    expect(hasPermission("executive", "userManage")).toBe(false);
  });
  it("admin ทำได้ทุกอย่าง", () => {
    for (const p of Object.keys(PERMISSIONS) as (keyof typeof PERMISSIONS)[]) {
      expect(hasPermission("admin", p)).toBe(true);
    }
  });
  it("null role ไม่มีสิทธิ์", () => {
    expect(hasPermission(null, "dashboardRead")).toBe(false);
  });
});
