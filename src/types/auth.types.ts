export interface SessionUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
  isGlobalSuperAdmin?: boolean;
}

export interface Session {
  user: SessionUser;
  expiresAt?: string;
}

export interface RequestOtpResponse {
  success?: boolean;
  message?: string;
}

export interface VerifyOtpResponse {
  success?: boolean;
  user?: SessionUser;
  message?: string;
}
