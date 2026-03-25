/** Company association on a user (super-admin list) */
export interface UserCompanyRef {
  companyName: string;
  companyId: string;
  role: string;
}

/** User as returned from super-admin users list */
export interface SuperAdminUserItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profilePicture: string | null;
  companies: UserCompanyRef[];
  lastActivityAt?: string | null;
  inactivityState?: 'active' | 'warning' | 'delete_due' | 'unknown';
}

/** Paginated super-admin users response */
export interface ListSuperAdminUsersResponse {
  items: SuperAdminUserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
