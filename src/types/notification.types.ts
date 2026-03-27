export type SuperAdminNotificationType = "company_created";

export interface SuperAdminNotification {
  id: string;
  type: SuperAdminNotificationType;
  title: string;
  message: string;
  isRead: boolean;
  companyId: string | null;
  createdByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotificationsResponse {
  items: SuperAdminNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
