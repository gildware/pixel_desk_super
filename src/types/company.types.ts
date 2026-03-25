/** Label/value option (e.g. industry, primaryUse) */
export interface LabelValue {
  label: string;
  value: string;
}

/** Creator / company admin (earliest admin UserCompany) */
export interface CompanyCreatedBy {
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string | null;
}

/** Company as returned from list or get-one (minimal or full) */
export interface Company {
  id: string;
  company_name?: string;
  companyName?: string;
  industry?: string | LabelValue;
  primaryUse?: string | LabelValue;
  companyLogo?: string | null;
  timeZone?: string;
  status?: string;
  lastActivityAt?: string | null;
  inactivityState?: 'active' | 'warning' | 'delete_due' | 'unknown';
  totalProject?: number;
  totalClient?: number;
  totalEmployee?: number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  createdBy?: CompanyCreatedBy;
  userCompanies?: { id: string; userId?: string; role?: string }[];
  projects?: { id: string; name?: string }[];
  clients?: { id: string; name?: string }[];
}

/** List companies response */
export interface ListCompaniesResponse {
  items: Company[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Company usage stats */
export interface CompanyUsageResponse {
  companyId: string;
  companyName: string;
  usage: {
    users: number;
    projects: number;
    clients: number;
    tasks: number;
    files: number;
    storageBytes: number;
  };
}

/** Body for PATCH update company (all optional) */
export interface UpdateCompanyBody {
  company_name?: string;
  industry?: string;
  primaryUse?: string;
  timeZone?: string;
  status?: string;
}

/** Delete company response */
export interface DeleteCompanyResponse {
  companyId: string;
  message?: string;
}

/** Paginated list response (generic) */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Company employee (UserCompany with user) */
export interface CompanyEmployeeItem {
  id: string;
  userId: string;
  companyId: string;
  topLevelRole: "employee";
  isDeactivated: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    profilePicture: string | null;
    status: string;
  } | null;
}

/** Company client */
export interface CompanyClientItem {
  id: string;
  companyId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  companyName: string | null;
  clientLogo: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  isPending: boolean;
  createdAt: string;
}

/** Company project */
export interface CompanyProjectItem {
  id: string;
  companyId: string;
  projectName: string;
  customProjectId: string | null;
  projectKey: string | null;
  projectStatus: string;
  projectType: string | null;
  clientId: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}
