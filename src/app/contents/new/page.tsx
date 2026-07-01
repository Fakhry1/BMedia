"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import { createContent, uploadAsset, guessMediaType } from "@/lib/contents";
import { fetchPublicCategories, type PubCategory } from "@/lib/public";
import { ApiError } from "@/lib/api";
import { useLang } from "@/lib/LangContext";
import { isLoggedIn } from "@/lib/auth";

const LANGS = [
  { code: "ar", label: "العربية" }, { code: "en", label: "English" },
  { code: "fr", label: "Français" }, { code: "ur", label: "اردو" },
];

const FILE_TYPE_MAP: { mime: string; icon: string; label: string; color: string }[] = [
  { mime: "video/", icon: "🎬", label: "فيديو",    color: "#10B981" },
  { mime: "image/", icon: "🖼️", label: "صورة",     color: "#3B82F6" },
  { mime: "audio/", icon: "🎧", label: "صوت",      color: "#8B5CF6" },
  { mime: "application/pdf", icon: "📋", label: "PDF", color: "#EF4444" },
  { mime: "",       icon: "📄", label: "مستند",    color: "#F59E0B" },
];

function getFileType(mime: string) {
  return FILE_TYPE_MAP.find(t => t.mime && mime.startsWith(t.mime)) ?? FILE_TYPE_MAP[FILE_TYPE_MAP.length - 1];
}

interface UploadedFile {
  file: File;
  mediaType: number;
  isPrimary: boolean;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  assetId?: string;
  publicUrl?: string;
  error?: string;
}

/* ─── Step indicator ─────────────────────────────────────── */
function StepBar({ step, labels }: { step: number; labels: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
      {labels.map((label, i) => {
        const n = i + 1;
        const done   = step > n;
        const active = step === n;
        return (
          <div key={n} style={{ display: "flex", alignItems: "center", flex: i < labels.length - 1 ? 1 : "none" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 800, fontSize: 15, transition: "all .3s",
                background: done ? "var(--forest)" : active ? "var(--gold)" : "var(--surface-2)",
                color: done ? "#fff" : active ? "var(--forest)" : "var(--muted-2)",
                border: `2px solid ${done ? "var(--forest)" : active ? "var(--gold)" : "var(--line)"}`,
                boxShadow: active ? "0 0 0 4px rgba(200,168,75,.18)" : "none",
              }}>
                {done ? "✓" : n}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", color: active ? "var(--ink)" : "var(--muted-2)" }}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div style={{ flex: 1, height: 2, margin: "0 8px", marginBottom: 22, borderRadius: 2, background: done ? "var(--forest)" : "var(--line)", transition: "background .3s" }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Form field components ──────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)" }}>{label}</label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focus, setFocus] = useState(false);
  return (
    <input {...props}
      onFocus={e => { setFocus(true); props.onFocus?.(e); }}
      onBlur={e => { setFocus(false); props.onBlur?.(e); }}
      style={{
        width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 14, outline: "none",
        background: "var(--surface-2)", color: "var(--ink)",
        border: `1.5px solid ${focus ? "var(--gold)" : "var(--line)"}`,
        transition: "border-color .15s", boxSizing: "border-box",
        ...props.style,
      }} />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focus, setFocus] = useState(false);
  return (
    <textarea {...props} rows={3}
      onFocus={e => { setFocus(true); props.onFocus?.(e); }}
      onBlur={e => { setFocus(false); props.onBlur?.(e); }}
      style={{
        width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 14, outline: "none",
        background: "var(--surface-2)", color: "var(--ink)", resize: "none",
        border: `1.5px solid ${focus ? "var(--gold)" : "var(--line)"}`,
        transition: "border-color .15s", boxSizing: "border-box", fontFamily: "inherit",
        ...props.style,
      }} />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props}
      style={{
        width: "100%", padding: "11px 14px", borderRadius: 12, fontSize: 14, outline: "none",
        background: "var(--surface-2)", color: "var(--ink)",
        border: "1.5px solid var(--line)", boxSizing: "border-box", cursor: "pointer",
        ...props.style,
      }} />
  );
}

function ErrBanner({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div style={{ padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.2)", color: "#DC2626" }}>
      <span>⚠</span> {msg}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────── */
export default function NewContentPage() {
  const { lang } = useLang();
  const router   = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
  const [title, setTitle]           = useState("");
  const [titleEn, setTitleEn]       = useState("");
  const [summary, setSummary]       = useState("");
  const [summaryEn, setSummaryEn]   = useState("");
  const [language, setLanguage]     = useState("ar");
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [categories, setCategories] = useState<PubCategory[]>([]);
  const [step1Error, setStep1Error] = useState("");
  const [creating, setCreating]     = useState(false);
  const [contentId, setContentId]   = useState("");

  // Step 2
  const [files, setFiles]     = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) { router.replace("/login"); return; }
    fetchPublicCategories(lang).then(setCategories).catch(() => {});
  }, [router, lang]);

  const selectedCat = categories.find(c => c.id === categoryId);
  const isAr = lang === "ar";

  /* ── Step 1 submit ─────────────────────────────────── */
  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setStep1Error(""); setCreating(true);
    try {
      const res = await createContent({
        title, titleEn: titleEn || undefined,
        summary: summary || undefined, summaryEn: summaryEn || undefined,
        language,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        scheduledPublishAt: scheduledAt || undefined,
      });
      setContentId(res.contentId);
      setStep(2);
    } catch (err) {
      setStep1Error(err instanceof ApiError ? err.message : (isAr ? "حدث خطأ غير متوقع" : "Unexpected error"));
    } finally { setCreating(false); }
  }

  /* ── Step 2 file handling ──────────────────────────── */
  function addFiles(fileList: FileList) {
    const newFiles: UploadedFile[] = Array.from(fileList).map(f => ({
      file: f, mediaType: guessMediaType(f),
      isPrimary: files.length === 0,
      status: "pending", progress: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }

  async function uploadAll() {
    const pending = files.filter(f => f.status === "pending");
    if (pending.length === 0) { setStep(3); return; }
    setUploading(true);
    let hasError = false;
    for (let i = 0; i < files.length; i++) {
      if (files[i].status !== "pending") continue;
      setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: "uploading", progress: 10 } : f));
      try {
        const res = await uploadAsset({
          file: files[i].file, contentId, mediaType: files[i].mediaType,
          language, isPrimary: files[i].isPrimary, sortOrder: i,
        });
        setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: "done", progress: 100, assetId: res.assetId, publicUrl: res.blobUrl } : f));
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setFiles(prev => prev.map((f, j) => j === i ? { ...f, status: "error", error: msg } : f));
        hasError = true;
      }
    }
    setUploading(false);
    if (!hasError) setStep(3);
  }

  const stepLabels = isAr
    ? ["المعلومات الأساسية", "رفع الملفات", "مكتمل"]
    : ["Basic Info", "Upload Files", "Done"];

  const pendingCount = files.filter(f => f.status === "pending").length;

  return (
    <>
      <Header />
      <main style={{ flex: 1, padding: "40px 0 80px", background: "var(--bg)" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px" }}>

          {/* Page title */}
          <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/contents" style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line)", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", textDecoration: "none", fontSize: 18, flexShrink: 0 }}>←</a>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", margin: 0, fontFamily: "'Noto Kufi Arabic',sans-serif" }}>
                {isAr ? "إضافة محتوى جديد" : "New Content"}
              </h1>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: "3px 0 0" }}>
                {isAr ? "أنشئ محتوى جديداً وأرفق ملفاته" : "Create new content and attach its files"}
              </p>
            </div>
          </div>

          {/* Step bar */}
          <StepBar step={step} labels={stepLabels} />

          {/* ══ STEP 1 ══ */}
          {step === 1 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 24, overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              {/* Card header */}
              <div style={{ padding: "20px 28px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(200,168,75,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📝</div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>{isAr ? "معلومات المحتوى" : "Content Information"}</h2>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>{isAr ? "أدخل بيانات المحتوى الأساسية" : "Enter the basic content details"}</p>
                </div>
              </div>

              <form onSubmit={handleStep1} style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
                <Field label={isAr ? "العنوان بالعربي *" : "Title (Arabic) *"}>
                  <Input required value={title} onChange={e => setTitle(e.target.value)}
                    placeholder={isAr ? "أدخل عنوان المحتوى..." : "Enter content title in Arabic..."} />
                </Field>

                <Field label={isAr ? "العنوان بالإنجليزي" : "Title (English)"}>
                  <Input value={titleEn} onChange={e => setTitleEn(e.target.value)}
                    dir="ltr" placeholder="Enter content title in English..." />
                </Field>

                <Field label={isAr ? "الملخص بالعربي" : "Summary (Arabic)"}>
                  <Textarea value={summary} onChange={e => setSummary(e.target.value)}
                    placeholder={isAr ? "وصف مختصر للمحتوى (اختياري)..." : "Brief description in Arabic (optional)..."} />
                </Field>

                <Field label={isAr ? "الملخص بالإنجليزي" : "Summary (English)"}>
                  <Textarea value={summaryEn} onChange={e => setSummaryEn(e.target.value)}
                    dir="ltr" placeholder="Brief description in English (optional)..." />
                </Field>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <Field label={isAr ? "اللغة *" : "Language *"}>
                    <Select required value={language} onChange={e => setLanguage(e.target.value)}>
                      {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </Select>
                  </Field>
                  <Field label={isAr ? "التصنيف" : "Category"}>
                    <Select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubcategoryId(""); }}>
                      <option value="">{isAr ? "— اختر تصنيف —" : "— Select category —"}</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </Field>
                </div>

                {selectedCat && selectedCat.subcategories.length > 0 && (
                  <Field label={isAr ? "التصنيف الفرعي" : "Subcategory"}>
                    <Select value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)}>
                      <option value="">{isAr ? "— اختر —" : "— Select —"}</option>
                      {selectedCat.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  </Field>
                )}

                <Field label={isAr ? "موعد النشر (اختياري)" : "Scheduled Publish (optional)"}>
                  <Input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                </Field>

                <ErrBanner msg={step1Error} />

                <button type="submit" disabled={creating} style={{
                  padding: "13px", borderRadius: 14, border: "none", fontSize: 14, fontWeight: 700,
                  background: creating ? "var(--surface-2)" : "var(--forest)", color: creating ? "var(--muted)" : "#fff",
                  cursor: creating ? "not-allowed" : "pointer", transition: "all .15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  {creating
                    ? <><Spinner />{isAr ? "جارٍ الإنشاء..." : "Creating..."}</>
                    : <>{isAr ? "التالي: رفع الملفات" : "Next: Upload Files"} →</>
                  }
                </button>
              </form>
            </div>
          )}

          {/* ══ STEP 2 ══ */}
          {step === 2 && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 24, overflow: "hidden", boxShadow: "var(--shadow-md)" }}>
              {/* Card header */}
              <div style={{ padding: "20px 28px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(16,185,129,.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📁</div>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", margin: 0 }}>{isAr ? "رفع الملفات والوسائط" : "Upload Files & Media"}</h2>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0 0" }}>{isAr ? "أضف الفيديوهات والصور والصوتيات والمستندات" : "Add videos, images, audio and documents"}</p>
                </div>
              </div>

              <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
                {/* Drop zone */}
                <label
                  style={{
                    display: "block", border: `2px dashed ${dragOver ? "var(--gold)" : "var(--line)"}`,
                    borderRadius: 18, padding: "44px 20px", textAlign: "center",
                    background: dragOver ? "rgba(200,168,75,.05)" : "var(--surface-2)",
                    cursor: "pointer", transition: "all .2s",
                  }}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>☁️</div>
                  <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", margin: "0 0 6px" }}>
                    {isAr ? "اسحب الملفات هنا أو اضغط للاختيار" : "Drag files here or click to browse"}
                  </p>
                  <p style={{ fontSize: 12, color: "var(--muted)", margin: "0 0 16px" }}>
                    {isAr ? "يدعم: فيديو، صور، صوت، PDF، مستندات" : "Supports: video, images, audio, PDF, documents"}
                  </p>
                  <span style={{
                    display: "inline-block", padding: "8px 22px", borderRadius: 10,
                    background: "var(--forest)", color: "#fff", fontSize: 13, fontWeight: 700,
                  }}>
                    {isAr ? "اختر ملفات" : "Browse Files"}
                  </span>
                  <input type="file" multiple style={{ display: "none" }}
                    accept="video/*,image/*,audio/*,.pdf,.doc,.docx"
                    onChange={e => { if (e.target.files) addFiles(e.target.files); }} />
                </label>

                {/* File list */}
                {files.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-2)", margin: 0 }}>
                      {isAr ? `${files.length} ملف` : `${files.length} file(s)`}
                    </p>
                    {files.map((f, i) => {
                      const ft = getFileType(f.file.type);
                      const isDone = f.status === "done";
                      const isErr  = f.status === "error";
                      const isUp   = f.status === "uploading";
                      return (
                        <div key={i} style={{
                          borderRadius: 14, border: `1px solid ${isErr ? "rgba(220,38,38,.3)" : isDone ? "rgba(34,197,94,.3)" : "var(--line)"}`,
                          background: isErr ? "rgba(220,38,38,.04)" : isDone ? "rgba(34,197,94,.04)" : "var(--surface-2)",
                          padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                        }}>
                          {/* Icon */}
                          <div style={{ width: 42, height: 42, borderRadius: 12, background: `${ft.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                            {ft.icon}
                          </div>

                          {/* Info */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.file.name}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontSize: 11, color: "var(--muted-2)" }}>{(f.file.size / 1024 / 1024).toFixed(2)} MB</span>
                              {isDone && <span style={{ fontSize: 11, fontWeight: 700, color: "#22C55E" }}>✓ {isAr ? "تم الرفع" : "Uploaded"}</span>}
                              {isErr  && <span style={{ fontSize: 11, fontWeight: 600, color: "#EF4444" }}>✕ {f.error}</span>}
                              {isUp   && <span style={{ fontSize: 11, color: "var(--gold)" }}>{isAr ? "جارٍ الرفع..." : "Uploading..."}</span>}
                            </div>
                            {isUp && (
                              <div style={{ height: 3, borderRadius: 2, background: "var(--line)", marginTop: 6 }}>
                                <div style={{ height: "100%", width: `${f.progress}%`, borderRadius: 2, background: "var(--gold)", transition: "width .3s" }} />
                              </div>
                            )}
                          </div>

                          {/* Primary + delete */}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, cursor: "pointer", color: "var(--muted)" }}>
                              <input type="radio" name="primary" checked={f.isPrimary}
                                onChange={() => setFiles(prev => prev.map((p, j) => ({ ...p, isPrimary: j === i })))} />
                              {isAr ? "رئيسي" : "Primary"}
                            </label>
                            {f.status === "pending" && (
                              <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                                style={{ width: 28, height: 28, borderRadius: 8, border: "none", background: "rgba(220,38,38,.1)", color: "#DC2626", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: "flex", gap: 12 }}>
                  <button onClick={() => setStep(3)} style={{
                    flex: 1, padding: "12px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                    border: "1px solid var(--line)", background: "transparent", color: "var(--ink)", cursor: "pointer",
                  }}>
                    {isAr ? "تخطّي" : "Skip"}
                  </button>
                  <button onClick={uploadAll} disabled={uploading || pendingCount === 0} style={{
                    flex: 2, padding: "12px", borderRadius: 12, fontSize: 14, fontWeight: 700, border: "none",
                    background: (uploading || pendingCount === 0) ? "var(--surface-2)" : "var(--forest)",
                    color: (uploading || pendingCount === 0) ? "var(--muted)" : "#fff",
                    cursor: (uploading || pendingCount === 0) ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .15s",
                  }}>
                    {uploading
                      ? <><Spinner />{isAr ? "جارٍ الرفع..." : "Uploading..."}</>
                      : pendingCount > 0
                        ? `${isAr ? "رفع" : "Upload"} ${pendingCount} ${isAr ? "ملف" : "file(s)"} ↑`
                        : (isAr ? "إنهاء" : "Finish")
                    }
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 3 ══ */}
          {step === 3 && (
            <div style={{
              background: "var(--surface)", border: "1px solid var(--line-gold)", borderRadius: 24,
              padding: "56px 28px", textAlign: "center", boxShadow: "var(--shadow-md)",
            }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, background: "rgba(34,197,94,.10)", border: "2px solid rgba(34,197,94,.25)" }}>
                ✓
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)", margin: "0 0 8px", fontFamily: "'Noto Kufi Arabic',sans-serif" }}>
                {isAr ? "تم إنشاء المحتوى بنجاح!" : "Content Created!"}
              </h2>
              <p style={{ color: "var(--muted)", fontSize: 14, margin: "0 0 32px" }}>
                {isAr ? "يمكنك الآن إدارة المحتوى ومتابعة سير العمل" : "You can now manage the content and track workflow progress"}
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                <button onClick={() => router.push(`/contents/${contentId}`)} style={{
                  padding: "12px 24px", borderRadius: 12, border: "none",
                  background: "var(--forest)", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>
                  {isAr ? "إدارة المحتوى" : "Manage Content"}
                </button>
                <button onClick={() => router.push("/contents/new")} style={{
                  padding: "12px 24px", borderRadius: 12,
                  border: "1px solid var(--line-gold)", background: "transparent",
                  color: "var(--forest)", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}>
                  + {isAr ? "محتوى جديد" : "Add Another"}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}

function Spinner() {
  return (
    <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,.3)", borderTopColor: "#fff", animation: "spin .7s linear infinite" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
