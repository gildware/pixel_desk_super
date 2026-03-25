const RAW_API_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")
    : "";

const USE_PROXY =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_API_PROXY === "true" &&
  RAW_API_URL.startsWith("http");

const API_BASE = USE_PROXY ? "/api/proxy" : RAW_API_URL;

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
    dashboardStats: `${API_BASE}/super-admin/dashboard/stats`,
    users: `${API_BASE}/super-admin/users`,
    userById: (userId: string) => `${API_BASE}/super-admin/users/${userId}`,
    companies: `${API_BASE}/super-admin/companies`,
    companyById: (id: string) => `${API_BASE}/super-admin/companies/${id}`,
    companyUsage: (id: string) => `${API_BASE}/super-admin/companies/${id}/usage`,
    companyEmployees: (id: string) => `${API_BASE}/super-admin/companies/${id}/employees`,
    companyClients: (id: string) => `${API_BASE}/super-admin/companies/${id}/clients`,
    companyProjects: (id: string) => `${API_BASE}/super-admin/companies/${id}/projects`,
    inactivitySettings: `${API_BASE}/super-admin/settings/inactivity`,
    companyInactivityManualEmail: (id: string) =>
      `${API_BASE}/super-admin/companies/${id}/inactivity/manual-email`,
  },
} as const;
