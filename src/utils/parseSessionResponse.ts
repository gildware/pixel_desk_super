import type { Session, SessionUser } from "@/src/types/auth.types";

type SessionApiPayload = {
  status?: string;
  data?: {
    user?: SessionUser;
    isGlobalSuperAdmin?: boolean;
  };
  user?: SessionUser;
};

/** Normalize /auth/session API payload (handles company + super-admin shapes). */
export function parseSessionResponse(data: SessionApiPayload | null): Session | null {
  if (!data) return null;
  const payload = data.data;
  const rawUser = payload?.user ?? data.user;
  if (!rawUser?.id || !rawUser?.email) return null;

  const isGlobalSuperAdmin =
    rawUser.isGlobalSuperAdmin === true || payload?.isGlobalSuperAdmin === true;

  const user: SessionUser = {
    ...rawUser,
    isGlobalSuperAdmin,
  };
  return { user };
}
