import { apiFetch } from "./api";

export interface SubcategoryDto {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
  subcategories: SubcategoryDto[];
}

export interface SubcategoryDetailDto {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export function getCategories(includeSubcategories = true, lang?: string): Promise<CategoryDto[]> {
  const q = new URLSearchParams({ includeSubcategories: String(includeSubcategories) });
  if (lang) q.set("lang", lang);
  return apiFetch<CategoryDto[]>(`/api/v1/categories?${q}`);
}

export function createCategory(data: { name: string; nameEn?: string; description?: string; descriptionEn?: string; iconUrl?: string; sortOrder?: number }): Promise<string> {
  return apiFetch<string>("/api/v1/categories", {
    method: "POST",
    body: JSON.stringify({ sortOrder: 0, ...data }),
  });
}

export function updateCategory(id: string, data: { name: string; nameEn?: string; description?: string; descriptionEn?: string; iconUrl?: string; sortOrder?: number; isActive?: boolean }): Promise<boolean> {
  return apiFetch<boolean>(`/api/v1/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ sortOrder: 0, isActive: true, ...data }),
  });
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/categories/${id}`, { method: "DELETE" });
}

export function createSubcategory(data: { categoryId: string; name: string; nameEn?: string; description?: string; descriptionEn?: string; sortOrder?: number }): Promise<string> {
  return apiFetch<string>("/api/v1/subcategories", {
    method: "POST",
    body: JSON.stringify({ sortOrder: 0, ...data }),
  });
}

export function updateSubcategory(id: string, data: { name: string; nameEn?: string; description?: string; descriptionEn?: string; sortOrder?: number; isActive?: boolean }): Promise<boolean> {
  return apiFetch<boolean>(`/api/v1/subcategories/${id}`, {
    method: "PUT",
    body: JSON.stringify({ sortOrder: 0, isActive: true, ...data }),
  });
}

export function deleteSubcategory(id: string): Promise<void> {
  return apiFetch<void>(`/api/v1/subcategories/${id}`, { method: "DELETE" });
}
