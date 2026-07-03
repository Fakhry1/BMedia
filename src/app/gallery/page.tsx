"use client";

import { useState, useEffect, useCallback, useRef, type MouseEvent, type WheelEvent, type KeyboardEvent } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Pagination } from "@/components/shared/CategoryScreen";
import { matchesMediaType, fetchPublicDetail, fetchSignedUrl, resolveThumb, downloadBlob, fetchPublicCategories, fetchPublicContents, type PublicItem, type PubCategory } from "@/lib/public";
import { useLang } from "@/lib/LangContext";

const PALETTE = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EC4899","#06B6D4","#EF4444"];
const accent  = (t: string) => PALETTE[t.charCodeAt(0) % PALETTE.length];
const RATIOS  = ["100%","100%","100%","100%","100%"];

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" }) : "";
}

/* ─── Image Card — Unsplash style ────────────────────────── */
function ImageCard({ item, index, onClick }: { item: PublicItem; index: number; onClick: () => void }) {
  const { lang } = useLang();
  const [hover,      setHover]      = useState(false);
  const [dl,         setDl]         = useState(false);
  const [imgUrl,     setImgUrl]     = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  const c     = accent(item.title);
  const ratio = RATIOS[index % RATIOS.length];

  /* Auto-fetch signed thumbnail when card enters viewport */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      const ctrl = new AbortController();
      resolveThumb(item, ctrl.signal).then(thumb => {
        if (thumb) { setImgUrl(thumb); setImgLoading(false); return; }
        fetchPublicDetail(item.id, lang, ctrl.signal)
          .then(d => {
            const a = d.mediaAssets.find(x => matchesMediaType(x, 2) && x.isPrimary)
              ?? d.mediaAssets.find(x => matchesMediaType(x, 2));
            if (!a) { setImgLoading(false); return; }
            fetchSignedUrl(a.id).then(s => setImgUrl(s.url)).catch(() => setImgLoading(false));
            setImgLoading(false);
          })
          .catch(e => { if (e.name !== "AbortError") setImgLoading(false); });
      })
    }, { threshold: 0.05 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [item.id, item.thumbnailUrl]);

  async function handleDownload(e: MouseEvent) {
    e.stopPropagation();
    setDl(true);
    try {
      const d = await fetchPublicDetail(item.id, lang);
      const a = d.mediaAssets.find(x => matchesMediaType(x, 2) && x.isPrimary)
        ?? d.mediaAssets.find(x => matchesMediaType(x, 2));
      if (!a) return;
      const dlUrl = (await fetchSignedUrl(a.id)).url;
      await downloadBlob(dlUrl, item.title + ".jpg");
    } finally { setDl(false); }
  }

  return (
    <div className="gl-card" ref={cardRef}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {/* Thumbnail */}
      <div onClick={onClick} style={{
        position: "relative", paddingTop: ratio,
        borderRadius: 12, overflow: "hidden",
        cursor: "zoom-in", background: `linear-gradient(135deg,${c}22,${c}44)`,
      }}>
        {/* Loading shimmer */}
        {imgLoading && (
          <div className="animate-pulse" style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(135deg,${c}18,${c}33)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%",
              border: `2px solid ${c}66`, borderTopColor: c,
              animation: "gl-spin 1s linear infinite" }} />
          </div>
        )}

        {/* Actual image */}
        {imgUrl && (
          <Image src={imgUrl} alt={item.title} fill
            sizes="(max-width: 720px) 50vw, (max-width: 1100px) 33vw, 25vw"
            loading={index === 0 ? "eager" : "lazy"}
            priority={index === 0}
            style={{ objectFit: "cover", transform: hover ? "scale(1.06)" : "scale(1)", transition: "transform .5s ease" }} />
        )}

        {/* No image + not loading */}
        {!imgUrl && !imgLoading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <path d="M21 15l-5-5L5 21"/>
            </svg>
          </div>
        )}

        {/* Hover overlay — gradient + info */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: 12,
          background: hover
            ? "linear-gradient(to top,rgba(0,0,0,.78) 0%,rgba(0,0,0,.18) 55%,transparent 100%)"
            : "linear-gradient(to top,rgba(0,0,0,.18) 0%,transparent 60%)",
          transition: "background .3s",
          display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "12px",
        }}>
          <div style={{
            transform: hover ? "translateY(0)" : "translateY(8px)",
            opacity: hover ? 1 : 0,
            transition: "all .25s", display: "flex", flexDirection: "column", gap: 8,
          }}>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 13, lineHeight: 1.35, margin: 0,
              textShadow: "0 1px 6px rgba(0,0,0,.6)",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {item.title}
            </p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ color: "rgba(255,255,255,.6)", fontSize: 10 }}>{fmtDate(item.publishedAt)}</span>
              <button disabled={dl} onClick={handleDownload}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 20, border: "none",
                  background: dl ? "rgba(255,255,255,.4)" : "rgba(255,255,255,.95)",
                  color: "#1a1a1a", fontSize: 11, fontWeight: 700,
                  cursor: dl ? "default" : "pointer", flexShrink: 0,
                }}>
                {dl
                  ? "..."
                  : <>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12l7 7 7-7"/>
                      </svg>
                      تحميل
                    </>
                }
              </button>
            </div>
          </div>
        </div>

        {/* Badges */}
        {item.isFeatured && (
          <div style={{ position: "absolute", top: 8, right: 8,
            background: "var(--gold)", color: "var(--forest)",
            fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,.3)" }}>مميز</div>
        )}
      </div>
    </div>
  );
}

/* ─── Skeleton Card ──────────────────────────────────────── */
function SkeletonCard({ index }: { index: number }) {
  const ratio = RATIOS[index % RATIOS.length];
  return (
    <div className="gl-card animate-pulse">
      <div style={{ paddingTop: ratio, borderRadius: 12, background: "var(--surface-2)" }} />
    </div>
  );
}

/* ─── Lightbox — full screen with zoom + nav ─────────────── */
function Lightbox({ item, items, onClose, onNavigate }: {
  item: PublicItem;
  items: PublicItem[];
  onClose: () => void;
  onNavigate: (id: string) => void;
}) {
  const { lang } = useLang();
  const [url,     setUrl]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dl,      setDl]      = useState(false);
  const [zoom,    setZoom]    = useState(1);

  const idx     = items.findIndex(i => i.id === item.id);
  const hasPrev = idx > 0;
  const hasNext = idx < items.length - 1;

  /* Fetch full-res image */
  useEffect(() => {
    setUrl(null);
    setLoading(true);
    setZoom(1);
    const ctrl = new AbortController();
    fetchPublicDetail(item.id, lang, ctrl.signal)
      .then(async d => {
        const a = d.mediaAssets.find(x => matchesMediaType(x, 2) && x.isPrimary)
          ?? d.mediaAssets.find(x => matchesMediaType(x, 2));
        if (!a) { setLoading(false); return; }
        const s = await fetchSignedUrl(a.id, ctrl.signal);
        setUrl(s.url);
        setLoading(false);
      })
      .catch(e => { if (e.name !== "AbortError") setLoading(false); });
    return () => ctrl.abort();
  }, [item.id]);

  /* Keyboard nav */
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if ((e.key === "ArrowLeft" || e.key === "ArrowUp") && hasPrev)  onNavigate(items[idx - 1].id);
      if ((e.key === "ArrowRight" || e.key === "ArrowDown") && hasNext) onNavigate(items[idx + 1].id);
      if (e.key === "+") setZoom(z => Math.min(5, z + 0.5));
      if (e.key === "-") setZoom(z => Math.max(1, z - 0.5));
      if (e.key === "0") setZoom(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item.id, idx, hasPrev, hasNext, onClose, onNavigate, items]);

  /* Mouse wheel zoom */
  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    e.stopPropagation();
    setZoom(z => Math.max(1, Math.min(5, z - e.deltaY * 0.0015)));
  }

  const zoomIn  = (e: MouseEvent) => { e.stopPropagation(); setZoom(z => Math.min(5, parseFloat((z + 0.5).toFixed(1)))); };
  const zoomOut = (e: MouseEvent) => { e.stopPropagation(); setZoom(z => Math.max(1, parseFloat((z - 0.5).toFixed(1)))); };
  const zoomReset = (e: MouseEvent) => { e.stopPropagation(); setZoom(1); };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,.97)", display: "flex", flexDirection: "column",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 210,
        padding: "14px 18px",
        background: "linear-gradient(to bottom,rgba(0,0,0,.85),transparent)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        {/* Title */}
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
          {item.publishedAt && (
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11, margin: "2px 0 0" }}>{fmtDate(item.publishedAt)}</p>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {/* Zoom out */}
          <button onClick={zoomOut} title="تصغير (−)"
            style={iconBtn}>{zoomIcon("−")}</button>
          {/* Zoom % */}
          <button onClick={zoomReset} title="إعادة الضبط"
            style={{ ...iconBtn, minWidth: 52, fontSize: 11, borderRadius: 8, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
            {Math.round(zoom * 100)}%
          </button>
          {/* Zoom in */}
          <button onClick={zoomIn} title="تكبير (+)"
            style={iconBtn}>{zoomIcon("+")}</button>

          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.15)", margin: "0 4px" }} />

          {/* Download */}
          {url && (
            <button disabled={dl}
              onClick={async (e) => {
                e.stopPropagation();
                setDl(true);
                try { await downloadBlob(url, item.title + ".jpg"); }
                finally { setDl(false); }
              }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 16px", borderRadius: 20,
                border: "1px solid rgba(255,255,255,.25)",
                background: dl ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.12)",
                color: dl ? "rgba(255,255,255,.4)" : "#fff",
                fontSize: 12, fontWeight: 600, cursor: dl ? "default" : "pointer",
              }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              {dl ? "جارٍ..." : "تحميل"}
            </button>
          )}

          {/* Close */}
          <button onClick={onClose} style={iconBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Image area ── */}
      <div onClick={onClose} onWheel={handleWheel}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", position: "relative" }}>

        {/* Prev arrow */}
        {hasPrev && (
          <button onClick={e => { e.stopPropagation(); onNavigate(items[idx - 1].id); }}
            style={{ ...navBtn, right: 16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
          </button>
        )}

        {/* Loading spinner */}
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 12, pointerEvents: "none" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%",
              border: "3px solid var(--gold)", borderTopColor: "transparent",
              animation: "gl-spin 1s linear infinite" }} />
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: 12, margin: 0 }}>جارٍ تحميل الصورة...</p>
          </div>
        )}

        {/* Image */}
        {url && (
          <img
            src={url} alt={item.title}
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: "calc(100vw - 100px)", maxHeight: "calc(100vh - 130px)",
              objectFit: "contain",
              transform: `scale(${zoom})`,
              transition: zoom === 1 ? "transform .25s cubic-bezier(.34,1.4,.64,1)" : "none",
              cursor: zoom > 1 ? "grab" : "default",
              userSelect: "none", WebkitUserDrag: "none",
              borderRadius: zoom === 1 ? 10 : 0,
              boxShadow: zoom === 1 ? "0 24px 80px rgba(0,0,0,.8)" : "none",
            } as import("react").CSSProperties}
          />
        )}

        {/* Next arrow */}
        {hasNext && (
          <button onClick={e => { e.stopPropagation(); onNavigate(items[idx + 1].id); }}
            style={{ ...navBtn, left: 16 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Bottom — dot indicators + counter ── */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 210,
        padding: "14px", textAlign: "center",
        background: "linear-gradient(to top,rgba(0,0,0,.7),transparent)",
        display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
      }}>
        {items.length > 1 && items.length <= 24 && (
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            {items.map((it, i) => (
              <button key={it.id}
                onClick={e => { e.stopPropagation(); onNavigate(it.id); }}
                style={{
                  width: i === idx ? 20 : 6, height: 6, borderRadius: 3, border: "none", padding: 0,
                  background: i === idx ? "var(--gold)" : "rgba(255,255,255,.3)",
                  cursor: "pointer", transition: "all .2s",
                }} />
            ))}
          </div>
        )}
        <span style={{ color: "rgba(255,255,255,.35)", fontSize: 11 }}>
          {idx + 1} / {items.length}
          {zoom > 1 && <> · ⌨ +/− للتكبير · 0 لإعادة الضبط</>}
        </span>
      </div>

      <style>{`
        @keyframes gl-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Icon button style ── */
const iconBtn: import("react").CSSProperties = {
  width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.08)", color: "#fff", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background .15s", flexShrink: 0,
};

const navBtn: import("react").CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)", zIndex: 5,
  width: 48, height: 48, borderRadius: "50%",
  border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(0,0,0,.5)", backdropFilter: "blur(8px)",
  color: "#fff", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background .15s",
};

function zoomIcon(sym: string) {
  return <span style={{ fontSize: 18, lineHeight: 1, fontWeight: 300 }}>{sym}</span>;
}

/* ─── SubFilter — same pattern as articles ───────────────── */
function SubFilter({
  subs, lang, activeSubId, onSelect,
}: {
  subs: PubCategory["subcategories"]; lang: string;
  activeSubId: string | null;
  onSelect: (id: string | null) => void;
}) {
  if (subs.length === 0) return null;
  return (
    <div style={{
      position: "sticky", top: 65, zIndex: 40,
      background: "color-mix(in srgb,var(--bg) 94%,transparent)",
      backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      borderBottom: "1px solid var(--line)",
    }}>
      <div className="gl-wrap">
        <div style={{
          display: "flex", gap: 8, alignItems: "center",
          padding: "10px 0", overflowX: "auto", scrollbarWidth: "none",
        }}>
          <span style={{ fontSize: 12, color: "var(--muted-2)", fontWeight: 600, flexShrink: 0 }}>{lang === "ar" ? "تصفية:" : "Filter:"}</span>
          {[{ id: null, name: lang === "ar" ? "الكل" : "All" }, ...subs.map(s => ({ id: s.id, name: s.name }))].map(s => {
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

/* ─── Page ───────────────────────────────────────────────── */
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

export default function GalleryPage() {
  const { lang } = useLang();
  const pageSize = usePageSize();
  const [page,     setPage]     = useState(1);
  const [subId,    setSubId]    = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [category,   setCategory]   = useState<PubCategory | null | undefined>(undefined);
  const [items,      setItems]      = useState<PublicItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(false);

  /* fetch category (includes subcategories) */
  useEffect(() => {
    const ctrl = new AbortController();
    fetchPublicCategories(lang, ctrl.signal)
      .then(cats => setCategory(cats.find(c => c.sortOrder === 4) ?? null))
      .catch(e => { if (e.name !== "AbortError") setCategory(null); });
    return () => ctrl.abort();
  }, [lang]);

  /* fetch contents filtered by category + optional subcategory */
  useEffect(() => {
    if (category === undefined) return;
    setLoading(true); setError(false);
    const ctrl = new AbortController();
    fetchPublicContents(
      { page, pageSize, mediaType: 2, categoryId: category?.id, subcategoryId: subId ?? undefined, lang },
      ctrl.signal,
    )
      .then(d => { setItems(d.items); setTotalPages(d.totalPages); })
      .catch(e => { if (e.name !== "AbortError") setError(true); })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [category, page, subId, lang, pageSize]);

  const handleSub = useCallback((id: string | null) => {
    setSubId(id); setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePage = useCallback((p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const activeItem = items.find((i: PublicItem) => i.id === activeId) ?? null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <Header />

      {/* ── Hero banner ── */}
      <div style={{
        background: "linear-gradient(150deg,#1e1b4b 0%,#312e81 45%,#0f0e1f 100%)",
        padding: "clamp(24px,5vw,44px) 0 clamp(20px,4vw,36px)",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: .05,
          backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
          backgroundSize: "30px 30px" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg,var(--gold),#e8c05a,var(--gold))" }} />

        <div className="gl-wrap" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.4)",
                letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 6 }}>
               
              </div>
              <h1 style={{ color: "#fff", margin: 0, fontWeight: 900,
                fontSize: "clamp(22px,4vw,36px)", lineHeight: 1.1,
                fontFamily: "'Noto Kufi Arabic',sans-serif" }}>
                   {lang === "en" ? "🖼️ Photo Gallery" : "🖼️ معرض الصور"}
                
              </h1>
              <p style={{ color: "rgba(255,255,255,.45)", margin: "6px 0 0", fontSize: 14 }}>
                {lang === "en"
              ? "A Collection of Selected Photos"
              : " مجموعة من الصور المختارة"}
              
              </p>
            </div>
            {!loading && items.length > 0 && (
              <div style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 14, padding: "10px 20px", textAlign: "center" }}>
                <div style={{ color: "var(--gold)", fontWeight: 900, fontSize: 22, lineHeight: 1 }}>
                  {totalPages * pageSize}+
                </div>
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginTop: 3 }}>صورة</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Subcategory filter — same pattern as articles ── */}
      <SubFilter subs={category?.subcategories ?? []} lang={lang} activeSubId={subId} onSelect={handleSub} />

      {/* ── Masonry grid ── */}
      <main style={{ flex: 1 }}>
        <div className="gl-wrap" style={{ paddingTop: 28, paddingBottom: 56 }}>

          {error && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <p style={{ color: "var(--muted)", marginBottom: 16 }}>حدث خطأ أثناء التحميل</p>
              <button onClick={() => window.location.reload()} style={{
                padding: "8px 22px", borderRadius: 10, border: "1px solid var(--line)",
                background: "var(--surface)", color: "var(--ink)", cursor: "pointer", fontSize: 13,
              }}>إعادة المحاولة</button>
            </div>
          )}

          {loading && (
            <div className="gl-masonry">
              {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} index={i} />)}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🖼️</div>
              <p style={{ color: "var(--muted)", fontSize: 15 }}>لا توجد صور في هذا القسم حالياً</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="gl-masonry">
              {items.map((item: PublicItem, i: number) => (
                <ImageCard key={item.id} item={item} index={i} onClick={() => setActiveId(item.id)} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} setPage={handlePage} />
        </div>
      </main>

      <Footer />

      {activeItem && (
        <Lightbox
          item={activeItem}
          items={items}
          onClose={() => setActiveId(null)}
          onNavigate={(id) => setActiveId(id)}
        />
      )}

      <style>{`
        .gl-wrap {
          max-width: 1320px;
          margin: 0 auto;
          padding-left: 20px;
          padding-right: 20px;
        }
        .gl-masonry {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }
        .gl-card {
          break-inside: avoid;
          margin-bottom: 14px;
        }
        @media (max-width: 1100px) { .gl-masonry { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 720px)  { .gl-masonry { grid-template-columns: repeat(2, 1fr); gap: 10px; } }
        @media (max-width: 640px)  { .gl-wrap { padding-left: 14px; padding-right: 14px; } }
        @media (max-width: 420px)  { .gl-masonry { grid-template-columns: repeat(2, 1fr); gap: 8px; } }
      `}</style>
    </div>
  );
}
