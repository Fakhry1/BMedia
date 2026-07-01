"use client";

import { useEffect, useState, useRef } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  createSubcategory, updateSubcategory, deleteSubcategory,
  type CategoryDto, type SubcategoryDto,
} from "@/lib/categories";
import { getUser } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { useLang } from "@/lib/LangContext";

/* ─── helpers ─────────────────────────────────────────────────── */
const GRADIENTS = [
  "radial-gradient(ellipse at 30% 30%,rgba(200,168,75,.18),transparent 55%),linear-gradient(145deg,#DEEADC,#EFF5ED)",
  "radial-gradient(ellipse at 70% 25%,rgba(200,168,75,.22),transparent 55%),linear-gradient(145deg,#F0E8D8,#FAF3E6)",
  "radial-gradient(ellipse at 40% 60%,rgba(26,67,50,.12),transparent 55%),linear-gradient(145deg,#E5EAE8,#F2F5F3)",
  "radial-gradient(ellipse at 60% 40%,rgba(200,168,75,.15),transparent 55%),linear-gradient(145deg,#EAE5F0,#F5F2FA)",
  "radial-gradient(ellipse at 20% 70%,rgba(26,67,50,.15),transparent 55%),linear-gradient(145deg,#DCEAE5,#EDF5F1)",
  "radial-gradient(ellipse at 80% 60%,rgba(200,168,75,.20),transparent 55%),linear-gradient(145deg,#F5EDD8,#FAF5E8)",
];
const ICONS: Record<string, string> = { default: "📂", فيديو: "🎬", video: "🎬", صوت: "🎙", audio: "🎙", مقالات: "📖", articles: "📖", صور: "🖼", images: "🖼", تقنية: "💻", tech: "💻", تصميم: "🎨", design: "🎨", أمان: "🔒", security: "🔒" };
const catIcon = (name: string, url: string | null) => url ? null : (ICONS[name.toLowerCase()] ?? ICONS.default);

function canManage() {
  const u = getUser();
  if (!u) return false;
  return u.roles.includes("Administrator") || u.permissions.includes("ManageCategories");
}

/* ─── modal shell ─────────────────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,.55)", backdropFilter: "blur(6px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} tabIndex={-1} className="w-full max-w-md rounded-3xl overflow-hidden outline-none"
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)", border: "1px solid var(--line-gold)" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <h2 className="font-bold" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", color: "var(--ink)" }}>{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
            style={{ background: "var(--surface-2)", color: "var(--muted)" }}>×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-semibold mb-1.5" style={{ color: "var(--ink-2)" }}>{label}</label>{children}</div>;
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
      style={{ background: "var(--surface-2)", border: "1.5px solid var(--line)", color: "var(--ink)", ...props.style }}
      onFocus={e => (e.currentTarget.style.borderColor = "var(--gold)")}
      onBlur={e => (e.currentTarget.style.borderColor = "var(--line)")} />
  );
}
function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} rows={3} className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all resize-none"
      style={{ background: "var(--surface-2)", border: "1.5px solid var(--line)", color: "var(--ink)", ...props.style }}
      onFocus={e => (e.currentTarget.style.borderColor = "var(--gold)")}
      onBlur={e => (e.currentTarget.style.borderColor = "var(--line)")} />
  );
}
function ErrMsg({ msg }: { msg: string }) {
  return msg ? <p className="px-3 py-2 rounded-xl text-xs font-medium"
    style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.20)", color: "#DC2626" }}>{msg}</p> : null;
}

/* ─── Add/Edit Category modal ─────────────────────────────────── */
function CategoryModal({ initial, onClose, onSaved }: {
  initial?: CategoryDto;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t, lang } = useLang();
  const isAr = lang === "ar";
  const [name, setName]       = useState(initial?.name ?? "");
  const [nameEn, setNameEn]   = useState("");
  const [desc, setDesc]       = useState(initial?.description ?? "");
  const [descEn, setDescEn]   = useState("");
  const [iconUrl, setIconUrl] = useState(initial?.iconUrl ?? "");
  const [order, setOrder]     = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");
  const isEdit = !!initial;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      if (isEdit) {
        await updateCategory(initial!.id, { name, nameEn: nameEn || undefined, description: desc || undefined, descriptionEn: descEn || undefined, iconUrl: iconUrl || undefined, sortOrder: order, isActive });
      } else {
        await createCategory({ name, nameEn: nameEn || undefined, description: desc || undefined, descriptionEn: descEn || undefined, iconUrl: iconUrl || undefined, sortOrder: order });
      }
      onSaved(); onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.unexpectedError);
    } finally { setLoading(false); }
  }

  return (
    <Modal title={isEdit ? t.editMainCategory : t.addMainCategory} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={isAr ? "الاسم بالعربي" : "Name (Arabic)"}><Input required value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label={isAr ? "الاسم بالإنجليزي" : "Name (English)"}><Input value={nameEn} onChange={e => setNameEn(e.target.value)} dir="ltr" /></Field>
        <Field label={isAr ? "الوصف بالعربي" : "Description (Arabic)"}><Textarea value={desc} onChange={e => setDesc(e.target.value)} /></Field>
        <Field label={isAr ? "الوصف بالإنجليزي" : "Description (English)"}><Textarea value={descEn} onChange={e => setDescEn(e.target.value)} dir="ltr" /></Field>
        <Field label={t.iconUrl}><Input value={iconUrl} onChange={e => setIconUrl(e.target.value)} placeholder="https://..." /></Field>
        <Field label={t.sortOrder}><Input type="number" value={order} onChange={e => setOrder(+e.target.value)} min={0} /></Field>
        {isEdit && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>{t.isActive}</span>
          </label>
        )}
        <ErrMsg msg={err} />
        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: loading ? "rgba(11,35,24,.4)" : "var(--forest)", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? t.saving : isEdit ? t.save : t.add}
        </button>
      </form>
    </Modal>
  );
}

/* ─── Add/Edit Subcategory modal ───────────────────────────────── */
function SubModal({ categoryId, categoryName, initial, onClose, onSaved }: {
  categoryId: string; categoryName: string;
  initial?: SubcategoryDto;
  onClose: () => void; onSaved: () => void;
}) {
  const { t, lang } = useLang();
  const isAr = lang === "ar";
  const [name, setName]     = useState(initial?.name ?? "");
  const [nameEn, setNameEn] = useState("");
  const [desc, setDesc]     = useState("");
  const [descEn, setDescEn] = useState("");
  const [order, setOrder]   = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr]       = useState("");
  const isEdit = !!initial;

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      if (isEdit) {
        await updateSubcategory(initial!.id, { name, nameEn: nameEn || undefined, description: desc || undefined, descriptionEn: descEn || undefined, sortOrder: order, isActive });
      } else {
        await createSubcategory({ categoryId, name, nameEn: nameEn || undefined, description: desc || undefined, descriptionEn: descEn || undefined, sortOrder: order });
      }
      onSaved(); onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t.unexpectedError);
    } finally { setLoading(false); }
  }

  return (
    <Modal title={`${isEdit ? t.editSubTitle : t.addSubTitle} — ${categoryName}`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label={isAr ? "الاسم بالعربي" : "Name (Arabic)"}><Input required value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field label={isAr ? "الاسم بالإنجليزي" : "Name (English)"}><Input value={nameEn} onChange={e => setNameEn(e.target.value)} dir="ltr" /></Field>
        <Field label={isAr ? "الوصف بالعربي" : "Description (Arabic)"}><Textarea value={desc} onChange={e => setDesc(e.target.value)} /></Field>
        <Field label={isAr ? "الوصف بالإنجليزي" : "Description (English)"}><Textarea value={descEn} onChange={e => setDescEn(e.target.value)} dir="ltr" /></Field>
        <Field label={t.sortOrder}><Input type="number" value={order} onChange={e => setOrder(+e.target.value)} min={0} /></Field>
        {isEdit && (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm font-medium" style={{ color: "var(--ink-2)" }}>{t.isActive}</span>
          </label>
        )}
        <ErrMsg msg={err} />
        <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-bold transition-all"
          style={{ background: loading ? "rgba(11,35,24,.4)" : "var(--forest)", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? t.saving : isEdit ? t.save : t.add}
        </button>
      </form>
    </Modal>
  );
}

/* ─── Delete confirm ───────────────────────────────────────────── */
function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  const { t } = useLang();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function confirm() {
    setLoading(true);
    try { await onConfirm(); onClose(); }
    catch (e) { setErr(e instanceof ApiError ? e.message : t.unexpectedError); }
    finally { setLoading(false); }
  }

  return (
    <Modal title={t.confirmDelete} onClose={onClose}>
      <div className="flex flex-col gap-5">
        <p className="text-sm" style={{ color: "var(--ink-2)" }}>
          {t.deleteWarning} <strong>«{name}»</strong>؟ {t.deleteWarning2}
        </p>
        <ErrMsg msg={err} />
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-bold border"
            style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--surface-2)" }}>{t.cancel}</button>
          <button onClick={confirm} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: loading ? "rgba(220,38,38,.4)" : "#DC2626", color: "#fff", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? t.deleting : t.delete}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ─── action button ────────────────────────────────────────────── */
function ActionBtn({ onClick, color, title, children }: { onClick: () => void; color: string; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className="w-6 h-6 rounded-lg flex items-center justify-center text-xs transition-all"
      style={{ background: `rgba(${color},.12)`, color: `rgb(${color})`, border: `1px solid rgba(${color},.20)` }}
      onMouseEnter={e => (e.currentTarget.style.background = `rgba(${color},.22)`)}
      onMouseLeave={e => (e.currentTarget.style.background = `rgba(${color},.12)`)}>
      {children}
    </button>
  );
}

/* ─── main page ────────────────────────────────────────────────── */
type ModalState =
  | { kind: "addCat" }
  | { kind: "editCat"; cat: CategoryDto }
  | { kind: "delCat"; cat: CategoryDto }
  | { kind: "addSub"; cat: CategoryDto }
  | { kind: "editSub"; sub: SubcategoryDto; catId: string; catName: string }
  | { kind: "delSub"; sub: SubcategoryDto }
  | null;

export default function CategoriesPage() {
  const { t, lang } = useLang();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [manage, setManage] = useState(false);

  function load() {
    setLoading(true); setError("");
    getCategories(true, lang).then(setCategories).catch(() => setError(t.loadError)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); setManage(canManage()); }, [lang]);

  return (
    <>
      <Header />
      <main className="flex-1">

        {/* Page header */}
        <section className="py-12 relative overflow-hidden"
          style={{ background: "linear-gradient(150deg,var(--forest),#142E22)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 50% 50%,rgba(200,168,75,.14),transparent 60%)" }} />
          <div className="container-main relative z-10 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-3">
                <span className="w-5 h-0.5 rounded" style={{ background: "var(--gold)" }} />
                <span style={{ color: "var(--gold)" }}>{t.browseContent}</span>
              </div>
              <h1 className="font-extrabold text-white" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", fontSize: "clamp(26px,5vw,42px)" }}>
                {t.categoriesTitle}
              </h1>
              <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,.60)" }}>{t.categoriesSubtitle}</p>
            </div>
            {manage && (
              <button onClick={() => setModal({ kind: "addCat" })}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
                style={{ background: "var(--gold)", color: "var(--forest)", boxShadow: "var(--shadow-gold)" }}>
                {t.addCategory}
              </button>
            )}
          </div>
        </section>

        <section className="py-12">
          <div className="container-main">

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border h-52 animate-pulse"
                    style={{ background: "var(--surface-2)", borderColor: "var(--line)" }} />
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-16">
                <p className="text-lg font-bold mb-2" style={{ color: "var(--ink)" }}>⚠️ {error}</p>
                <button onClick={load} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
                  style={{ background: "var(--forest)", color: "#fff" }}>{t.retry}</button>
              </div>
            )}

            {!loading && !error && categories.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">📂</p>
                <p className="font-bold mb-1" style={{ color: "var(--ink)" }}>{t.noSubcategories}</p>
                {manage && (
                  <button onClick={() => setModal({ kind: "addCat" })}
                    className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
                    style={{ background: "var(--forest)", color: "#fff" }}>{t.addFirst}</button>
                )}
              </div>
            )}

            {!loading && !error && categories.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {categories.map((cat, idx) => {
                  const icon = catIcon(cat.name, cat.iconUrl);
                  const isOpen = expanded === cat.id;

                  return (
                    <div key={cat.id} className="rounded-2xl border overflow-hidden flex flex-col transition-all duration-200"
                      style={{ background: "var(--surface)", borderColor: isOpen ? "var(--gold)" : "var(--line)", boxShadow: isOpen ? "var(--shadow-md)" : "var(--shadow-sm)" }}>

                      {/* Thumbnail */}
                      <div className="h-32 relative flex items-center justify-center"
                        style={{ background: GRADIENTS[idx % GRADIENTS.length] }}>
                        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 40%,rgba(0,0,0,.18))" }} />
                        {cat.iconUrl
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={cat.iconUrl} alt={cat.name} className="w-14 h-14 object-contain relative z-10" />
                          : <span className="text-5xl relative z-10">{icon}</span>}
                        {cat.subcategories.length > 0 && (
                          <span className="absolute top-3 left-3 text-xs font-black px-2 py-0.5 rounded-lg z-10"
                            style={{ background: "rgba(255,255,255,.90)", color: "var(--forest)" }}>
                            {cat.subcategories.length} {t.subcategories.split(" ")[0]}
                          </span>
                        )}
                        {/* Edit/Delete buttons for main category */}
                        {manage && (
                          <div className="absolute top-2 right-2 flex gap-1 z-10">
                            <button onClick={() => setModal({ kind: "editCat", cat })}
                              title={t.save}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                              style={{ background: "rgba(255,255,255,.85)", color: "var(--forest)" }}>✎</button>
                            <button onClick={() => setModal({ kind: "delCat", cat })}
                              title={t.delete}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                              style={{ background: "rgba(220,38,38,.85)", color: "#fff" }}>✕</button>
                          </div>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-5 flex flex-col gap-2 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="font-bold" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", fontSize: "17px", color: "var(--ink)" }}>
                            {cat.name}
                          </h2>
                          {manage && (
                            <button onClick={() => setModal({ kind: "addSub", cat })}
                              title={t.addSubcategory}
                              className="flex-shrink-0 px-2 h-7 rounded-lg text-xs font-bold transition-all"
                              style={{ background: "rgba(200,168,75,.12)", color: "var(--forest)", border: "1px solid var(--line-gold)" }}>
                              + {t.subcategories.split(" ")[0]}
                            </button>
                          )}
                        </div>
                        {cat.description && (
                          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{cat.description}</p>
                        )}

                        <div className="mt-auto pt-3 border-t" style={{ borderColor: "var(--line)" }}>
                          {cat.subcategories.length > 0 ? (
                            <>
                              <button onClick={() => setExpanded(isOpen ? null : cat.id)}
                                className="flex items-center justify-between w-full text-xs font-bold mb-2"
                                style={{ color: "var(--forest)" }}>
                                <span>{t.subcategories} ({cat.subcategories.length})</span>
                                <span style={{ display: "inline-block", transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform .2s" }}>▼</span>
                              </button>
                              {isOpen && (
                                <div className="flex flex-col gap-1.5 mt-2">
                                  {cat.subcategories.map(sub => (
                                    <div key={sub.id} className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl"
                                      style={{ background: "var(--surface-2)", border: "1px solid var(--line)" }}>
                                      <span className="text-xs font-semibold" style={{ color: "var(--ink-2)" }}>{sub.name}</span>
                                      {manage && (
                                        <div className="flex gap-1 flex-shrink-0">
                                          <ActionBtn onClick={() => setModal({ kind: "editSub", sub, catId: cat.id, catName: cat.name })}
                                            color="11,35,24" title={t.save}>✎</ActionBtn>
                                          <ActionBtn onClick={() => setModal({ kind: "delSub", sub })}
                                            color="220,38,38" title={t.delete}>✕</ActionBtn>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-xs" style={{ color: "var(--muted)" }}>{t.noSubcategories}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {modal?.kind === "addCat" && <CategoryModal onClose={() => setModal(null)} onSaved={load} />}
      {modal?.kind === "editCat" && <CategoryModal initial={modal.cat} onClose={() => setModal(null)} onSaved={load} />}
      {modal?.kind === "delCat" && (
        <DeleteModal name={modal.cat.name} onClose={() => setModal(null)}
          onConfirm={() => deleteCategory(modal.cat.id).then(load)} />
      )}
      {modal?.kind === "addSub" && (
        <SubModal categoryId={modal.cat.id} categoryName={modal.cat.name} onClose={() => setModal(null)} onSaved={load} />
      )}
      {modal?.kind === "editSub" && (
        <SubModal categoryId={modal.catId} categoryName={modal.catName} initial={modal.sub} onClose={() => setModal(null)} onSaved={load} />
      )}
      {modal?.kind === "delSub" && (
        <DeleteModal name={modal.sub.name} onClose={() => setModal(null)}
          onConfirm={() => deleteSubcategory(modal.sub.id).then(load)} />
      )}
    </>
  );
}
