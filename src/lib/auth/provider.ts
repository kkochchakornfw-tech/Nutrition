// import type { AuthProvider } from "./types";
// import { HisAuthProvider } from "./hisAuthProvider";
// import { MockAuthProvider } from "./mockAuthProvider";

// export function getAuthProvider(): AuthProvider {
//   return process.env.AUTH_PROVIDER === "his"
//     ? new HisAuthProvider()
//     : new MockAuthProvider();
// }
import type { AuthProvider, LoginError, LoginResult } from "./types";
import { HisAuthProvider } from "./hisAuthProvider";
import { MockAuthProvider } from "./mockAuthProvider";

// ลอง mock ก่อน ไม่ผ่านค่อยไป HIS — ใช้ช่วงพัฒนาเท่านั้น
class MockThenHisProvider implements AuthProvider {
  private mock = new MockAuthProvider();
  private his = new HisAuthProvider();

  async login(code: string, pw: string): Promise<LoginResult | LoginError> {
    const r = await this.mock.login(code, pw);
    return r.ok ? r : this.his.login(code, pw);
  }
}

export function getAuthProvider(): AuthProvider {
  const mode = process.env.AUTH_PROVIDER;
  if (mode === "his") return new HisAuthProvider();
  if (mode === "mock+his") return new MockThenHisProvider();
  return new MockAuthProvider();
}
