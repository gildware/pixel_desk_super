export type CompanyDefaultRole = {
  id: number;
  name: string;
  isSystem: boolean;
  createdAt?: string;
};

export type PermissionAction = {
  name: string; // e.g. 'create' | 'read' | 'update' | 'delete' | 'self-manage'
  hasPermission: boolean;
};

export type PermissionGroup = {
  subject: string;
  actions: PermissionAction[];
};

export type RolePermissions = {
  id: number;
  name: string;
  isSystem: boolean;
  permissions: PermissionGroup[];
};

