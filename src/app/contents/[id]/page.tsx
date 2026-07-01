"use client";

import { useEffect, useState, use } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  getContentById, updateContent, getAvailableTransitions, transitionWorkflow,
  updateContentStatus, uploadAsset, deleteAsset, getSignedUrl,
  STATUS_LABEL_AR, STATUS_LABEL_EN, STATUS_COLOR, formatBytes,
  type ContentDetail, type WorkflowTransition, type MediaAssetDto, type ContentStatus,
} from "@/lib/contents";
import { getCategories, type CategoryDto } from "@/lib/categories";
import { ApiError } from "@/lib/api";
import { useLang } from "@/lib/LangContext";
import WorkflowHistoryDrawer from "@/components/contents/WorkflowHistoryDrawer";

const STATUS_ORDER: ContentStatus[] = [
  "Draft", "ContentReview", "LanguageReview", "MediaQualityReview", "FinalApproval", "Published",
];

const LANGS = [
  { code: "ar", label: "العربية" }, { code: "en", label: "English" },
  { code: "fr", label: "Français" }, { code: "ur", label: "اردو" },
];

// Media types the user can pick for upload
const UPLOAD_MEDIA_TYPES = [
  { id: 1, key: "video",  icon: "🎬", labelAr: "فيديو",      labelEn: "Video",  accept: "video/*" },
  { id: 2, key: "image",  icon: "🖼️", labelAr: "صورة",       labelEn: "Image",  accept: "image/*" },
  { id: 3, key: "audio",  icon: "🎙", labelAr: "صوت",        labelEn: "Audio",  accept: "audio/*" },
  { id: 5, key: "pdf",    icon: "📋", labelAr: "ملف PDF",    labelEn: "PDF",    accept: ".pdf" },
] as const;

function StatusBadge({ status, lang }: { status: string; lang: "ar" | "en" }) {
  const s = status as ContentStatus;
  const color = STATUS_COLOR[s] ?? "#6B7280";
  const label = lang === "ar" ? (STATUS_LABEL_AR[s] ?? status) : (STATUS_LABEL_EN[s] ?? status);
  return (
    <span className="px-3 py-1 rounded-full text-sm font-bold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>{label}</span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow-sm)" }}>
      <h3 className="font-bold mb-4 pb-3 border-b" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", color: "var(--ink)", borderColor: "var(--line)" }}>{title}</h3>
      {children}
    </div>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <label className="block text-xs font-semibold mb-1" style={{ color: "var(--muted)" }}>{text}</label>;
}
function InputEl(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all"
      style={{ background: "var(--surface-2)", border: "1.5px solid var(--line)", color: "var(--ink)", ...props.style }}
      onFocus={e => (e.currentTarget.style.borderColor = "var(--gold)")}
      onBlur={e => (e.currentTarget.style.borderColor = "var(--line)")} />
  );
}
function TextareaEl(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} rows={3} className="w-full px-3 py-2 rounded-xl text-sm outline-none transition-all resize-none"
      style={{ background: "var(--surface-2)", border: "1.5px solid var(--line)", color: "var(--ink)", ...props.style }}
      onFocus={e => (e.currentTarget.style.borderColor = "var(--gold)")}
      onBlur={e => (e.currentTarget.style.borderColor = "var(--line)")} />
  );
}
function ErrMsg({ msg }: { msg: string }) {
  return msg ? <p className="px-3 py-2 rounded-xl text-xs font-medium mt-2"
    style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.20)", color: "#DC2626" }}>{msg}</p> : null;
}

// Smart media preview — fetches a SAS (signed) URL then renders the appropriate player
function MediaPreview({ asset }: { asset: MediaAssetDto }) {
  const [src, setSrc] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const { lang } = useLang();
  const isAr = lang === "ar";

  const canPreview = asset.mediaType === "Video" || asset.mediaType === "Audio"
    || asset.mediaType === "PDF" || asset.mediaType === "Image";
  if (!canPreview) return null;

  function handleLoad() {
    // If already a blob URL (just uploaded), use it directly without a network call.
    if (asset.publicUrl?.startsWith("blob:")) { setSrc(asset.publicUrl); return; }
    setFetching(true); setFetchErr("");
    getSignedUrl(asset.id)
      .then(r => setSrc(r.url))
      .catch(e => setFetchErr(e instanceof Error ? e.message : (isAr ? "فشل تحميل الرابط" : "Failed to load file")))
      .finally(() => setFetching(false));
  }

  if (!src) {
    return (
      <div className="mt-3">
        {fetchErr && (
          <p className="text-xs mb-2 px-2 py-1 rounded-lg"
            style={{ background: "rgba(239,68,68,.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,.20)" }}>
            ⚠ {fetchErr}
          </p>
        )}
        <button onClick={handleLoad} disabled={fetching}
          className="w-full py-2 rounded-xl text-sm font-bold border transition-all"
          style={{ borderColor: "var(--line-gold)", color: "var(--forest)", background: "rgba(200,168,75,.06)", cursor: fetching ? "not-allowed" : "pointer" }}>
          {fetching
            ? (isAr ? "⏳ جارٍ التحميل..." : "⏳ Loading...")
            : asset.mediaType === "Video"  ? (isAr ? "▶ تشغيل الفيديو"  : "▶ Play Video")
            : asset.mediaType === "Audio"  ? (isAr ? "🎙 تشغيل الصوت"   : "🎙 Play Audio")
            : asset.mediaType === "Image"  ? (isAr ? "🖼️ عرض الصورة"    : "🖼️ View Image")
            : (isAr ? "📋 عرض PDF" : "📋 View PDF")}
        </button>
      </div>
    );
  }

  if (asset.mediaType === "Video") {
    return (
      <video src={src} controls autoPlay preload="auto" className="w-full rounded-xl mt-3"
        style={{ maxHeight: "280px", background: "#000", outline: "none" }} />
    );
  }
  if (asset.mediaType === "Audio") {
    return (
      <audio src={src} controls autoPlay className="w-full mt-3" style={{ borderRadius: "12px" }} />
    );
  }
  if (asset.mediaType === "Image") {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border"
        style={{ borderColor: "var(--line)", background: "var(--surface-2)", textAlign: "center" }}>
        <img src={src} alt={asset.originalFileName}
          style={{ maxWidth: "100%", maxHeight: "360px", objectFit: "contain", display: "block", margin: "0 auto" }} />
      </div>
    );
  }
  if (asset.mediaType === "PDF") {
    return (
      <div className="mt-3 rounded-xl overflow-hidden border" style={{ borderColor: "var(--line)", height: "340px" }}>
        <iframe src={`${src}#toolbar=1&navpanes=0`} className="w-full h-full" title={asset.originalFileName} />
      </div>
    );
  }
  return null;
}

const ASSET_STATUS_AR: Record<string, string> = {
  Ready: "جاهز", Processing: "قيد المعالجة", Pending: "في الانتظار", Failed: "فشل",
};

function AssetCard({ asset, canDelete, deleting, onDelete }: {
  asset: MediaAssetDto;
  canDelete?: boolean;
  deleting?: boolean;
  onDelete?: (id: string) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const { lang } = useLang();
  const isAr = lang === "ar";

  async function handleDownload() {
    setDownloading(true);
    try {
      // Use blob URL directly if available (just uploaded), otherwise get a signed URL.
      const url = asset.publicUrl?.startsWith("blob:")
        ? asset.publicUrl
        : (await getSignedUrl(asset.id)).url;
      const a = document.createElement("a");
      a.href = url;
      a.download = asset.originalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // silently fail — user can use the ↗ link as fallback
    } finally {
      setDownloading(false);
    }
  }

  const icons: Record<string, string> = { Video: "🎬", Image: "🖼", Audio: "🎙", Document: "📄", PDF: "📋", Thumbnail: "🖼", Attachment: "📎" };
  const statusColor: Record<string, string> = { Ready: "#22C55E", Processing: "#F59E0B", Pending: "#6B7280", Failed: "#EF4444" };
  return (
    <div className="rounded-xl border overflow-hidden"
      style={{ background: "var(--surface-2)", borderColor: deleting ? "rgba(239,68,68,.40)" : "var(--line)", opacity: deleting ? 0.6 : 1, transition: "opacity .2s" }}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className="text-2xl">{icons[asset.mediaType] ?? "📎"}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>{asset.originalFileName}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>{formatBytes(asset.fileSizeBytes)} · {asset.contentType}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {asset.isPrimary && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(200,168,75,.15)", color: "var(--forest)" }}>★</span>
          )}
          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${statusColor[asset.status] ?? "#6B7280"}18`, color: statusColor[asset.status] ?? "#6B7280" }}>
            {lang === "ar" ? (ASSET_STATUS_AR[asset.status] ?? asset.status) : asset.status}
          </span>
          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            title="تحميل"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
            style={{ background: "rgba(11,35,24,.08)", color: "var(--forest)", border: "1px solid rgba(11,35,24,.15)", cursor: downloading ? "not-allowed" : "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = "rgba(11,35,24,.16)")}
            onMouseLeave={e => (e.currentTarget.style.background = "rgba(11,35,24,.08)")}>
            {downloading ? "⏳" : "⬇"}
          </button>
          {canDelete && onDelete && (
            <button
              onClick={() => onDelete(asset.id)}
              disabled={deleting}
              title="حذف"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
              style={{ background: "rgba(239,68,68,.08)", color: "#EF4444", border: "1px solid rgba(239,68,68,.25)", cursor: deleting ? "not-allowed" : "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,.18)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,.08)")}>
              {deleting ? "…" : "🗑"}
            </button>
          )}
        </div>
      </div>
      {/* Inline media preview */}
      {(asset.mediaType === "Video" || asset.mediaType === "Audio" || asset.mediaType === "PDF" || asset.mediaType === "Image") && (
        <div className="px-3 pb-3">
          {asset.status === "Processing" && (
            <p className="text-xs mb-1" style={{ color: "#F59E0B" }}>
              ⏳ {isAr ? "جارٍ المعالجة، قد لا يكون الملف جاهزاً بعد." : "Processing, file may not be ready yet."}
            </p>
          )}
          <MediaPreview asset={asset} />
        </div>
      )}
    </div>
  );
}

interface UploadingFile {
  file: File; status: "uploading" | "done" | "error"; progress: number; error?: string;
}

export default function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lang } = useLang();

  const [content, setContent] = useState<ContentDetail | null>(null);
  const [transitions, setTransitions] = useState<WorkflowTransition[]>([]);
  const [transitionsLoaded, setTransitionsLoaded] = useState(false);
  const [transitionsError, setTransitionsError] = useState("");
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [historyOpen, setHistoryOpen] = useState(false);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSummary, setEditSummary] = useState("");
  const [editLang, setEditLang] = useState("ar");
  const [editCatId, setEditCatId] = useState("");
  const [editSubId, setEditSubId] = useState("");
  const [editFeatured, setEditFeatured] = useState(false);
  const [editComments, setEditComments] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Workflow — transitions (when workflow is configured in DB)
  const [transitionModal, setTransitionModal] = useState<WorkflowTransition | null>(null);
  const [wfComment, setWfComment] = useState("");
  const [wfLoading, setWfLoading] = useState(false);
  const [wfError, setWfError] = useState("");

  // Direct status change
  const [statusModal, setStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<ContentStatus | "">("");
  const [statusComment, setStatusComment] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  // File upload — user must select type first
  const [uploadMediaTypeId, setUploadMediaTypeId] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  // Asset delete
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);
  const [deleteAssetError, setDeleteAssetError] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [c, tr, cats] = await Promise.all([
        getContentById(id),
        getAvailableTransitions(id).then(r => { setTransitionsLoaded(true); setTransitionsError(""); return r; }).catch((e) => { setTransitionsLoaded(false); setTransitionsError(e instanceof Error ? e.message : String(e)); return [] as WorkflowTransition[]; }),
        getCategories(true, lang),
      ]);
      setContent(c); setTransitions(tr); setCategories(cats);
      setEditTitle(c.title); setEditSummary(c.summary ?? "");
      setEditLang(c.language); setEditCatId(c.categoryId ?? "");
      setEditSubId(c.subcategoryId ?? "");
      setEditFeatured(c.isFeatured); setEditComments(c.allowComments);
    } catch {
      setError(lang === "ar" ? "تعذّر تحميل المحتوى" : "Failed to load content");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id, lang]);

  async function handleSave() {
    setSaveError(""); setSaving(true);
    try {
      await updateContent(id, {
        title: editTitle, summary: editSummary || undefined, language: editLang,
        categoryId: editCatId || undefined, subcategoryId: editSubId || undefined,
        isFeatured: editFeatured, allowComments: editComments,
      });
      await load(); setEditing(false);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : (lang === "ar" ? "حدث خطأ" : "Error"));
    } finally { setSaving(false); }
  }

  async function handleTransition() {
    if (!transitionModal) return;
    setWfError(""); setWfLoading(true);
    try {
      await transitionWorkflow(id, transitionModal.transitionId, wfComment || undefined);
      setTransitionModal(null); setWfComment("");
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 403)
        setWfError(lang === "ar" ? "ليس لديك صلاحية لتنفيذ هذه العملية" : "You don't have permission to perform this action");
      else
        setWfError(e instanceof ApiError ? e.message : (lang === "ar" ? "حدث خطأ" : "Error"));
    } finally { setWfLoading(false); }
  }

  async function handleStatusChange() {
    if (!targetStatus) return;
    setStatusError(""); setStatusLoading(true);
    try {
      await updateContentStatus(id, targetStatus, statusComment || undefined);
      setStatusModal(false); setTargetStatus(""); setStatusComment("");
      await load();
    } catch (e) {
      if (e instanceof ApiError && e.status === 403)
        setStatusError(lang === "ar" ? "ليس لديك صلاحية لتغيير حالة هذا المحتوى" : "You don't have permission to change this content's status");
      else
        setStatusError(e instanceof ApiError ? e.message : (lang === "ar" ? "حدث خطأ" : "Error"));
    } finally { setStatusLoading(false); }
  }

  async function handleFileUpload(fileList: FileList) {
    if (!uploadMediaTypeId) return;
    const arr = Array.from(fileList);
    const entries: UploadingFile[] = arr.map(f => ({ file: f, status: "uploading" as const, progress: 0 }));
    setUploadingFiles(prev => [...prev, ...entries]);
    const base = uploadingFiles.length;
    for (let i = 0; i < arr.length; i++) {
      const idx = base + i;
      try {
        await uploadAsset(
          { file: arr[i], contentId: id, mediaType: uploadMediaTypeId, language: lang },
          (pct) => setUploadingFiles(prev => prev.map((f, j) => j === idx ? { ...f, progress: pct } : f))
        );
        setUploadingFiles(prev => prev.map((f, j) => j === idx ? { ...f, status: "done", progress: 100 } : f));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        setUploadingFiles(prev => prev.map((f, j) => j === idx ? { ...f, status: "error", error: msg } : f));
      }
    }
    await load();
  }

  async function handleDeleteAsset(assetId: string) {
    setDeleteAssetError(""); setDeletingAssetId(assetId);
    try {
      await deleteAsset(assetId);
      await load();
    } catch (e) {
      setDeleteAssetError(e instanceof Error ? e.message : (lang === "ar" ? "فشل الحذف" : "Delete failed"));
    } finally { setDeletingAssetId(null); }
  }

  const selectedCat = categories.find(c => c.id === editCatId);
  const selectedUploadType = UPLOAD_MEDIA_TYPES.find(t => t.id === uploadMediaTypeId);

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex-1 py-8">
          <div className="container-main">
            <div className="h-8 w-64 rounded-xl animate-pulse mb-4" style={{ background: "var(--surface-2)" }} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
              ))}
            </div>
          </div>
        </main>
      </>
    );
  }

  if (error || !content) {
    return (
      <>
        <Header />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="font-bold text-lg mb-4" style={{ color: "var(--ink)" }}>{error}</p>
            <button onClick={load} className="px-5 py-2 rounded-xl text-sm font-bold" style={{ background: "var(--forest)", color: "#fff" }}>
              {lang === "ar" ? "إعادة المحاولة" : "Retry"}
            </button>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="flex-1 py-8">
        <div className="container-main">

          {/* Breadcrumb + title */}
          <div className="mb-6">
            <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>
              <a href="/contents" style={{ color: "var(--forest)" }}>{lang === "ar" ? "المحتوى" : "Contents"}</a>
              {" / "}
              <span>{content.title}</span>
            </p>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl font-extrabold" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", color: "var(--ink)" }}>
                  {content.title}
                </h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <StatusBadge status={content.status} lang={lang} />
                  {content.isFeatured && (
                    <span className="text-xs font-semibold px-2 py-1 rounded-lg"
                      style={{ background: "rgba(200,168,75,.15)", color: "var(--forest)" }}>⭐ {lang === "ar" ? "مميز" : "Featured"}</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  onClick={() => setHistoryOpen(true)}
                  className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                  style={{ borderColor: "var(--line)", color: "var(--ink-2)", background: "var(--surface)", display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {lang === "ar" ? "السجل" : "History"}
                </button>
                <button onClick={() => setEditing(!editing)}
                  className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                  style={{ borderColor: editing ? "var(--gold)" : "var(--line)", color: editing ? "var(--forest)" : "var(--ink)", background: editing ? "rgba(200,168,75,.08)" : "var(--surface)" }}>
                  {editing ? (lang === "ar" ? "إلغاء" : "Cancel") : (lang === "ar" ? "✎ تعديل" : "✎ Edit")}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Edit / View info */}
              <Section title={lang === "ar" ? "معلومات المحتوى" : "Content Information"}>
                {editing ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <FieldLabel text={lang === "ar" ? "العنوان *" : "Title *"} />
                      <InputEl required value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                    </div>
                    <div>
                      <FieldLabel text={lang === "ar" ? "الملخص" : "Summary"} />
                      <TextareaEl value={editSummary} onChange={e => setEditSummary(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel text={lang === "ar" ? "اللغة" : "Language"} />
                        <select value={editLang} onChange={e => setEditLang(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "var(--surface-2)", border: "1.5px solid var(--line)", color: "var(--ink)" }}>
                          {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <FieldLabel text={lang === "ar" ? "التصنيف" : "Category"} />
                        <select value={editCatId} onChange={e => { setEditCatId(e.target.value); setEditSubId(""); }}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "var(--surface-2)", border: "1.5px solid var(--line)", color: "var(--ink)" }}>
                          <option value="">—</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                    </div>
                    {selectedCat && selectedCat.subcategories.length > 0 && (
                      <div>
                        <FieldLabel text={lang === "ar" ? "التصنيف الفرعي" : "Subcategory"} />
                        <select value={editSubId} onChange={e => setEditSubId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
                          style={{ background: "var(--surface-2)", border: "1.5px solid var(--line)", color: "var(--ink)" }}>
                          <option value="">—</option>
                          {selectedCat.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={editFeatured} onChange={e => setEditFeatured(e.target.checked)} className="w-4 h-4" />
                        <span style={{ color: "var(--ink-2)" }}>{lang === "ar" ? "مميز" : "Featured"}</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={editComments} onChange={e => setEditComments(e.target.checked)} className="w-4 h-4" />
                        <span style={{ color: "var(--ink-2)" }}>{lang === "ar" ? "تفعيل التعليقات" : "Allow comments"}</span>
                      </label>
                    </div>
                    <ErrMsg msg={saveError} />
                    <button onClick={handleSave} disabled={saving}
                      className="py-2.5 rounded-xl text-sm font-bold"
                      style={{ background: saving ? "rgba(11,35,24,.4)" : "var(--forest)", color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
                      {saving ? (lang === "ar" ? "جارٍ الحفظ..." : "Saving...") : (lang === "ar" ? "حفظ التعديلات" : "Save Changes")}
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      [lang === "ar" ? "العنوان" : "Title", content.title],
                      [lang === "ar" ? "اللغة" : "Language", content.language.toUpperCase()],
                      [lang === "ar" ? "التصنيف" : "Category", content.categoryName ?? "—"],
                      [lang === "ar" ? "التصنيف الفرعي" : "Subcategory", content.subcategoryName ?? "—"],
                      [lang === "ar" ? "عدد المشاهدات" : "Views", content.viewCount.toLocaleString()],
                      [lang === "ar" ? "تاريخ الإنشاء" : "Created", new Date(content.createdAt).toLocaleDateString("ar-EG")],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>{k}</p>
                        <p className="font-medium" style={{ color: "var(--ink)" }}>{v}</p>
                      </div>
                    ))}
                    {content.summary && (
                      <div className="col-span-2">
                        <p className="text-xs font-semibold mb-0.5" style={{ color: "var(--muted)" }}>{lang === "ar" ? "الملخص" : "Summary"}</p>
                        <p style={{ color: "var(--ink-2)" }}>{content.summary}</p>
                      </div>
                    )}
                  </div>
                )}
              </Section>

              {/* Media assets */}
              <Section title={lang === "ar" ? `الوسائط (${content.mediaAssets.length})` : `Media (${content.mediaAssets.length})`}>

                {/* Step 1: pick media type */}
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>
                    {lang === "ar" ? "١. اختر نوع الوسيط:" : "1. Select media type:"}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {UPLOAD_MEDIA_TYPES.map(t => {
                      const active = uploadMediaTypeId === t.id;
                      return (
                        <button key={t.id} onClick={() => setUploadMediaTypeId(t.id)}
                          className="flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-bold transition-all"
                          style={{
                            background: active ? "rgba(11,35,24,.08)" : "var(--surface-2)",
                            borderColor: active ? "var(--gold)" : "var(--line)",
                            color: active ? "var(--forest)" : "var(--muted)",
                            boxShadow: active ? "0 0 0 2px rgba(200,168,75,.25)" : "none",
                          }}>
                          <span className="text-2xl">{t.icon}</span>
                          <span>{lang === "ar" ? t.labelAr : t.labelEn}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: drop zone (only active after type selected) */}
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--muted)" }}>
                    {lang === "ar" ? "٢. ارفع الملف:" : "2. Upload file:"}
                  </p>
                  <div
                    className="border-2 border-dashed rounded-xl p-5 text-center transition-all"
                    style={{
                      borderColor: !uploadMediaTypeId ? "var(--line)" : dragOver ? "var(--gold)" : "var(--line-gold)",
                      background: !uploadMediaTypeId ? "var(--surface-2)" : dragOver ? "rgba(200,168,75,.06)" : "rgba(200,168,75,.02)",
                      cursor: uploadMediaTypeId ? "pointer" : "not-allowed",
                      opacity: uploadMediaTypeId ? 1 : 0.5,
                    }}
                    onDragOver={e => { e.preventDefault(); if (uploadMediaTypeId) setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); if (uploadMediaTypeId) handleFileUpload(e.dataTransfer.files); }}>
                    {!uploadMediaTypeId ? (
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        {lang === "ar" ? "اختر نوع الوسيط أولاً" : "Select media type first"}
                      </p>
                    ) : (
                      <>
                        <p className="text-2xl mb-1">{selectedUploadType?.icon}</p>
                        <p className="text-sm font-semibold mb-1" style={{ color: "var(--ink-2)" }}>
                          {lang === "ar" ? "اسحب ملفات هنا أو" : "Drop files here or"}
                        </p>
                        <label className="text-sm font-bold cursor-pointer" style={{ color: "var(--forest)" }}>
                          {lang === "ar" ? "اختر ملفات" : "Browse"}
                          <input type="file" multiple className="hidden"
                            accept={selectedUploadType?.accept}
                            onChange={e => { if (e.target.files) handleFileUpload(e.target.files); }} />
                        </label>
                        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                          {lang === "ar" ? `النوع المختار: ${selectedUploadType?.labelAr}` : `Type: ${selectedUploadType?.labelEn}`}
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Upload progress bars */}
                {uploadingFiles.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {uploadingFiles.map((f, i) => {
                      const isDone = f.status === "done";
                      const isErr = f.status === "error";
                      const barColor = isErr ? "#EF4444" : isDone ? "#22C55E" : "var(--gold)";
                      return (
                        <div key={i} className="px-3 py-2.5 rounded-xl border"
                          style={{ background: "var(--surface-2)", borderColor: isErr ? "#EF444430" : isDone ? "#22C55E30" : "var(--line)" }}>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="text-xs font-medium truncate flex-1" style={{ color: "var(--ink-2)" }}>{f.file.name}</span>
                            <span className="text-xs font-bold flex-shrink-0"
                              style={{ color: barColor }}>
                              {isErr ? "✕" : isDone ? "✓" : `${f.progress}%`}
                            </span>
                          </div>
                          {/* Progress bar */}
                          {!isErr && (
                            <div className="w-full rounded-full overflow-hidden" style={{ height: "4px", background: "var(--line)" }}>
                              <div className="h-full rounded-full transition-all duration-200"
                                style={{ width: `${f.progress}%`, background: barColor }} />
                            </div>
                          )}
                          {isErr && (
                            <p className="text-xs" style={{ color: "#EF4444" }}>{f.error}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {deleteAssetError && (
                  <p className="px-3 py-2 rounded-xl text-xs font-medium mb-2"
                    style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.20)", color: "#DC2626" }}>
                    {deleteAssetError}
                  </p>
                )}
                {content.mediaAssets.length === 0 && uploadingFiles.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>
                    {lang === "ar" ? "لا توجد وسائط مرفوعة بعد" : "No media uploaded yet"}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {content.mediaAssets.map(a => (
                      <AssetCard key={a.id} asset={a}
                        canDelete={content.status === "Draft"}
                        deleting={deletingAssetId === a.id}
                        onDelete={handleDeleteAsset} />
                    ))}
                  </div>
                )}
              </Section>
            </div>

            {/* Right column — workflow */}
            <div className="flex flex-col gap-6">
              <Section title={lang === "ar" ? "حالة المحتوى" : "Content Status"}>
                {/* Current status */}
                <div className="text-center mb-4 pb-4 border-b" style={{ borderColor: "var(--line)" }}>
                  <p className="text-xs mb-2" style={{ color: "var(--muted)" }}>{lang === "ar" ? "الحالة الحالية" : "Current Status"}</p>
                  <StatusBadge status={content.status} lang={lang} />
                  {(content as any).currentWorkflowStep && (
                    <div className="mt-2 px-3 py-1.5 rounded-xl inline-block text-xs font-semibold"
                      style={{ background: "rgba(200,168,75,.12)", color: "var(--forest)", border: "1px solid var(--line-gold)" }}>
                      {lang === "ar" ? "خطوة سير العمل: " : "Workflow Step: "}
                      <span className="font-bold">{(content as any).currentWorkflowStep}</span>
                    </div>
                  )}
                </div>

                {/* Status progression — bidirectional */}
                <div className="mb-4">
                  <p className="text-xs font-bold mb-3" style={{ color: "var(--muted)" }}>
                    {lang === "ar" ? "مسار الحالات:" : "Status Flow:"}
                  </p>
                  <div className="flex flex-col gap-2">
                    {STATUS_ORDER.map((s, i) => {
                      const currentIdx = STATUS_ORDER.indexOf(content.status as ContentStatus);
                      const isPast = i < currentIdx;
                      const isCurrent = s === content.status;
                      const isNext = i === currentIdx + 1;
                      const isPrev = i === currentIdx - 1;
                      const color = STATUS_COLOR[s];
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <div className="flex flex-col items-center">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                              style={{
                                background: isCurrent ? color : isPast ? "#22C55E" : "var(--surface-2)",
                                color: isCurrent || isPast ? "#fff" : "var(--muted)",
                                border: (isNext || isPrev) ? `2px solid ${color}` : `2px solid ${isPast ? "#22C55E" : "var(--line)"}`,
                              }}>
                              {isPast ? "✓" : i + 1}
                            </div>
                            {i < STATUS_ORDER.length - 1 && (
                              <div className="w-0.5 h-3" style={{ background: isPast ? "#22C55E" : "var(--line)" }} />
                            )}
                          </div>
                          <span className="text-xs flex-1" style={{
                            color: isCurrent ? color : isPast ? "#22C55E" : "var(--muted)",
                            fontWeight: isCurrent ? 700 : 400,
                          }}>
                            {lang === "ar" ? STATUS_LABEL_AR[s] : STATUS_LABEL_EN[s]}
                          </span>
                          {/* Forward button (next step) — only when no workflow is configured */}
                          {isNext && transitionsLoaded && transitions.length === 0 && (
                            <button
                              onClick={() => { setTargetStatus(s); setStatusComment(""); setStatusError(""); setStatusModal(true); }}
                              className="text-xs px-2 py-0.5 rounded-lg font-bold transition-all"
                              style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
                              {lang === "ar" ? "تقدُّم ←" : "Next →"}
                            </button>
                          )}
                          {/* Back button (previous step) — only when no workflow is configured */}
                          {isPrev && transitionsLoaded && transitions.length === 0 && (
                            <button
                              onClick={() => { setTargetStatus(s); setStatusComment(""); setStatusError(""); setStatusModal(true); }}
                              className="text-xs px-2 py-0.5 rounded-lg font-bold transition-all"
                              style={{ background: "rgba(107,114,128,.10)", color: "#6B7280", border: "1px solid rgba(107,114,128,.25)" }}>
                              {lang === "ar" ? "→ رجوع" : "← Back"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cancel action — only when no workflow is configured */}
                {content.status !== "Rejected" && transitionsLoaded && transitions.length === 0 && (
                  <div className="pt-3 border-t" style={{ borderColor: "var(--line)" }}>
                    <button
                      onClick={() => { setTargetStatus("Rejected"); setStatusComment(""); setStatusError(""); setStatusModal(true); }}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-bold border text-center transition-all"
                      style={{ background: "rgba(239,68,68,.06)", borderColor: "rgba(239,68,68,.30)", color: "#EF4444" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,.12)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,.06)")}>
                      🚫 {lang === "ar" ? "إلغاء المحتوى" : "Cancel Content"}
                    </button>
                  </div>
                )}

                {/* Transitions failed to load */}
                {!transitionsLoaded && transitions.length === 0 && (
                  <div className="pt-3 border-t mt-2" style={{ borderColor: "var(--line)" }}>
                    <p className="text-xs px-3 py-2 rounded-xl"
                      style={{ background: "rgba(245,158,11,.08)", border: "1px solid rgba(245,158,11,.25)", color: "#B45309" }}>
                      ⚠ {lang === "ar" ? "تعذّر تحميل إجراءات سير العمل. يرجى إعادة تحميل الصفحة." : "Could not load workflow actions. Please reload the page."}
                    </p>
                    {transitionsError && (
                      <p className="text-xs mt-1 px-3 py-1 rounded-lg font-mono break-all"
                        style={{ background: "rgba(220,38,38,.06)", color: "#DC2626", border: "1px solid rgba(220,38,38,.15)" }}>
                        {transitionsError}
                      </p>
                    )}
                  </div>
                )}

                {/* Workflow transitions (when configured in DB) */}
                {transitions.length > 0 && (
                  <div className="pt-3 border-t flex flex-col gap-2 mt-2" style={{ borderColor: "var(--line)" }}>
                    <p className="text-xs font-bold" style={{ color: "var(--muted)" }}>
                      {lang === "ar" ? "سير العمل المُعيَّن:" : "Assigned Workflow:"}
                    </p>
                    {transitions.map(tr => (
                      <button key={tr.transitionId}
                        onClick={() => { setTransitionModal(tr); setWfComment(""); setWfError(""); }}
                        className="w-full px-3 py-2 rounded-xl text-xs font-bold border text-start transition-all"
                        style={{ background: "var(--surface-2)", borderColor: "var(--line-gold)", color: "var(--forest)" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "rgba(200,168,75,.10)")}
                        onMouseLeave={e => (e.currentTarget.style.background = "var(--surface-2)")}>
                        → {tr.actionName}
                      </button>
                    ))}
                  </div>
                )}
              </Section>

              {/* Meta */}
              <Section title={lang === "ar" ? "معلومات إضافية" : "Details"}>
                <div className="flex flex-col gap-2 text-xs">
                  {[
                    [lang === "ar" ? "Slug" : "Slug", content.slug],
                    [lang === "ar" ? "المشاهدات" : "Views", content.viewCount.toLocaleString()],
                    [lang === "ar" ? "وقت الإنشاء" : "Created", new Date(content.createdAt).toLocaleString("ar-EG")],
                    ...(content.publishedAt ? [[lang === "ar" ? "وقت النشر" : "Published", new Date(content.publishedAt).toLocaleString("ar-EG")]] : []),
                    ...(content.scheduledPublishAt ? [[lang === "ar" ? "مجدول للنشر" : "Scheduled", new Date(content.scheduledPublishAt).toLocaleString("ar-EG")]] : []),
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <span style={{ color: "var(--muted)" }}>{k}</span>
                      <span className="font-semibold text-end" style={{ color: "var(--ink-2)" }}>{v}</span>
                    </div>
                  ))}
                </div>
                {content.tags.length > 0 && (
                  <div className="mt-3 pt-3 border-t flex flex-wrap gap-1" style={{ borderColor: "var(--line)" }}>
                    {content.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: "rgba(200,168,75,.12)", color: "var(--forest)", border: "1px solid var(--line-gold)" }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </Section>
            </div>
          </div>
        </div>
      </main>
      <Footer />

      {/* Workflow History Drawer */}
      {historyOpen && content && (
        <WorkflowHistoryDrawer
          contentId={content.id}
          contentTitle={content.title}
          onClose={() => setHistoryOpen(false)}
        />
      )}

      {/* Workflow transition modal */}
      {transitionModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setTransitionModal(null); }}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--line-gold)" }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--line)" }}>
              <h2 className="font-bold" style={{ color: "var(--ink)" }}>{transitionModal.actionName}</h2>
              <button onClick={() => setTransitionModal(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--surface-2)", color: "var(--muted)" }}>×</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              {transitionModal.description && (
                <p className="text-sm" style={{ color: "var(--ink-2)" }}>{transitionModal.description}</p>
              )}
              <div className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "rgba(200,168,75,.08)", border: "1px solid var(--line-gold)", color: "var(--forest)" }}>
                {lang === "ar" ? "الانتقال إلى:" : "Transitioning to:"} <strong>{transitionModal.targetStepName}</strong>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--ink-2)" }}>
                  {lang === "ar" ? "التعليق" : "Comment"} {transitionModal.requiresComment ? "*" : `(${lang === "ar" ? "اختياري" : "optional"})`}
                </label>
                <textarea required={transitionModal.requiresComment} rows={3}
                  value={wfComment} onChange={e => setWfComment(e.target.value)}
                  placeholder={lang === "ar" ? "أضف تعليقاً على هذه الخطوة..." : "Add a comment for this step..."}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
                  style={{ background: "var(--surface-2)", border: "1.5px solid var(--line)", color: "var(--ink)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--line)")} />
              </div>
              <ErrMsg msg={wfError} />
              <div className="flex gap-3">
                <button onClick={() => setTransitionModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                  {lang === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button onClick={handleTransition} disabled={wfLoading || (transitionModal.requiresComment && !wfComment.trim())}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: wfLoading ? "rgba(11,35,24,.4)" : "var(--forest)", color: "#fff", cursor: wfLoading ? "not-allowed" : "pointer" }}>
                  {wfLoading ? (lang === "ar" ? "جارٍ..." : "Processing...") : (lang === "ar" ? "تأكيد" : "Confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Direct status change modal */}
      {statusModal && targetStatus && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)" }}
          onClick={e => { if (e.target === e.currentTarget) setStatusModal(false); }}>
          <div className="w-full max-w-md rounded-3xl overflow-hidden"
            style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)", border: `1px solid ${STATUS_COLOR[targetStatus]}40` }}>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--line)" }}>
              <h2 className="font-bold" style={{ color: "var(--ink)" }}>
                {targetStatus === "Rejected"
                  ? (lang === "ar" ? "تأكيد الإلغاء" : "Confirm Cancellation")
                  : (lang === "ar" ? "تغيير الحالة" : "Change Status")}
              </h2>
              <button onClick={() => setStatusModal(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "var(--surface-2)", color: "var(--muted)" }}>×</button>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: `${STATUS_COLOR[targetStatus]}08`, border: `1px solid ${STATUS_COLOR[targetStatus]}25` }}>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>{lang === "ar" ? "من" : "From"}</p>
                  <StatusBadge status={content.status} lang={lang} />
                </div>
                <span className="text-lg" style={{ color: "var(--muted)" }}>→</span>
                <div>
                  <p className="text-xs mb-1" style={{ color: "var(--muted)" }}>{lang === "ar" ? "إلى" : "To"}</p>
                  <StatusBadge status={targetStatus} lang={lang} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--ink-2)" }}>
                  {targetStatus === "Rejected"
                    ? (lang === "ar" ? "سبب الإلغاء (اختياري)" : "Reason (optional)")
                    : (lang === "ar" ? "التعليق (اختياري)" : "Comment (optional)")}
                </label>
                <textarea rows={3} value={statusComment} onChange={e => setStatusComment(e.target.value)}
                  placeholder={targetStatus === "Rejected"
                    ? (lang === "ar" ? "سبب الإلغاء..." : "Reason for cancellation...")
                    : (lang === "ar" ? "سبب تغيير الحالة..." : "Reason for status change...")}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none resize-none transition-all"
                  style={{ background: "var(--surface-2)", border: "1.5px solid var(--line)", color: "var(--ink)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--line)")} />
              </div>
              {statusError && (
                <p className="px-3 py-2 rounded-xl text-xs font-medium"
                  style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.20)", color: "#DC2626" }}>
                  {statusError}
                </p>
              )}
              <div className="flex gap-3">
                <button onClick={() => setStatusModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
                  style={{ borderColor: "var(--line)", color: "var(--ink)" }}>
                  {lang === "ar" ? "تراجع" : "Back"}
                </button>
                <button onClick={handleStatusChange} disabled={statusLoading}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold"
                  style={{
                    background: statusLoading ? "rgba(11,35,24,.4)" : STATUS_COLOR[targetStatus],
                    color: "#fff",
                    cursor: statusLoading ? "not-allowed" : "pointer"
                  }}>
                  {statusLoading ? (lang === "ar" ? "جارٍ..." : "Saving...") : (lang === "ar" ? "تأكيد" : "Confirm")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
