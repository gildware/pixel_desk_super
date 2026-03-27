export interface OrphanFileUploadItem {
  id: string;
  url: string;
  cloudinaryId: string;
  filename: string;
  mimetype: string;
  size: number;
  companyId: string | null;
  userId: string | null;
  createdAt: string;
}

export interface OrphanFileUploadsResponse {
  orphans: OrphanFileUploadItem[];
  referencedUrlCount: number;
  totalFileUploads: number;
}

export interface OrphanUserItem {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

export interface OrphanMembershipItem {
  id: string;
  userId: string;
  companyId: string;
  topLevelRole: string;
  createdAt: string;
}

export interface OrphanEmployeeItem {
  id: string;
  companyId: string;
  userCompanyId: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

export interface OrphanClientItem {
  id: string;
  email: string;
  companyName: string | null;
  companyId: string;
  userCompanyId: string;
  createdAt: string;
}

export interface OrphanProjectItem {
  id: string;
  projectName: string;
  companyId: string;
  projectOwnerId: string;
  createdById: string;
  updatedById: string | null;
  createdAt: string;
}

export interface OrphanDeleteResult {
  deleted: number;
}

export type OrphanDataTabId =
  | "files"
  | "users"
  | "memberships"
  | "employees"
  | "clients"
  | "projects";
