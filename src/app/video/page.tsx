"use client";

import { useState, useEffect, useCallback, type MouseEvent } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Pagination } from "@/components/shared/CategoryScreen";
import { matchesMediaType, fetchPublicDetail, fetchSignedUrl, resolveThumb, assetThumbUrl, downloadBlob, fetchPublicCategories, fetchPublicContents, type PublicItem, type PubCategory } from "@/lib/public";
import { useLang } from "@/lib/LangContext";

const V_COLOR = "#10B981";

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" }) : "";
}

/* ─── Video Card — YouTube style ─────────────────────────── */
function VideoCard({ item, onClick, priority = false }: { item: PublicItem; onClick: () => void; priority?: boolean }) {
  const { lang } = useLang();
  const [hover,    setHover]    = useState(false);
  const [dl,       setDl]       = useState(false);
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    resolveThumb(item, ctrl.signal).then(url => {
      if (url) { setThumbSrc(url); return; }
      /* fallback: جلب thumbnail من media asset مباشرة */
      fetchPublicDetail(item.id, lang, ctrl.signal)
        .then(d => {
          const a = d.mediaAssets.find(x => matchesMediaType(x, 1) && x.isPrimary)
            ?? d.mediaAssets.find(x => matchesMediaType(x, 1));
          if (!a) return;
          setThumbSrc(assetThumbUrl(a.id));
        })
        .catch(() => {});
    });
    return () => ctrl.abort();
  }, [item, lang]);

  async function handleDownload(e: MouseEvent) {
    e.stopPropagation();
    setDl(true);
    try {
      const d = await fetchPublicDetail(item.id, lang);
      const a = d.mediaAssets.find(x => matchesMediaType(x, 1));
      if (!a) return;
      const dlUrl = (await fetchSignedUrl(a.id)).url;
      await downloadBlob(dlUrl, item.title + ".mp4");
    } finally { setDl(false); }
  }

  return (
    <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        borderRadius: 12,
        border: `1.5px solid ${hover ? V_COLOR + "60" : "var(--line)"}`,
        overflow: "hidden",
        background: "var(--surface)",
        boxShadow: hover ? `0 6px 24px ${V_COLOR}22` : "var(--shadow-sm)",
        transition: "border-color .2s, box-shadow .2s",
      }}>

      {/* ── Thumbnail ── */}
      <div onClick={onClick} style={{
        position: "relative", paddingTop: "56.25%",
        overflow: "hidden", cursor: "pointer",
        background: "#111",
      }}>
        {thumbSrc
          ? <Image src={thumbSrc} alt={item.title} fill priority={priority}
              sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1100px) 33vw, 25vw"
              onError={() => setThumbSrc(null)}
              style={{ objectFit: "cover", transform: hover ? "scale(1.04)" : "scale(1)", transition: "transform .45s ease" }} />
          : <div style={{ position: "absolute", inset: 0,
              background: "linear-gradient(135deg,#0a2e1e,#1a4332)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="1.5">
                <polygon points="5,3 19,12 5,21"/>
              </svg>
            </div>
        }

        {/* Dark overlay + play button — appears on hover */}
        <div style={{
          position: "absolute", inset: 0,
          background: hover ? "rgba(0,0,0,.42)" : "rgba(0,0,0,.06)",
          transition: "background .25s",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: hover ? "var(--gold)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transform: hover ? "scale(1)" : "scale(.5)",
            opacity: hover ? 1 : 0,
            transition: "all .25s cubic-bezier(.34,1.4,.64,1)",
            boxShadow: "0 6px 24px rgba(0,0,0,.5)",
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--forest)" style={{ marginLeft: 3 }}>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>

        {/* Badges */}
        {item.isFeatured && (
          <div style={{ position: "absolute", top: 8, right: 8,
            background: "var(--gold)", color: "var(--forest)",
            fontSize: 10, fontWeight: 800, padding: "3px 9px", borderRadius: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,.3)" }}>
            مميز
          </div>
        )}
        {item.categoryName && (
          <div style={{ position: "absolute", bottom: 8, right: 8,
            background: "rgba(0,0,0,.65)", backdropFilter: "blur(6px)",
            color: "#fff", fontSize: 10, fontWeight: 600, padding: "3px 9px", borderRadius: 20 }}>
            {item.categoryName}
          </div>
        )}
      </div>

      {/* ── Info row below thumbnail ── */}
      <div style={{ display: "flex", gap: 10, padding: "10px 12px 14px" }}>
        {/* Avatar */}
        <div style={{
          width: 34, height: 34, borderRadius: "50%", flexShrink: 0, marginTop: 1,
          background: `linear-gradient(135deg,${V_COLOR},#059669)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-.5px",
        }}>
          {item.title.charAt(0)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            color: "var(--ink)", fontSize: 14, fontWeight: 700, lineHeight: 1.4, margin: "0 0 3px",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {item.title}
          </h3>
          {item.summary && (
            <p style={{
              color: "var(--muted)", fontSize: 12, margin: "0 0 4px", lineHeight: 1.4,
              display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {item.summary}
            </p>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
            {item.publishedAt && (
              <span style={{ fontSize: 11, color: "var(--muted-2)" }}>{fmtDate(item.publishedAt)}</span>
            )}
            <button disabled={dl} onClick={handleDownload}
              style={{
                display: "flex", alignItems: "center", gap: 4, padding: "3px 10px",
                borderRadius: 14, border: "1px solid var(--line)",
                background: "transparent", color: dl ? "var(--muted-2)" : "var(--muted)",
                fontSize: 11, fontWeight: 500, cursor: dl ? "default" : "pointer", transition: "all .15s",
              }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              <span className="vd-dl-text">{dl ? "جارٍ..." : "تحميل"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Skeleton Card ──────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div style={{ paddingTop: "56.25%", borderRadius: 10, background: "var(--surface-2)", position: "relative" }} />
      <div style={{ display: "flex", gap: 10, paddingTop: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--surface-2)", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, borderRadius: 6, background: "var(--surface-2)", width: "85%", marginBottom: 8 }} />
          <div style={{ height: 11, borderRadius: 6, background: "var(--surface-2)", width: "55%", marginBottom: 6 }} />
          <div style={{ height: 10, borderRadius: 6, background: "var(--surface-2)", width: "35%" }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Video Modal — Netflix/Vimeo cinematic style ─────────── */
function VideoModal({ item, onClose }: { item: PublicItem; onClose: () => void }) {
  const { lang } = useLang();
  const [url,     setUrl]     = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(false);
  const [dl,      setDl]      = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPublicDetail(item.id, lang, ctrl.signal)
      .then(async d => {
        const a = d.mediaAssets.find(x => matchesMediaType(x, 1));
        if (!a) { setErr(true); setLoading(false); return; }
        const s = await fetchSignedUrl(a.id, ctrl.signal);
        setUrl(s.url);
        setLoading(false);
      })
      .catch(e => { if (e.name !== "AbortError") { setErr(true); setLoading(false); } });
    return () => ctrl.abort();
  }, [item.id]);

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,.96)", backdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", overflowY: "auto",
    }}>
      {/* Close */}
      <button onClick={onClose} style={{
        position: "fixed", top: 16, right: 16, zIndex: 210,
        width: 40, height: 40, borderRadius: "50%",
        background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)",
        color: "#fff", fontSize: 22, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "background .15s",
      }}>×</button>

      <div onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 1080, padding: "0 0 32px" }}>

        {/* Video area */}
        <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", border: "3px solid var(--gold)",
                borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: 13, margin: 0 }}>جارٍ التحميل…</p>
            </div>
          )}
          {err && !loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "rgba(255,255,255,.4)", fontSize: 14 }}>تعذّر تحميل الفيديو</p>
            </div>
          )}
          {url && !loading && (
            <video controls autoPlay
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                background: "#000", objectFit: "contain" }}
              src={url} />
          )}
        </div>

        {/* Info bar */}
        <div style={{
          background: "#111", padding: "16px 24px 20px",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16,
          flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "clamp(15px,2.5vw,20px)",
              margin: "0 0 6px", lineHeight: 1.3 }}>
              {item.title}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {item.categoryName && (
                <span style={{ fontSize: 13, color: V_COLOR, fontWeight: 700 }}>{item.categoryName}</span>
              )}
              {item.publishedAt && (
                <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>{fmtDate(item.publishedAt)}</span>
              )}
            </div>
            {item.summary && (
              <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 1.6,
                marginTop: 8, marginBottom: 0 }}>
                {item.summary}
              </p>
            )}
          </div>

          {url && (
            <button disabled={dl}
              onClick={async () => {
                setDl(true);
                try { await downloadBlob(url, item.title + ".mp4"); }
                finally { setDl(false); }
              }}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 20px",
                borderRadius: 10, border: "1px solid rgba(255,255,255,.18)",
                background: dl ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.1)",
                color: dl ? "rgba(255,255,255,.25)" : "#fff",
                fontSize: 13, fontWeight: 600, cursor: dl ? "default" : "pointer",
                transition: "all .15s", flexShrink: 0,
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              {dl ? "جارٍ التحميل…" : "تحميل الفيديو"}
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── Filter chips (YouTube-style) ──────────────────────── */
function FilterChips({ category, activeSubId, onSelect }: {
  category: PubCategory | null | undefined;
  activeSubId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const subs = category?.subcategories ?? [];
  if (!category || subs.length === 0) return null;

  return (
    <div style={{
      display: "flex", gap: 8, flexWrap: "nowrap",
      overflowX: "auto", scrollbarWidth: "none", paddingBottom: 2,
    }}>
      {[{ id: null as string | null, name: "الكل" }, ...subs.map(s => ({ id: s.id, name: s.name }))].map(chip => {
        const active = chip.id === activeSubId;
        return (
          <button key={chip.id ?? "all"} onClick={() => onSelect(chip.id)}
            style={{
              flexShrink: 0, padding: "6px 14px", borderRadius: 999, fontSize: 13,
              fontWeight: active ? 700 : 500,
              border: `1px solid ${active ? "var(--ink)" : "var(--line)"}`,
              background: active ? "var(--ink)" : "transparent",
              color: active ? "var(--bg)" : "var(--ink-2)",
              cursor: "pointer", transition: "all .15s",
            }}>
            {chip.name}
          </button>
        );
      })}
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

export default function VideoPage() {
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

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPublicCategories(lang, ctrl.signal)
      .then(cats => setCategory(cats.find(c => c.name.includes("المشاهدة")) ?? null))
      .catch(e => { if (e.name !== "AbortError") setCategory(null); });
    return () => ctrl.abort();
  }, [lang]);

  useEffect(() => {
    if (category === undefined) return;
    setLoading(true); setError(false);
    const ctrl = new AbortController();
    fetchPublicContents(
      { page, pageSize, mediaType: 1, categoryId: category?.id, subcategoryId: subId ?? undefined, lang },
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

      {/* ── Page Hero Banner ── */}
      <div style={{
        background: "linear-gradient(150deg,var(--forest) 0%,#1a4332 55%,#0a1f12 100%)",
        padding: "40px 0 32px",
        position: "relative",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: .05,
          backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
          backgroundSize: "30px 30px" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg,var(--gold),#e8c05a,var(--gold))" }} />

        <div className="vd-wrap" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ color: "#fff", margin: 0, fontWeight: 900,
                fontSize: "clamp(22px,4vw,36px)", lineHeight: 1.1,
                fontFamily: "'Noto Kufi Arabic',sans-serif" }}>
                🎬 المشاهدة
              </h1>
              <p style={{ color: "rgba(255,255,255,.45)", margin: "6px 0 0", fontSize: 14 }}>
                بعض المشاهد التي تعكس تراث ونشاطات الطريقة
              </p>
            </div>
            {!loading && items.length > 0 && (
              <div style={{ background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)",
                borderRadius: 14, padding: "10px 20px", textAlign: "center" }}>
                <div style={{ color: "var(--gold)", fontWeight: 900, fontSize: 22, lineHeight: 1 }}>
                  {totalPages * pageSize}+
                </div>
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: 11, marginTop: 3 }}>فيديو</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky filter chips ── */}
      {category && (category.subcategories?.length ?? 0) > 0 && (
        <div style={{
          position: "sticky", top: 65, zIndex: 40,
          background: "color-mix(in srgb,var(--bg) 92%,transparent)",
          backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--line)",
          paddingTop: 10, paddingBottom: 10,
        }}>
          <div className="vd-wrap">
            <FilterChips category={category} activeSubId={subId} onSelect={handleSub} />
          </div>
        </div>
      )}

      {/* ── Videos grid ── */}
      <main style={{ flex: 1 }}>
        <div className="vd-wrap" style={{ paddingTop: 28, paddingBottom: 56 }}>

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
            <div className="vd-grid">
              {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>🎬</div>
              <p style={{ color: "var(--muted)", fontSize: 15 }}>لا توجد مقاطع فيديو في هذا القسم حالياً</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="vd-grid">
              {items.map((item: PublicItem, i: number) => (
                <VideoCard key={item.id} item={item} onClick={() => setActiveId(item.id)} priority={i < 4} />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} setPage={handlePage} />
        </div>
      </main>

      <Footer />

      {activeItem && <VideoModal item={activeItem} onClose={() => setActiveId(null)} />}

      <style>{`
        .vd-wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding-left: 24px;
          padding-right: 24px;
        }
        .vd-grid {
          display: grid;
          gap: 32px 20px;
          grid-template-columns: repeat(4, 1fr);
        }
        @media (max-width: 1100px) { .vd-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (max-width: 768px)  { .vd-grid { grid-template-columns: repeat(2, 1fr); gap: 24px 14px; } }
        @media (max-width: 640px)  { .vd-wrap { padding-left: 16px; padding-right: 16px; } }
        @media (max-width: 480px)  {
          .vd-wrap { padding-left: 12px; padding-right: 12px; }
          .vd-grid { grid-template-columns: 1fr; gap: 28px; }
          .vd-dl-text { display: none; }
        }
      `}</style>
    </div>
  );
}
