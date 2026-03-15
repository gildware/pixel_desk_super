/** Company as returned from list or get-one (minimal or full) */
export interface Company {
  id: string;
  company_name?: string;
  companyName?: string;
  industry?: string;
  primaryUse?: string;
  timeZone?: string;
  status?: string;
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
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
  slug?: string;
}

/** Delete company response */
export interface DeleteCompanyResponse {
  companyId: string;
  message?: string;
}
