export type PlatformIndustryProjectTypeRow = {
  id: string;
  platformIndustryId: string;
  label: string;
  projectType: string;
  placeholder: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PlatformIndustryAdminRow = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  projectTypes?: PlatformIndustryProjectTypeRow[];
  createdAt?: string;
  updatedAt?: string;
};

export type PlatformDashboardUseAdminRow = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PlatformSkillAdminRow = {
  id: string;
  platformSkillCategoryId: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type PlatformSkillCategoryAdminRow = {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  skills?: PlatformSkillAdminRow[];
  createdAt?: string;
  updatedAt?: string;
};
