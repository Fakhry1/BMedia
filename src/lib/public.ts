import { API_BASE } from "@/lib/config";

async function pfetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { signal, cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

async function apifetch<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("bmedia_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const r = await fetch(`${API_BASE}${path}`, { signal, cache: "no-store", headers });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

export interface PublicItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  language: string;
  isFeatured: boolean;
  publishedAt: string | null;
  categoryName: string | null;
  thumbnailUrl: string | null;
  tags: string[];
}

export interface PublicPage {
  items: PublicItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PubCategory {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  sortOrder: number;
  iconUrl: string | null;
  subcategories: { id: string; name: string; nameEn: string | null; slug: string }[];
}

export interface PubContentDetail {
  id: string;
  title: string;
  summary: string | null;
  language: string;
  categoryName: string | null;
  publishedAt: string | null;
  mediaAssets: {
    id: string;
    mediaType: string | number;
    status: string | number;
    isPrimary: boolean;
    originalFileName: string;
    fileSizeBytes: number;
    contentType: string;
    publicUrl: string | null;
  }[];
  tags: string[];
}

const MEDIA_TYPE_STRINGS: Record<number, string> = {
  1: "Video", 2: "Image", 3: "Audio", 4: "Document",
};

export function matchesMediaType(asset: { mediaType: string | number }, typeNum: number): boolean {
  const mt = asset.mediaType;
  return mt === typeNum || mt === MEDIA_TYPE_STRINGS[typeNum];
}

export function fetchPublicContents(params: {
  page?: number; pageSize?: number; categoryId?: string;
  subcategoryId?: string; language?: string; mediaType?: number;
  isFeatured?: boolean; lang?: string;
} = {}, signal?: AbortSignal): Promise<PublicPage> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.categoryId) q.set("categoryId", params.categoryId);
  if (params.subcategoryId) q.set("subcategoryId", params.subcategoryId);
  if (params.language) q.set("language", params.language);
  if (params.mediaType) q.set("mediaType", String(params.mediaType));
  if (params.isFeatured !== undefined) q.set("isFeatured", String(params.isFeatured));
  if (params.lang) q.set("lang", params.lang);
  return pfetch<PublicPage>(`/api/v1/contents?${q}`, signal);
}

let _catCache: { data: PubCategory[]; ts: number; lang: string } | null = null;
const CAT_TTL = 5 * 60 * 1000;

export function fetchPublicCategories(lang?: string, signal?: AbortSignal): Promise<PubCategory[]> {
  const now = Date.now();
  if (_catCache && _catCache.lang === (lang ?? "") && now - _catCache.ts < CAT_TTL) {
    return Promise.resolve(_catCache.data);
  }
  const q = lang ? `?lang=${lang}` : "";
  return pfetch<PubCategory[]>(`/api/v1/categories${q}`, signal).then(data => {
    _catCache = { data, ts: Date.now(), lang: lang ?? "" };
    return data;
  });
}

export function fetchPublicSubcategories(categoryId: string, lang?: string, signal?: AbortSignal): Promise<{ id: string; name: string; slug: string }[]> {
  const q = new URLSearchParams({ categoryId });
  if (lang) q.set("lang", lang);
  return pfetch<{ id: string; name: string; slug: string }[]>(`/api/v1/subcategories?${q}`, signal);
}

export function fetchPublicDetail(id: string, lang?: string, signal?: AbortSignal): Promise<PubContentDetail> {
  const q = lang ? `?lang=${lang}` : "";
  return pfetch<PubContentDetail>(`/api/v1/contents/${id}${q}`, signal);
}

export function fetchSignedUrl(assetId: string, _signal?: AbortSignal): Promise<{ url: string }> {
  // Use the stream proxy endpoint — avoids Azure public-access restrictions
  return Promise.resolve({ url: `${API_BASE}/api/v1/mediaassets/${assetId}/stream` });
}

/** Returns a thumbnail URL — resolves relative API paths against API_BASE. */
export async function resolveThumb(item: PublicItem, _signal?: AbortSignal): Promise<string | null> {
  const url = item.thumbnailUrl;
  if (!url) return null;
  if (url.startsWith("/")) return `${API_BASE}${url}`;
  return url;
}

/** Returns the thumbnail image URL for a media asset (not the stream). */
export function assetThumbUrl(assetId: string): string {
  return `${API_BASE}/api/v1/mediaassets/${assetId}/thumbnail`;
}

export function downloadBlob(url: string, _filename: string): Promise<void> {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  return Promise.resolve();
}
