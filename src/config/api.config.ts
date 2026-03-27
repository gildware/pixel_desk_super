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
    me: `${API_BASE}/users/me`,
  },
  fileUpload: `${API_BASE}/file-upload`,
  superAdmin: {
    dashboardStats: `${API_BASE}/super-admin/dashboard/stats`,
    users: `${API_BASE}/super-admin/users`,
    userById: (userId: string) => `${API_BASE}/super-admin/users/${userId}`,
    notifications: `${API_BASE}/super-admin/notifications`,
    notificationsUnreadCount: `${API_BASE}/super-admin/notifications/unread-count`,
    notificationsMarkAllRead: `${API_BASE}/super-admin/notifications/mark-all-read`,
    notificationRead: (id: string) => `${API_BASE}/super-admin/notifications/${id}/read`,
    companies: `${API_BASE}/super-admin/companies`,
    companyById: (id: string) => `${API_BASE}/super-admin/companies/${id}`,
    companyUsage: (id: string) => `${API_BASE}/super-admin/companies/${id}/usage`,
    companyEmployees: (id: string) => `${API_BASE}/super-admin/companies/${id}/employees`,
    companyClients: (id: string) => `${API_BASE}/super-admin/companies/${id}/clients`,
    companyProjects: (id: string) => `${API_BASE}/super-admin/companies/${id}/projects`,
    inactivitySettings: `${API_BASE}/super-admin/settings/inactivity`,
    companyInactivityManualEmail: (id: string) =>
      `${API_BASE}/super-admin/companies/${id}/inactivity/manual-email`,
    platformDefaultsOverview: `${API_BASE}/super-admin/platform-defaults/overview`,
    platformDefaultsBootstrap: `${API_BASE}/super-admin/platform-defaults/bootstrap`,
    platformDefaultDepartments: `${API_BASE}/super-admin/platform-defaults/departments`,
    platformDefaultDepartment: (id: string) =>
      `${API_BASE}/super-admin/platform-defaults/departments/${id}`,
    platformDefaultDesignations: `${API_BASE}/super-admin/platform-defaults/designations`,
    platformDefaultDesignation: (id: string) =>
      `${API_BASE}/super-admin/platform-defaults/designations/${id}`,
    platformDefaultEmployeeCategories: `${API_BASE}/super-admin/platform-defaults/employee-categories`,
    platformDefaultEmployeeCategory: (id: string) =>
      `${API_BASE}/super-admin/platform-defaults/employee-categories/${id}`,
    platformDefaultActivityTypes: `${API_BASE}/super-admin/platform-defaults/activity-types`,
    platformDefaultActivityType: (id: string) =>
      `${API_BASE}/super-admin/platform-defaults/activity-types/${id}`,
    platformDefaultLeaveTypes: `${API_BASE}/super-admin/platform-defaults/leave-types`,
    platformDefaultLeaveType: (id: string) =>
      `${API_BASE}/super-admin/platform-defaults/leave-types/${id}`,
    platformCatalogIndustries: `${API_BASE}/super-admin/platform-catalog/industries`,
    platformCatalogIndustry: (id: string) =>
      `${API_BASE}/super-admin/platform-catalog/industries/${id}`,
    platformCatalogIndustryProjectTypes: (industryId: string) =>
      `${API_BASE}/super-admin/platform-catalog/industries/${industryId}/project-types`,
    platformCatalogIndustryProjectType: (id: string) =>
      `${API_BASE}/super-admin/platform-catalog/industry-project-types/${id}`,
    platformCatalogDashboardUses: `${API_BASE}/super-admin/platform-catalog/dashboard-uses`,
    platformCatalogDashboardUse: (id: string) =>
      `${API_BASE}/super-admin/platform-catalog/dashboard-uses/${id}`,
    platformCatalogSkillCategories: `${API_BASE}/super-admin/platform-catalog/skill-categories`,
    platformCatalogSkillCategory: (id: string) =>
      `${API_BASE}/super-admin/platform-catalog/skill-categories/${id}`,
    platformCatalogCategorySkills: (categoryId: string) =>
      `${API_BASE}/super-admin/platform-catalog/skill-categories/${categoryId}/skills`,
    platformCatalogSkill: (id: string) =>
      `${API_BASE}/super-admin/platform-catalog/skills/${id}`,
    // Default company roles (Client/Member/Super Admin) - permission management
    companyDefaultRoles: `${API_BASE}/super-admin/company-defaults/roles`,
    companyDefaultRolePermissions: (roleId: number) =>
      `${API_BASE}/super-admin/company-defaults/roles/${roleId}/permissions`,
    updateCompanyDefaultRolePermissions: `${API_BASE}/super-admin/company-defaults/roles/permissions`,
    orphanData: {
      files: `${API_BASE}/super-admin/orphan-data/files`,
      filesDelete: `${API_BASE}/super-admin/orphan-data/files/delete`,
      users: `${API_BASE}/super-admin/orphan-data/users`,
      usersDelete: `${API_BASE}/super-admin/orphan-data/users/delete`,
      memberships: `${API_BASE}/super-admin/orphan-data/memberships`,
      membershipsDelete: `${API_BASE}/super-admin/orphan-data/memberships/delete`,
      employees: `${API_BASE}/super-admin/orphan-data/employees`,
      employeesDelete: `${API_BASE}/super-admin/orphan-data/employees/delete`,
      clients: `${API_BASE}/super-admin/orphan-data/clients`,
      clientsDelete: `${API_BASE}/super-admin/orphan-data/clients/delete`,
      projects: `${API_BASE}/super-admin/orphan-data/projects`,
      projectsDelete: `${API_BASE}/super-admin/orphan-data/projects/delete`,
    },
  },
} as const;
