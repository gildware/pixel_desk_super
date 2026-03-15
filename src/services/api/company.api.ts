import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type {
  Company,
  ListCompaniesResponse,
  CompanyUsageResponse,
  UpdateCompanyBody,
  DeleteCompanyResponse,
  PaginatedResponse,
  CompanyEmployeeItem,
  CompanyClientItem,
  CompanyProjectItem,
} from "@/src/types/company.types";

export interface ListCompaniesParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListCompanySubResourceParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * 1. List all companies (paginated, optional search)
 * GET /super-admin/companies
 */
export async function listCompanies(
  params: ListCompaniesParams = {}
): Promise<ListCompaniesResponse> {
  const { page = 1, limit = 20, search } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(Math.min(limit, 100)));
  if (search?.trim()) searchParams.set("search", search.trim());
  const url = `${apiConfig.superAdmin.companies}?${searchParams.toString()}`;
  const res = await apiClient.get<{
    data?: {
      items?: Company[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    };
  }>(url);
  const data = res?.data;
  const list = Array.isArray(data?.items) ? data.items : [];
  const total = typeof data?.total === "number" ? data.total : list.length;
  const totalPages = typeof data?.totalPages === "number" ? data.totalPages : 1;
  return {
    items: list,
    total,
    page: typeof data?.page === "number" ? data.page : page,
    limit: typeof data?.limit === "number" ? data.limit : limit,
    totalPages,
  };
}

/**
 * 2. Get one company (full details: users, projects, clients)
 * GET /super-admin/companies/:companyId
 */
export async function getCompany(companyId: string): Promise<Company> {
  const res = await apiClient.get<{ data?: Company } | Company>(
    apiConfig.superAdmin.companyById(companyId)
  );
  return (res && "data" in res && res.data != null ? res.data : res) as Company;
}

/**
 * 3. Company usage (counts + storage)
 * GET /super-admin/companies/:companyId/usage
 */
export async function getCompanyUsage(
  companyId: string
): Promise<CompanyUsageResponse> {
  const res = await apiClient.get<{
    data?: {
      companyId?: string;
      companyName?: string;
      usage?: {
        users?: number;
        projects?: number;
        clients?: number;
        tasks?: number;
        files?: number;
        storageBytes?: number;
      };
      users?: number;
      projects?: number;
      clients?: number;
      tasks?: number;
      files?: number;
      storageBytes?: number;
    };
  }>(apiConfig.superAdmin.companyUsage(companyId));
  const data = ((res && "data" in res) ? res.data : res) ?? {};
  const raw: Record<string, unknown> =
    data && typeof data === "object" && "usage" in data && data.usage != null
      ? (data.usage as Record<string, unknown>)
      : (data as Record<string, unknown>);
  const n = (key: string) => (typeof raw[key] === "number" ? (raw[key] as number) : 0);
  const usage = {
    users: n("users"),
    projects: n("projects"),
    clients: n("clients"),
    tasks: n("tasks"),
    files: n("files"),
    storageBytes: n("storageBytes"),
  };
  const dataObj = data as Record<string, unknown>;
  return {
    companyId: typeof dataObj?.companyId === "string" ? dataObj.companyId : companyId,
    companyName: typeof dataObj?.companyName === "string" ? dataObj.companyName : "",
    usage,
  };
}

/**
 * 4. Update company
 * PATCH /super-admin/companies/:companyId
 */
export async function updateCompany(
  companyId: string,
  body: UpdateCompanyBody
): Promise<Company> {
  return apiClient.patch<Company>(
    apiConfig.superAdmin.companyById(companyId),
    body
  );
}

/**
 * 5. Delete company (and all related data)
 * DELETE /super-admin/companies/:companyId
 */
export async function deleteCompany(
  companyId: string
): Promise<DeleteCompanyResponse> {
  return apiClient.delete<DeleteCompanyResponse>(
    apiConfig.superAdmin.companyById(companyId)
  );
}

function paginatedList<T>(
  data: unknown,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const obj = data && typeof data === "object" && "data" in (data as object) ? (data as { data?: unknown }).data : data;
  const d = obj && typeof obj === "object" ? (obj as Record<string, unknown>) : {};
  const items = Array.isArray(d.items) ? (d.items as T[]) : [];
  const total = typeof d.total === "number" ? d.total : items.length;
  const totalPages = typeof d.totalPages === "number" ? d.totalPages : Math.ceil(total / limit) || 1;
  return {
    items,
    total,
    page: typeof d.page === "number" ? d.page : page,
    limit: typeof d.limit === "number" ? d.limit : limit,
    totalPages,
  };
}

/**
 * List company employees (paginated, optional search)
 * GET /super-admin/companies/:companyId/employees
 */
export async function listCompanyEmployees(
  companyId: string,
  params: ListCompanySubResourceParams = {}
): Promise<PaginatedResponse<CompanyEmployeeItem>> {
  const { page = 1, limit = 20, search } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(Math.min(limit, 100)));
  if (search?.trim()) searchParams.set("search", search.trim());
  const url = `${apiConfig.superAdmin.companyEmployees(companyId)}?${searchParams.toString()}`;
  const res = await apiClient.get<{ data?: unknown } | unknown>(url);
  const data = res && typeof res === "object" && "data" in res ? (res as { data?: unknown }).data : res;
  return paginatedList<CompanyEmployeeItem>(data ?? res, page, limit);
}

/**
 * List company clients (paginated, optional search)
 * GET /super-admin/companies/:companyId/clients
 */
export async function listCompanyClients(
  companyId: string,
  params: ListCompanySubResourceParams = {}
): Promise<PaginatedResponse<CompanyClientItem>> {
  const { page = 1, limit = 20, search } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(Math.min(limit, 100)));
  if (search?.trim()) searchParams.set("search", search.trim());
  const url = `${apiConfig.superAdmin.companyClients(companyId)}?${searchParams.toString()}`;
  const res = await apiClient.get<{ data?: unknown } | unknown>(url);
  const data = res && typeof res === "object" && "data" in res ? (res as { data?: unknown }).data : res;
  return paginatedList<CompanyClientItem>(data ?? res, page, limit);
}

/**
 * List company projects (paginated, optional search)
 * GET /super-admin/companies/:companyId/projects
 */
export async function listCompanyProjects(
  companyId: string,
  params: ListCompanySubResourceParams = {}
): Promise<PaginatedResponse<CompanyProjectItem>> {
  const { page = 1, limit = 20, search } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(Math.min(limit, 100)));
  if (search?.trim()) searchParams.set("search", search.trim());
  const url = `${apiConfig.superAdmin.companyProjects(companyId)}?${searchParams.toString()}`;
  const res = await apiClient.get<{ data?: unknown } | unknown>(url);
  const data = res && typeof res === "object" && "data" in res ? (res as { data?: unknown }).data : res;
  return paginatedList<CompanyProjectItem>(data ?? res, page, limit);
}
