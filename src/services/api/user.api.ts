import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type { SessionUser } from "@/src/types/auth.types";
import type {
  SuperAdminUserItem,
  ListSuperAdminUsersResponse,
} from "@/src/types/user.types";

export async function getMe(): Promise<SessionUser> {
  const data = await apiClient.get<{ data?: SessionUser } | SessionUser>(
    apiConfig.user.me
  );
  if (data && typeof data === "object" && "data" in data && data.data) {
    return data.data;
  }
  return data as SessionUser;
}

export interface UpdateMyProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  profileImage?: string;
}

type UploadFileResponse = {
  data?: {
    url?: string;
  };
  message?: string;
};

/**
 * Update current user profile
 * PATCH /users/me
 */
export async function updateMyProfile(
  payload: UpdateMyProfilePayload
): Promise<SessionUser> {
  const res = await apiClient.patch<{ data?: SessionUser } | SessionUser>(
    apiConfig.user.me,
    payload
  );
  if (res && typeof res === "object" && "data" in res && res.data) {
    return res.data;
  }
  return res as SessionUser;
}

export async function uploadMyProfileImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(apiConfig.fileUpload, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const body = (await res.json().catch(() => ({}))) as UploadFileResponse;
  if (!res.ok) {
    throw new Error(body?.message || "Image upload failed");
  }

  const uploadedUrl = body?.data?.url;
  if (!uploadedUrl) {
    throw new Error("Uploaded image URL missing in response");
  }

  return uploadedUrl;
}

export interface ListSuperAdminUsersParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * List all users (super-admin, paginated, optional search)
 * GET /super-admin/users
 */
export async function listSuperAdminUsers(
  params: ListSuperAdminUsersParams = {}
): Promise<ListSuperAdminUsersResponse> {
  const { page = 1, limit = 20, search } = params;
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(Math.min(limit, 100)));
  if (search?.trim()) searchParams.set("search", search.trim());
  const url = `${apiConfig.superAdmin.users}?${searchParams.toString()}`;
  const res = await apiClient.get<{
    data?: {
      items?: SuperAdminUserItem[];
      total?: number;
      page?: number;
      limit?: number;
      totalPages?: number;
    };
  }>(url);
  const data = res?.data;
  const list = Array.isArray(data?.items) ? data.items : [];
  const total = typeof data?.total === "number" ? data.total : list.length;
  const totalPages =
    typeof data?.totalPages === "number" ? data.totalPages : 1;
  return {
    items: list,
    total,
    page: typeof data?.page === "number" ? data.page : page,
    limit: typeof data?.limit === "number" ? data.limit : limit,
    totalPages,
  };
}

/**
 * Soft-delete a user (super admin). Fails if the user still belongs to any company.
 * DELETE /super-admin/users/:userId
 */
export async function deleteSuperAdminUser(userId: string): Promise<void> {
  await apiClient.delete(apiConfig.superAdmin.userById(userId));
}
