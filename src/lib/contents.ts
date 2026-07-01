import { apiFetch } from "./api";
import { API_BASE } from "./config";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);

export type ContentStatus =
  | "Draft" | "ContentReview" | "LanguageReview" | "MediaQualityReview"
  | "SEOReview" | "LegalReview" | "ReligiousReview" | "FinalApproval"
  | "Published" | "Rejected" | "Archived" | "Inactive" | "Scheduled";

export type MediaType = "Unknown" | "Video" | "Image" | "Audio" | "Document" | "PDF" | "Subtitle" | "Thumbnail" | "Preview" | "HLSStream" | "Attachment";
export type MediaAssetStatus = "Pending" | "Processing" | "Ready" | "Failed" | "Quarantined" | "Archived";

export interface ContentListItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  language: string;
  status: ContentStatus;
  isFeatured: boolean;
  createdAt: string;
  publishedAt: string | null;
  categoryName: string | null;
  thumbnailUrl: string | null;
  tags: string[];
}

export interface MediaAssetDto {
  id: string;
  originalFileName: string;
  contentType: string;
  mediaType: MediaType;
  status: MediaAssetStatus;
  publicUrl: string | null;
  thumbnailUrl: string | null;
  isPrimary: boolean;
  sortOrder: number;
  fileSizeBytes: number;
}

export interface ContentDetail {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  language: string;
  status: ContentStatus;
  isFeatured: boolean;
  allowComments: boolean;
  viewCount: number;
  createdAt: string;
  publishedAt: string | null;
  scheduledPublishAt: string | null;
  categoryId: string | null;
  categoryName: string | null;
  subcategoryId: string | null;
  subcategoryName: string | null;
  currentWorkflowStep: string | null;
  mediaAssets: MediaAssetDto[];
  tags: string[];
}

export interface ContentPage {
  items: ContentListItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface WorkflowTransition {
  transitionId: string;
  actionName: string;
  description: string | null;
  targetStepName: string;
  requiresComment: boolean;
}

export interface CreateContentResult {
  contentId: string;
  slug: string;
}

export interface UploadResult {
  assetId: string;
  status: string;
}

function isLoopbackAssetUrl(value: string | null | undefined): boolean {
  if (!value) return false;

  try {
    const parsed = new URL(value, "http://localhost");
    return (
      LOOPBACK_HOSTS.has(parsed.hostname.toLowerCase()) ||
      parsed.pathname.includes("/files/content/")
    );
  } catch {
    return value.includes("/files/content/");
  }
}

async function resolveSignedAssetUrl(assetId: string, fallbackUrl: string | null): Promise<string | null> {
  if (!assetId || !isLoopbackAssetUrl(fallbackUrl)) {
    return fallbackUrl;
  }

  try {
    const signed = await getSignedUrl(assetId);
    return signed.url;
  } catch {
    return fallbackUrl;
  }
}

export function getContents(params: {
  page?: number; pageSize?: number; search?: string;
  status?: ContentStatus; categoryId?: string; language?: string;
} = {}): Promise<ContentPage> {
  const q = new URLSearchParams();
  if (params.page) q.set("page", String(params.page));
  if (params.pageSize) q.set("pageSize", String(params.pageSize));
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  if (params.categoryId) q.set("categoryId", params.categoryId);
  if (params.language) q.set("language", params.language);
  return apiFetch<ContentPage>(`/api/v1/contents?${q}`);
}

export async function getContentById(id: string): Promise<ContentDetail> {
  const content = await apiFetch<ContentDetail>(`/api/v1/contents/${id}`);

  const mediaAssets = await Promise.all(
    content.mediaAssets.map(async (asset) => ({
      ...asset,
      publicUrl: await resolveSignedAssetUrl(asset.id, asset.publicUrl),
    }))
  );

  return { ...content, mediaAssets };
}

export function createContent(data: {
  title: string; titleEn?: string; summary?: string; summaryEn?: string; language: string;
  categoryId?: string; subcategoryId?: string; scheduledPublishAt?: string;
}): Promise<CreateContentResult> {
  return apiFetch<CreateContentResult>("/api/v1/contents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateContent(id: string, data: {
  title: string; summary?: string; language: string;
  categoryId?: string; subcategoryId?: string;
  isFeatured: boolean; allowComments: boolean;
}): Promise<boolean> {
  return apiFetch<boolean>(`/api/v1/contents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function updateContentStatus(contentId: string, status: ContentStatus, comment?: string): Promise<boolean> {
  return apiFetch<boolean>(`/api/v1/contents/${contentId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, comment: comment ?? null }),
  });
}

export const STATUS_ORDER: ContentStatus[] = [
  "Draft", "ContentReview", "LanguageReview", "MediaQualityReview", "Published",
];

export const STATUS_TERMINAL: ContentStatus[] = ["Rejected", "Archived", "Inactive", "Scheduled"];

export function getAvailableTransitions(contentId: string): Promise<WorkflowTransition[]> {
  return apiFetch<WorkflowTransition[]>(`/api/v1/contents/${contentId}/workflow/transitions`);
}

export function transitionWorkflow(contentId: string, transitionId: string, comment?: string): Promise<boolean> {
  return apiFetch<boolean>(`/api/v1/contents/${contentId}/workflow/transition`, {
    method: "POST",
    body: JSON.stringify({ transitionId, comment: comment ?? null }),
  });
}

export interface WorkflowHistoryEntry {
  id: string;
  fromStatus: number;
  toStatus: number;
  actionName: string | null;
  comment: string | null;
  transitionedAt: string;
  transitionedBy: {
    id: string;
    fullName: string;
    email: string;
  };
}

export function getWorkflowHistory(contentId: string): Promise<WorkflowHistoryEntry[]> {
  return apiFetch<WorkflowHistoryEntry[]>(`/api/v1/contents/${contentId}/history`);
}

export interface UploadAssetResult extends UploadResult {
  blobUrl: string; // Blob URL created from the uploaded File for immediate preview
}

export function uploadAsset(data: {
  file: File; contentId?: string; mediaType: number;
  language?: string; title?: string; isPrimary?: boolean; sortOrder?: number;
}, onProgress?: (pct: number) => void): Promise<UploadAssetResult> {
  const form = new FormData();
  form.append("file", data.file);
  if (data.contentId) form.append("contentId", data.contentId);
  form.append("mediaType", String(data.mediaType));
  form.append("language", data.language ?? "ar");
  if (data.title) form.append("title", data.title);
  form.append("isPrimary", String(data.isPrimary ?? false));
  form.append("sortOrder", String(data.sortOrder ?? 0));

  const token = typeof window !== "undefined" ? localStorage.getItem("bmedia_token") : null;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/api/v1/mediaassets/upload`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const parsed = JSON.parse(xhr.responseText) as UploadResult;
          const blobUrl = URL.createObjectURL(data.file);
          resolve({ ...parsed, blobUrl });
        }
        catch { reject(new Error("Invalid JSON response")); }
      } else {
        reject(new Error(xhr.responseText || `HTTP ${xhr.status}`));
      }
    });

    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload cancelled")));

    xhr.send(form);
  });
}

// Values match the API Media Type Enum exactly:
// 1=Video  2=Image  3=Audio  4=Document
export const MEDIA_TYPE_MAP: Record<string, number> = {
  "video": 1, "image": 2, "audio": 3, "document": 4,
};

export const MEDIA_TYPE_NUM: Record<number, string> = {
  1: "Video", 2: "Image", 3: "Audio", 4: "Document",
};

export function getSignedUrl(assetId: string): Promise<{ url: string; expiresAt: string }> {
  return apiFetch(`/api/v1/mediaassets/${assetId}/url`);
}

export function deleteAsset(assetId: string): Promise<boolean> {
  return apiFetch<boolean>(`/api/v1/mediaassets/${assetId}`, { method: "DELETE" });
}

export function guessMediaType(file: File): number {
  const mime = file.type.toLowerCase();
  if (mime.startsWith("video/")) return 1;
  if (mime.startsWith("image/")) return 2;
  if (mime.startsWith("audio/")) return 3;
  return 4; // Document / PDF
}

export const STATUS_LABEL_AR: Record<ContentStatus, string> = {
  Draft: "قيد إعداد", ContentReview: "مراجعة المحتوى", LanguageReview: "التدقيق اللغوي",
  MediaQualityReview: "مراجعة التصميم", SEOReview: "مراجعة SEO",
  LegalReview: "مراجعة قانونية", ReligiousReview: "مراجعة شرعية",
  FinalApproval: "موافقة نهائية", Published: "نشر", Rejected: "إلغاء",
  Archived: "مؤرشف", Inactive: "غير نشِط", Scheduled: "مجدول",
};

export const STATUS_LABEL_EN: Record<ContentStatus, string> = {
  Draft: "In Preparation", ContentReview: "Content Review", LanguageReview: "Language Review",
  MediaQualityReview: "Design Review", SEOReview: "SEO Review",
  LegalReview: "Legal Review", ReligiousReview: "Religious Review",
  FinalApproval: "Final Approval", Published: "Published", Rejected: "Cancelled",
  Archived: "Archived", Inactive: "Inactive", Scheduled: "Scheduled",
};

export const STATUS_COLOR: Record<ContentStatus, string> = {
  Draft: "#6B7280", ContentReview: "#F59E0B", LanguageReview: "#8B5CF6",
  MediaQualityReview: "#3B82F6", SEOReview: "#06B6D4", LegalReview: "#EC4899",
  ReligiousReview: "#10B981", FinalApproval: "#F97316", Published: "#22C55E",
  Rejected: "#EF4444", Archived: "#9CA3AF", Inactive: "#6B7280", Scheduled: "#A855F7",
};

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
