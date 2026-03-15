const API_BASE =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
    : "";

export const apiConfig = {
  baseUrl: API_BASE,
  auth: {
    requestOtp: `${API_BASE}/auth/request-otp`,
    verifyOtp: `${API_BASE}/auth/verify-otp`,
    logout: `${API_BASE}/auth/logout`,
    session: `${API_BASE}/auth/session`,
  },
  user: {
    me: `${API_BASE}/user/me`,
  },
  superAdmin: {
    companies: `${API_BASE}/super-admin/companies`,
    companyById: (id: string) => `${API_BASE}/super-admin/companies/${id}`,
    companyUsage: (id: string) => `${API_BASE}/super-admin/companies/${id}/usage`,
  },
} as const;
