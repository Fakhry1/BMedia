import { apiFetch } from "./api";

export interface UserListItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  roles: string[];
}

export interface UserDetail {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  preferredLanguage: string;
  roles: RoleSimple[];
}

export interface RoleSimple {
  id: string;
  name: string;
  description: string | null;
}

export interface RoleItem {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  createdAt: string;
}

export interface UserPage {
  items: UserListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateUserPayload {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  preferredLanguage: string;
  roleIds?: string[];
}

export interface UpdateUserPayload {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  preferredLanguage: string;
  isActive: boolean;
}

/* ── Users ───────────────────────────────────────────────── */

export function getUsers(params: {
  page?: number;
  pageSize?: number;
  search?: string;
  isActive?: boolean;
}): Promise<UserPage> {
  const q = new URLSearchParams();
  q.set("page", String(params.page ?? 1));
  q.set("pageSize", String(params.pageSize ?? 15));
  if (params.search)               q.set("search", params.search);
  if (params.isActive !== undefined) q.set("isActive", String(params.isActive));
  return apiFetch(`/api/v1/users?${q}`);
}

export function getUserById(id: string): Promise<UserDetail> {
  return apiFetch(`/api/v1/users/${id}`);
}

export function createUser(payload: CreateUserPayload): Promise<{ id: string }> {
  return apiFetch("/api/v1/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: string, payload: UpdateUserPayload): Promise<void> {
  return apiFetch(`/api/v1/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id: string): Promise<void> {
  return apiFetch(`/api/v1/users/${id}`, { method: "DELETE" });
}

export function assignUserRoles(userId: string, roleIds: string[]): Promise<void> {
  return apiFetch(`/api/v1/users/${userId}/roles`, {
    method: "PUT",
    body: JSON.stringify({ roleIds }),
  });
}

export function resetUserPassword(userId: string, newPassword: string): Promise<void> {
  return apiFetch(`/api/v1/users/${userId}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ newPassword }),
  });
}

/* ── Roles ───────────────────────────────────────────────── */

export function getRoles(search?: string): Promise<RoleItem[]> {
  const q = search ? `?search=${encodeURIComponent(search)}` : "";
  return apiFetch(`/api/v1/roles${q}`);
}

export function createRole(payload: { name: string; description?: string }): Promise<{ id: string }> {
  return apiFetch("/api/v1/roles", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRole(id: string, payload: { name: string; description?: string }): Promise<void> {
  return apiFetch(`/api/v1/roles/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteRole(id: string): Promise<void> {
  return apiFetch(`/api/v1/roles/${id}`, { method: "DELETE" });
}
