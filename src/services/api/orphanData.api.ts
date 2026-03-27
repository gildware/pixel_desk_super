import { apiClient } from "./apiClient";
import { apiConfig } from "@/src/config/api.config";
import type {
  OrphanClientItem,
  OrphanDeleteResult,
  OrphanEmployeeItem,
  OrphanFileUploadItem,
  OrphanFileUploadsResponse,
  OrphanMembershipItem,
  OrphanProjectItem,
  OrphanUserItem,
} from "@/src/types/orphanData.types";

type Envelope<T> = { status?: string; message?: string; data?: T };

function unwrapData<T>(res: Envelope<T> | T | undefined | null): T | null {
  if (res == null || typeof res !== "object") {
    return null;
  }
  if (
    "data" in res &&
    (res as Envelope<T>).data !== undefined &&
    (res as Envelope<T>).data !== null
  ) {
    return (res as Envelope<T>).data as T;
  }
  return res as T;
}

function normalizeDate<T extends { createdAt?: string | Date | null }>(
  row: T,
): T & { createdAt: string } {
  let createdAt = "";
  if (row?.createdAt != null) {
    if (typeof row.createdAt === "string") {
      createdAt = row.createdAt;
    } else {
      const d = new Date(row.createdAt);
      if (!Number.isNaN(d.getTime())) {
        createdAt = d.toISOString();
      }
    }
  }
  return { ...row, createdAt };
}

function hasId(r: unknown): r is { id: string } {
  return r != null && typeof r === "object" && typeof (r as { id?: unknown }).id === "string";
}

export async function fetchOrphanFileUploads(): Promise<OrphanFileUploadsResponse> {
  const res = await apiClient.get<Envelope<OrphanFileUploadsResponse>>(
    apiConfig.superAdmin.orphanData.files,
  );
  const data = unwrapData(res);
  if (!data || typeof data !== "object") {
    return {
      orphans: [],
      referencedUrlCount: 0,
      totalFileUploads: 0,
    };
  }
  const orphansRaw = Array.isArray(data.orphans) ? data.orphans : [];
  const orphans = orphansRaw.filter(hasId) as OrphanFileUploadItem[];
  return {
    orphans,
    referencedUrlCount:
      typeof data.referencedUrlCount === "number" ? data.referencedUrlCount : 0,
    totalFileUploads:
      typeof data.totalFileUploads === "number" ? data.totalFileUploads : 0,
  };
}

export async function deleteOrphanFileUploads(ids: string[]): Promise<OrphanDeleteResult> {
  const res = await apiClient.post<Envelope<OrphanDeleteResult>>(
    apiConfig.superAdmin.orphanData.filesDelete,
    { ids },
  );
  const data = unwrapData(res);
  return {
    deleted: data && typeof data.deleted === "number" ? data.deleted : 0,
  };
}

export async function fetchOrphanUsers(): Promise<OrphanUserItem[]> {
  const res = await apiClient.get<Envelope<{ items?: OrphanUserItem[] }>>(
    apiConfig.superAdmin.orphanData.users,
  );
  const data = unwrapData(res);
  if (!data || typeof data !== "object") {
    return [];
  }
  const items = Array.isArray(data.items) ? data.items : [];
  return items.filter(hasId).map((r) => normalizeDate(r as OrphanUserItem));
}

export async function deleteOrphanUsers(ids: string[]): Promise<OrphanDeleteResult> {
  const res = await apiClient.post<Envelope<OrphanDeleteResult>>(
    apiConfig.superAdmin.orphanData.usersDelete,
    { ids },
  );
  const data = unwrapData(res);
  return {
    deleted: data && typeof data.deleted === "number" ? data.deleted : 0,
  };
}

export async function fetchOrphanMemberships(): Promise<OrphanMembershipItem[]> {
  const res = await apiClient.get<Envelope<{ items?: OrphanMembershipItem[] }>>(
    apiConfig.superAdmin.orphanData.memberships,
  );
  const data = unwrapData(res);
  if (!data || typeof data !== "object") {
    return [];
  }
  const items = Array.isArray(data.items) ? data.items : [];
  return items.filter(hasId).map((r) => normalizeDate(r as OrphanMembershipItem));
}

export async function deleteOrphanMemberships(ids: string[]): Promise<OrphanDeleteResult> {
  const res = await apiClient.post<Envelope<OrphanDeleteResult>>(
    apiConfig.superAdmin.orphanData.membershipsDelete,
    { ids },
  );
  const data = unwrapData(res);
  return {
    deleted: data && typeof data.deleted === "number" ? data.deleted : 0,
  };
}

export async function fetchOrphanEmployees(): Promise<OrphanEmployeeItem[]> {
  const res = await apiClient.get<Envelope<{ items?: OrphanEmployeeItem[] }>>(
    apiConfig.superAdmin.orphanData.employees,
  );
  const data = unwrapData(res);
  if (!data || typeof data !== "object") {
    return [];
  }
  const items = Array.isArray(data.items) ? data.items : [];
  return items.filter(hasId).map((r) => normalizeDate(r as OrphanEmployeeItem));
}

export async function deleteOrphanEmployees(ids: string[]): Promise<OrphanDeleteResult> {
  const res = await apiClient.post<Envelope<OrphanDeleteResult>>(
    apiConfig.superAdmin.orphanData.employeesDelete,
    { ids },
  );
  const data = unwrapData(res);
  return {
    deleted: data && typeof data.deleted === "number" ? data.deleted : 0,
  };
}

export async function fetchOrphanClients(): Promise<OrphanClientItem[]> {
  const res = await apiClient.get<Envelope<{ items?: OrphanClientItem[] }>>(
    apiConfig.superAdmin.orphanData.clients,
  );
  const data = unwrapData(res);
  if (!data || typeof data !== "object") {
    return [];
  }
  const items = Array.isArray(data.items) ? data.items : [];
  return items.filter(hasId).map((r) => normalizeDate(r as OrphanClientItem));
}

export async function deleteOrphanClients(ids: string[]): Promise<OrphanDeleteResult> {
  const res = await apiClient.post<Envelope<OrphanDeleteResult>>(
    apiConfig.superAdmin.orphanData.clientsDelete,
    { ids },
  );
  const data = unwrapData(res);
  return {
    deleted: data && typeof data.deleted === "number" ? data.deleted : 0,
  };
}

export async function fetchOrphanProjects(): Promise<OrphanProjectItem[]> {
  const res = await apiClient.get<Envelope<{ items?: OrphanProjectItem[] }>>(
    apiConfig.superAdmin.orphanData.projects,
  );
  const data = unwrapData(res);
  if (!data || typeof data !== "object") {
    return [];
  }
  const items = Array.isArray(data.items) ? data.items : [];
  return items.filter(hasId).map((r) => normalizeDate(r as OrphanProjectItem));
}

export async function deleteOrphanProjects(ids: string[]): Promise<OrphanDeleteResult> {
  const res = await apiClient.post<Envelope<OrphanDeleteResult>>(
    apiConfig.superAdmin.orphanData.projectsDelete,
    { ids },
  );
  const data = unwrapData(res);
  return {
    deleted: data && typeof data.deleted === "number" ? data.deleted : 0,
  };
}
