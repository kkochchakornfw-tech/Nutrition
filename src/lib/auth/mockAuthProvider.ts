import type { AuthProvider, AuthUser, LoginError, LoginResult } from "./types";
import { timingSafeStringEqual } from "./rateLimit";

interface MockAccount extends AuthUser {
  password: string;
}

// รายชื่อทดสอบ — จะถูกแทนที่ด้วยการเชื่อมต่อ HIS/AD จริงในอนาคต
const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: 1,
    employeeCode: "10001",
    password: "1234",
    fullName: "สมหญิง ใจดี",
    position: "นักกำหนดอาหาร",
    department: "โภชนาการ",
    role: "assessor",
  },
  {
    id: 2,
    employeeCode: "10002",
    password: "1234",
    fullName: "สมชาย ตั้งใจ",
    position: "นักกำหนดอาหาร",
    department: "โภชนาการ",
    role: "assessor",
  },
  {
    id: 3,
    employeeCode: "admin",
    password: "admin",
    fullName: "ผู้ดูแลระบบ",
    position: "System Admin",
    department: "IT",
    role: "admin",
  },
];

export class MockAuthProvider implements AuthProvider {
  async login(employeeCode: string, password: string): Promise<LoginResult | LoginError> {
    const account = MOCK_ACCOUNTS.find((a) => a.employeeCode === employeeCode.trim());

    // เทียบรหัสผ่านแบบ constant-time เสมอแม้ไม่พบบัญชี (เทียบกับ placeholder) กัน
    // ผู้โจมตีแยกความต่างระหว่าง "ไม่มีบัญชีนี้" กับ "มีบัญชีแต่รหัสผ่านผิด" จากเวลาตอบสนอง
    const passwordMatches = timingSafeStringEqual(account?.password ?? "\0placeholder\0", password);

    if (!account || !passwordMatches) {
      return { ok: false, message: "รหัสพนักงานหรือรหัสผ่านไม่ถูกต้อง" };
    }

    return { ok: true, user: toAuthUser(account) };
  }
}

function toAuthUser(account: MockAccount): AuthUser {
  return {
    id: account.id,
    employeeCode: account.employeeCode,
    fullName: account.fullName,
    position: account.position,
    department: account.department,
    role: account.role,
  };
}

export function listMockAssessors(): AuthUser[] {
  return MOCK_ACCOUNTS.filter((a) => a.role === "assessor").map(toAuthUser);
}
