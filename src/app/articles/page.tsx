"use client";

import { useState, useEffect, useRef, useCallback, type MouseEvent } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Pagination } from "@/components/shared/CategoryScreen";
import {
  matchesMediaType, fetchPublicDetail, fetchSignedUrl,
  fetchPublicCategories, fetchPublicContents, downloadBlob,
  type PublicItem, type PubCategory,
} from "@/lib/public";
import { useLang } from "@/lib/LangContext";

function usePageSize() {
  const [size, setSize] = useState(16);
  useEffect(() => {
    function update() { setSize(window.innerWidth <= 480 ? 8 : 16); }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

/* helpers */
const PALETTE = ["#2563EB","#7C3AED","#059669","#D97706","#DB2777","#0891B2","#DC2626"];
const accent  = (t: string) => PALETTE[t.charCodeAt(0) % PALETTE.length];

function fmtDate(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" })
    : "";
}

function readEstimate(summary: string | null) {
  if (!summary) return "";
  const words = summary.trim().split(/\s+/).length;
  const mins  = Math.max(1, Math.round(words / 200));
  return `${mins} دقيقة للقراءة`;
}

/* ── Subcategory filter bar ─────────────────────────────────── */
function SubFilter({
  subs, activeSubId, onSelect,
}: {
  subs: PubCategory["subcategories"];
  activeSubId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (subs.length === 0) return null;
  return (
    <div style={{
      position: "sticky", top: 65, zIndex: 40,
      background: "color-mix(in srgb,var(--bg) 94%,transparent)",
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderBottom: "1px solid var(--line)",
    }}>
      <div className="ar-wrap">
        <div style={{
          display: "flex", gap: 8, alignItems: "center",
          padding: "10px 0", overflowX: "auto", scrollbarWidth: "none",
        }}>
          <span style={{ fontSize: 12, color: "var(--muted-2)", fontWeight: 600, flexShrink: 0 }}>تصفية:</span>
          {[{ id: null, name: "الكل" }, ...subs.map(s => ({ id: s.id, name: s.name }))].map(s => {
            const active = s.id === activeSubId;
            return (
              <button key={s.id ?? "__all"} onClick={() => onSelect(s.id)}
                style={{
                  flexShrink: 0, padding: "7px 20px", borderRadius: 999,
                  border: `1px solid ${active ? "var(--gold)" : "var(--line)"}`,
                  background: active ? "var(--gold)" : "transparent",
                  color: active ? "var(--forest)" : "var(--ink-2)",
                  fontWeight: active ? 700 : 500, fontSize: 13,
                  cursor: "pointer", transition: "all .15s",
                  boxShadow: active ? "0 2px 10px rgba(200,168,75,.28)" : "none",
                }}>
                {s.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Article Card ───────────────────────────────────────────── */
function ArticleCard({ item, onClick }: { item: PublicItem; onClick: () => void }) {
  const { lang } = useLang();
  const [hover, setHover] = useState(false);
  const [dl,    setDl]    = useState(false);
  const c = accent(item.title);

  async function handleDownload(e: MouseEvent) {
    e.stopPropagation();
    setDl(true);
    try {
      const d = await fetchPublicDetail(item.id, lang);
      const a = d.mediaAssets.find(x => matchesMediaType(x, 4)) ?? d.mediaAssets[0];
      if (!a) return;
      const __url = (await fetchSignedUrl(a.id)).url;
      const link = document.createElement("a");
      link.href = __url; link.target = "_blank"; link.rel = "noreferrer";
      link.click();
    } finally { setDl(false); }
  }

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: "var(--surface)", borderRadius: 16,
        border: "1px solid var(--line)",
        display: "flex", flexDirection: "column",
        overflow: "hidden",
        boxShadow: hover ? "0 8px 32px rgba(0,0,0,.10)" : "0 1px 4px rgba(0,0,0,.06)",
        transform: hover ? "translateY(-3px)" : "none",
        transition: "all .25s", cursor: "pointer",
      }}
    >
      {/* thumbnail */}
      {item.thumbnailUrl ? (
        <div style={{ aspectRatio: "16/9", overflow: "hidden", flexShrink: 0, position: "relative" }}>
          <Image src={item.thumbnailUrl} alt={item.title} fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            style={{ objectFit: "cover" }} />
        </div>
      ) : (
        <div style={{ height: 4, background: `linear-gradient(90deg,${c},${c}88)`, flexShrink: 0 }} />
      )}

      <div style={{ padding: "14px 16px 10px", flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        {item.categoryName && (
          <span style={{ fontSize: 10, fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: ".04em" }}>
            {item.categoryName}
          </span>
        )}
        <h3 style={{
          color: "var(--ink)", fontSize: 14, fontWeight: 800,
          lineHeight: 1.5, margin: 0,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {item.title}
        </h3>
        {item.summary && (
          <p style={{
            color: "var(--muted)", fontSize: 12, lineHeight: 1.6, margin: 0,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {item.summary}
          </p>
        )}
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px 14px", gap: 8,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {item.publishedAt && (
            <span style={{ fontSize: 10, color: "var(--muted-2)" }}>{fmtDate(item.publishedAt)}</span>
          )}
          {item.summary && (
            <span style={{ fontSize: 10, color: "var(--muted-2)" }}>{readEstimate(item.summary)}</span>
          )}
        </div>
        <button disabled={dl} onClick={handleDownload}
          style={{
            padding: "5px 10px", borderRadius: 8,
            border: "1px solid var(--line)", background: "var(--surface-2)",
            color: dl ? "var(--muted-2)" : "var(--muted)",
            fontSize: 11, fontWeight: 600,
            cursor: dl ? "default" : "pointer", transition: "all .15s",
            display: "flex", alignItems: "center", gap: 4,
          }}>
          {dl
            ? <><span className="ar-spin" style={{ width: 10, height: 10, borderRadius: "50%",
                border: "1.5px solid var(--muted)", borderTopColor: "transparent",
                display: "inline-block" }} /> جارٍ…</>
            : <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg> PDF</>
          }
        </button>
      </div>
    </article>
  );
}

/* ── Reading Drawer ─────────────────────────────────────────── */
function ReadingDrawer({ item, onClose }: { item: PublicItem; onClose: () => void }) {
  const { lang } = useLang();
  const [url,     setUrl]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(false);
  const [dl,      setDl]      = useState(false);
  const [visible, setVisible] = useState(false);
  const c = accent(item.title);

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true); setErr(false); setUrl(null);
    fetchPublicDetail(item.id, lang, ctrl.signal)
      .then(async d => {
        const a = d.mediaAssets.find(x => matchesMediaType(x, 4));
        if (!a) { setErr(true); setLoading(false); return; }
        const s = await fetchSignedUrl(a.id, ctrl.signal);
        setUrl(s.url); setLoading(false);
      })
      .catch(e => { if (e.name !== "AbortError") { setErr(true); setLoading(false); } });
    return () => ctrl.abort();
  }, [item.id, lang]);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function handleClose() { setVisible(false); setTimeout(onClose, 300); }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "stretch" }}>
      <div onClick={handleClose} style={{
        flex: 1, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
        opacity: visible ? 1 : 0, transition: "opacity .3s",
      }} />
      <div style={{
        width: "min(700px,100vw)", height: "100%",
        background: "var(--bg)", overflowY: "auto",
        display: "flex", flexDirection: "column",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform .3s cubic-bezier(.32,0,.15,1)",
        boxShadow: "-8px 0 40px rgba(0,0,0,.2)",
      }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,${c},${c}66)`, flexShrink: 0 }} />

        <div style={{
          padding: "20px 28px 18px", borderBottom: "1px solid var(--line)",
          position: "sticky", top: 0, background: "var(--bg)", zIndex: 10,
          display: "flex", alignItems: "flex-start", gap: 14,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {item.categoryName && (
              <span style={{ fontSize: 11, fontWeight: 700, color: c,
                textTransform: "uppercase", letterSpacing: ".05em" }}>{item.categoryName}</span>
            )}
            <h2 style={{ color: "var(--ink)", fontWeight: 800, fontSize: 18, lineHeight: 1.4, margin: "6px 0 0" }}>
              {item.title}
            </h2>
          </div>
          <button onClick={handleClose}
            style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line)",
              background: "var(--surface)", cursor: "pointer", color: "var(--muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, flexShrink: 0 }}>×</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 28px",
          borderBottom: "1px solid var(--line)", flexWrap: "wrap" }}>
          {item.publishedAt && (
            <span style={{ fontSize: 12, color: "var(--muted-2)" }}>{fmtDate(item.publishedAt)}</span>
          )}
          {item.summary && (
            <span style={{ fontSize: 12, color: "var(--muted-2)", display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              {readEstimate(item.summary)}
            </span>
          )}
          {url && !loading && (
            <button disabled={dl}
              onClick={async () => { setDl(true); try { await downloadBlob(url, item.title + ".pdf"); } finally { setDl(false); } }}
              style={{
                marginRight: "auto", padding: "5px 16px", borderRadius: 8,
                border: "none", background: c, color: "#fff",
                fontSize: 12, fontWeight: 700, cursor: dl ? "default" : "pointer",
                display: "flex", alignItems: "center", gap: 5, opacity: dl ? .7 : 1,
              }}>
              {dl
                ? <><span className="ar-spin" style={{ width: 11, height: 11, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,.5)", borderTopColor: "#fff",
                    display: "inline-block" }} /> جارٍ…</>
                : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg> تحميل PDF</>
              }
            </button>
          )}
        </div>

        {item.summary && (
          <div style={{ padding: "20px 28px 0" }}>
            <p style={{
              fontSize: 15, lineHeight: 1.8, color: "var(--ink-2)", margin: 0,
              padding: "16px 20px", background: "var(--surface)", borderRadius: 12,
              borderInlineStart: `4px solid ${c}`,
            }}>{item.summary}</p>
          </div>
        )}

        <div style={{ padding: "20px 28px 32px", flex: 1 }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 16, padding: "60px 0" }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%",
                border: `3px solid ${c}22`, borderTopColor: c,
                animation: "ar-spin 1s linear infinite" }} />
              <p style={{ color: "var(--muted)", fontSize: 13 }}>جارٍ تحميل المستند…</p>
            </div>
          )}
          {err && !loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>تعذّر تحميل المستند</p>
              <button onClick={() => { setErr(false); setLoading(true); }}
                style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--line)",
                  background: "var(--surface)", cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
                إعادة المحاولة
              </button>
            </div>
          )}
          {url && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", gap: 20, padding: "60px 20px", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20,
                background: `linear-gradient(135deg,${c}22,${c}44)`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div>
                <p style={{ color: "var(--ink)", fontWeight: 700, fontSize: 15, margin: "0 0 8px" }}>{item.title}</p>
                <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>المستند جاهز للعرض أو التحميل</p>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={url} target="_blank" rel="noreferrer"
                  style={{ padding: "10px 24px", borderRadius: 10, border: "none",
                    background: c, color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", textDecoration: "none", display: "inline-flex",
                    alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                  فتح PDF
                </a>
                <a href={url} download={item.title + ".pdf"}
                  style={{ padding: "10px 20px", borderRadius: 10,
                    border: "1px solid var(--line)", background: "var(--surface)",
                    color: "var(--ink)", fontSize: 13, fontWeight: 600,
                    cursor: "pointer", textDecoration: "none", display: "inline-flex",
                    alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                  تحميل
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Skeleton Card ──────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="animate-pulse" style={{ background: "var(--surface)", borderRadius: 16,
      border: "1px solid var(--line)", overflow: "hidden" }}>
      <div style={{ paddingTop: "56.25%", background: "var(--surface-2)" }} />
      <div style={{ padding: "14px 16px 18px", display: "flex", flexDirection: "column", gap: 9 }}>
        <div style={{ height: 9, borderRadius: 4, background: "var(--surface-2)", width: "28%" }} />
        <div style={{ height: 13, borderRadius: 4, background: "var(--surface-2)", width: "90%" }} />
        <div style={{ height: 13, borderRadius: 4, background: "var(--surface-2)", width: "70%" }} />
        <div style={{ height: 10, borderRadius: 4, background: "var(--surface-2)", width: "50%", marginTop: 4 }} />
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function ArticlesPage() {
  const { lang } = useLang();
  const pageSize = usePageSize();
  const [page, setPage]         = useState(1);
  const [subId, setSubId]       = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const mainRef = useRef<HTMLDivElement>(null);

  const [category, setCategory] = useState<PubCategory | null | undefined>(undefined);
  const [items, setItems]       = useState<PublicItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  /* fetch category with sortOrder=1 (includes subcategories) */
  useEffect(() => {
    const ctrl = new AbortController();
    fetchPublicCategories(lang, ctrl.signal)
      .then(cats => setCategory(cats.find(c => c.sortOrder === 1) ?? null))
      .catch(e => { if (e.name !== "AbortError") setCategory(null); });
    return () => ctrl.abort();
  }, [lang]);

  /* fetch contents filtered by category + optional subcategory */
  useEffect(() => {
    if (category === undefined) return;
    setLoading(true); setError(false);
    const ctrl = new AbortController();
    fetchPublicContents(
      { page, pageSize: pageSize, categoryId: category?.id, subcategoryId: subId ?? undefined, lang },
      ctrl.signal,
    )
      .then(d => { setItems(d.items); setTotalPages(d.totalPages); })
      .catch(e => { if (e.name !== "AbortError") setError(true); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [category, page, subId, lang, pageSize]);

  const handleSub = useCallback((id: string | null) => {
    setSubId(id); setPage(1);
    mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  function handlePage(p: number) {
    setPage(p);
    mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeItem = activeId ? items.find(i => i.id === activeId) ?? null : null;
  const subs = category?.subcategories ?? [];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <Header />

      {/* Hero */}
      <section style={{
        background: "linear-gradient(135deg,#1e3a2f 0%,#14532d 45%,#0f1f14 100%)",
        padding: "56px 0 52px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -60, left: -60, width: 220, height: 220,
          borderRadius: "50%", background: "rgba(255,255,255,.03)" }} />
        <div style={{ position: "absolute", bottom: -40, right: -40, width: 160, height: 160,
          borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />
        <div className="ar-wrap">
          <h1 style={{ color: "#fff", fontSize: "clamp(28px,5vw,48px)", fontWeight: 900,
            lineHeight: 1.15, margin: "0 0 10px", fontFamily: "'Noto Kufi Arabic',sans-serif" }}>
            {lang === "en" ? "Reading" : "الاطلاع"}
          </h1>
          <p style={{ color: "rgba(255,255,255,.6)", fontSize: 16, margin: 0 }}>
            {lang === "en"
              ? "Sail into the world of words and knowledge"
              : "ابحر في عالم الكلمة والمعرفة"}
          </p>
        </div>
      </section>

      {/* Subcategory filter bar */}
      <SubFilter subs={subs} activeSubId={subId} onSelect={handleSub} />

      {/* Content */}
      <main ref={mainRef} style={{ flex: 1, paddingTop: 36, paddingBottom: 64 }}>
        <div className="ar-wrap">

          {error && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <p style={{ color: "var(--muted)", marginBottom: 16 }}>حدث خطأ أثناء التحميل</p>
              <button onClick={() => window.location.reload()}
                style={{ padding: "8px 22px", borderRadius: 10, border: "1px solid var(--line)",
                  background: "var(--surface)", color: "var(--ink)", cursor: "pointer", fontSize: 13 }}>
                إعادة المحاولة
              </button>
            </div>
          )}

          {loading && (
            <div className="ar-grid">
              {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>📖</div>
              <p style={{ color: "var(--muted)", fontSize: 15 }}>لا توجد مقالات في هذا القسم حالياً</p>
              {subId && (
                <button onClick={() => handleSub(null)}
                  style={{ marginTop: 16, padding: "8px 22px", borderRadius: 10,
                    border: "1px solid var(--gold)", background: "transparent",
                    color: "var(--forest)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                  عرض جميع المحتويات
                </button>
              )}
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="ar-grid">
              {items.map(item => (
                <ArticleCard key={item.id} item={item} onClick={() => setActiveId(item.id)} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} setPage={handlePage} />
        </div>
      </main>

      <Footer />

      {activeItem && <ReadingDrawer item={activeItem} onClose={() => setActiveId(null)} />}

      <style>{`
        .ar-wrap { max-width: 1280px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }
        .ar-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
        @media (max-width: 1024px) { .ar-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 768px)  { .ar-grid { grid-template-columns: repeat(2,1fr); } }
        @media (max-width: 480px)  { .ar-grid { grid-template-columns: 1fr; } .ar-wrap { padding-left: 16px; padding-right: 16px; } }
        @keyframes ar-spin { to { transform: rotate(360deg); } }
        .ar-spin { animation: ar-spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
