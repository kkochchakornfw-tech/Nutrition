import "server-only";
import crypto from "crypto";
import { hisPool } from "@/lib/his/his-db";
import type {
  AuthProvider,
  AuthUser,
  LoginError,
  LoginResult,
  UserRole,
} from "./types";
import { timingSafeStringEqual } from "./rateLimit";

interface EmployeeRow {
  employee_id: string;
  prename: string | null;
  firstname: string | null;
  lastname: string | null;
  password: string | null;
  active: string | null;
  base_med_department_id: string | null;
}

const INVALID: LoginError = {
  ok: false,
  message: "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง",
};

const md5 = (s: string) => crypto.createHash("md5").update(s).digest("hex");

// ⚠️ เช็คค่าจริงก่อน: SELECT DISTINCT active FROM employee;
function isActive(v: string | null): boolean {
  return v === "1" || v === "Y" || v === "t" || v === "true";
}

const envList = (name: string) =>
  (process.env[name] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

// HIS ไม่มี role ของระบบนี้ → กำหนดจาก env ไปก่อน
function resolveRole(employeeCode: string): UserRole {
  if (envList("ADMIN_EMPLOYEE_CODES").includes(employeeCode)) return "admin";
  if (envList("ASSESSOR_EMPLOYEE_CODES").includes(employeeCode))
    return "assessor";
  return "viewer";
}

export class HisAuthProvider implements AuthProvider {
  async login(
    employeeCode: string,
    password: string,
  ): Promise<LoginResult | LoginError> {
    let emp: EmployeeRow | undefined;
    try {
      const { rows } = await hisPool.query<EmployeeRow>(
        `SELECT employee_id::text AS employee_id, prename, firstname, lastname, password,
                active::text AS active, base_med_department_id::text AS base_med_department_id
         FROM employee
         WHERE employee_id = $1
         LIMIT 1`,
        [employeeCode.trim()],
      );
      emp = rows[0];
    } catch (err) {
      console.error("[auth] HIS query failed:", err);
      return {
        ok: false,
        message: "เชื่อมต่อระบบยืนยันตัวตนไม่ได้ กรุณาลองใหม่",
      };
    }

    // เทียบเสมอแม้ไม่พบบัญชี กันแยก "ไม่มีบัญชี" กับ "รหัสผิด" จากเวลาตอบสนอง (แบบเดียวกับ mock)
    const stored = emp?.password?.trim().toLowerCase() ?? "\0placeholder\0";
    const passwordMatches = timingSafeStringEqual(stored, md5(password));

    if (!emp || !passwordMatches) return INVALID;
    if (!isActive(emp.active))
      return { ok: false, message: "บัญชีนี้ถูกระงับการใช้งาน" };

    const id = Number(emp.employee_id);
    if (!Number.isSafeInteger(id)) {
      console.error(`[auth] employee_id ไม่ใช่ตัวเลข: ${emp.employee_id}`);
      return { ok: false, message: "บัญชีนี้ใช้กับระบบไม่ได้ กรุณาติดต่อ IT" };
    }

    const user: AuthUser = {
      id,
      employeeCode: emp.employee_id,
      fullName:
        [emp.prename, emp.firstname, emp.lastname]
          .filter(Boolean)
          .join(" ")
          .trim() || `Employee ${emp.employee_id}`,
      position: null,
      department: emp.base_med_department_id,
      role: resolveRole(emp.employee_id),
    };

    return { ok: true, user };
  }
}
