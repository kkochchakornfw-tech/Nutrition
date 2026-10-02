export type UserRole = "admin" | "assessor" | "viewer";

export interface AuthUser {
  id: number;
  employeeCode: string;
  fullName: string;
  position: string | null;
  department: string | null;
  role: UserRole;
}

export interface LoginResult {
  ok: true;
  user: AuthUser;
}

export interface LoginError {
  ok: false;
  message: string;
}

/**
 * Abstract auth boundary. Swap MockAuthProvider for a real HIS/AD-backed
 * implementation later without touching login route, session, or UI code.
 */
export interface AuthProvider {
  login(employeeCode: string, password: string): Promise<LoginResult | LoginError>;
}
