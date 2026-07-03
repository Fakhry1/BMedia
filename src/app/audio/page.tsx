"use client";

import { useState, useEffect, useRef, useCallback, type MouseEvent } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Pagination } from "@/components/shared/CategoryScreen";
import { matchesMediaType, fetchPublicDetail, fetchSignedUrl, resolveThumb, downloadBlob, fetchPublicCategories, fetchPublicContents, type PublicItem, type PubCategory } from "@/lib/public";
import { useLang } from "@/lib/LangContext";

const ACCENT = "#8B5CF6";

function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("ar-EG", { month: "short", day: "numeric", year: "numeric" }) : "";
}

/* ─── Episode Card / Row ─────────────────────────────────── */
function EpisodeCard({ item, rank, onClick }: { item: PublicItem; rank: number; onClick: () => void }) {
  const { lang } = useLang();
  const [hover,    setHover]    = useState(false);
  const [dl,       setDl]       = useState(false);
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!item.thumbnailUrl) return;
    resolveThumb(item).then(url => { if (url) setThumbSrc(url); });
  }, [item]);

  const PALETTE = ["#8B5CF6","#3B82F6","#10B981","#F59E0B","#EC4899","#06B6D4","#EF4444"];
  const c = PALETTE[item.title.charCodeAt(0) % PALETTE.length];

  async function handleDownload(e: MouseEvent) {
    e.stopPropagation();
    setDl(true);
    try {
      const d = await fetchPublicDetail(item.id, lang);
      const a = d.mediaAssets.find(x => matchesMediaType(x, 3));
      if (!a) return;
      const dlUrl = (await fetchSignedUrl(a.id)).url;
      await downloadBlob(dlUrl, item.title + ".mp3");
    } finally { setDl(false); }
  }

  return (
    <>
      {/* ── Desktop card (grid) ── */}
      <div className="ep-card-desktop"
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          background: "var(--surface)", borderRadius: 16,
          border: "1px solid var(--line)", overflow: "hidden",
          display: "flex", flexDirection: "column",
          boxShadow: hover ? "0 8px 28px rgba(0,0,0,.10)" : "0 1px 4px rgba(0,0,0,.05)",
          transform: hover ? "translateY(-3px)" : "none",
          transition: "all .25s", cursor: "pointer",
        }}
      >
        {/* Artwork */}
        <div style={{
          aspectRatio: "1/1", overflow: "hidden", flexShrink: 0,
          background: `linear-gradient(135deg,${c}55,${c}22)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          {thumbSrc
            ? <Image src={thumbSrc} alt={item.title} fill
                sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                style={{ objectFit: "cover" }} />
            : <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.5">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
          }
          {/* Play overlay */}
          <div onClick={onClick} style={{
            position: "absolute", inset: 0,
            background: hover ? "rgba(0,0,0,.35)" : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background .2s",
          }}>
            {hover && (
              <div style={{
                width: 46, height: 46, borderRadius: "50%",
                background: c, display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 4px 18px ${c}88`,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: 3 }}>
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              </div>
            )}
          </div>
          {/* Rank badge */}
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "rgba(0,0,0,.55)", borderRadius: 8,
            padding: "2px 8px", fontSize: 11, fontWeight: 700, color: "#fff",
          }}>{rank}</div>
        </div>

        {/* Info */}
        <div style={{ padding: "12px 14px 8px", flex: 1 }}>
          <div style={{
            color: "var(--ink)", fontSize: 13, fontWeight: 700, lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden", marginBottom: 5,
          }}>{item.title}</div>
          {item.summary && (
            <div style={{
              fontSize: 11, color: "var(--muted)", lineHeight: 1.6,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>{item.summary}</div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 14px 14px", gap: 6 }}>
          {item.publishedAt && (
            <span style={{ fontSize: 10, color: "var(--muted-2)" }}>{fmtDate(item.publishedAt)}</span>
          )}
          <button disabled={dl} onClick={handleDownload}
            style={{
              marginRight: "auto", display: "flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 20, border: "1px solid var(--line)",
              background: "transparent", color: dl ? "var(--muted-2)" : "var(--muted)",
              fontSize: 11, fontWeight: 500, cursor: dl ? "default" : "pointer",
            }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            {dl ? "جارٍ..." : "تحميل"}
          </button>
        </div>
      </div>

      {/* ── Mobile row ── */}
      <div className="ep-row ep-card-mobile"
        onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{
          display: "flex", alignItems: "center", gap: 14,
          borderRadius: 12, background: hover ? "var(--surface-2)" : "transparent",
          transition: "background .15s",
        }}
      >
        <div style={{
          width: 24, flexShrink: 0, textAlign: "center",
          fontWeight: rank <= 3 ? 800 : 500, fontSize: rank <= 3 ? 17 : 14,
          color: rank <= 3 ? c : "var(--muted-2)", fontVariantNumeric: "tabular-nums",
        }}>{rank}</div>

        <div style={{
          width: 72, height: 72, borderRadius: 16, flexShrink: 0, overflow: "hidden",
          background: `linear-gradient(135deg,${c}55,${c}22)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
          boxShadow: hover ? `0 4px 18px ${c}44` : "0 1px 4px rgba(0,0,0,.1)",
          transition: "box-shadow .2s",
        }}>
          {thumbSrc
            ? <Image src={thumbSrc} alt={item.title} fill sizes="72px" style={{ objectFit: "cover" }} />
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color: "var(--ink)", fontSize: 15, fontWeight: 700, lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden", marginBottom: 6,
          }}>{item.title}</div>
          {item.publishedAt && (
            <span style={{ fontSize: 12, color: "var(--muted-2)" }}>{fmtDate(item.publishedAt)}</span>
          )}
          {item.summary && (
            <div style={{
              fontSize: 13, color: "var(--muted)", lineHeight: 1.75, marginTop: 4,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>{item.summary}</div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button disabled={dl} onClick={handleDownload} className="ep-dl-btn"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              borderRadius: 20, border: "1px solid var(--line)",
              background: "transparent", color: dl ? "var(--muted-2)" : "var(--muted)",
              fontSize: 12, fontWeight: 500, cursor: dl ? "default" : "pointer", transition: "all .15s",
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            <span className="ep-dl-text">{dl ? "جارٍ..." : "تحميل"}</span>
          </button>
          <button onClick={onClick}
            style={{
              width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer",
              background: hover ? c : "var(--surface-2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all .2s", flexShrink: 0,
              boxShadow: hover ? `0 4px 14px ${c}55` : "none",
            }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill={hover ? "#fff" : "var(--muted)"}
              style={{ marginLeft: 2 }}>
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── Skeleton ───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <>
      {/* Desktop card skeleton */}
      <div className="ep-card-desktop animate-pulse" style={{
        background: "var(--surface)", borderRadius: 16, border: "1px solid var(--line)", overflow: "hidden",
      }}>
        <div style={{ aspectRatio: "1/1", background: "var(--surface-2)" }} />
        <div style={{ padding: "12px 14px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ height: 13, borderRadius: 4, background: "var(--surface-2)", width: "85%" }} />
          <div style={{ height: 13, borderRadius: 4, background: "var(--surface-2)", width: "65%" }} />
          <div style={{ height: 10, borderRadius: 4, background: "var(--surface-2)", width: "45%", marginTop: 4 }} />
        </div>
      </div>
      {/* Mobile row skeleton */}
      <div className="ep-row ep-card-mobile animate-pulse" style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 24, height: 16, borderRadius: 4, background: "var(--surface-2)", flexShrink: 0 }} />
        <div style={{ width: 72, height: 72, borderRadius: 16, background: "var(--surface-2)", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 16, borderRadius: 6, background: "var(--surface-2)", width: "70%", marginBottom: 10 }} />
          <div style={{ height: 11, borderRadius: 6, background: "var(--surface-2)", width: "32%" }} />
        </div>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--surface-2)", flexShrink: 0 }} />
      </div>
    </>
  );
}

/* ─── SubFilter — same pattern as articles page ─────────── */
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
      <div className="au-wrap">
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

/* ─── Audio Modal ────────────────────────────────────────── */
function AudioModal({ item, onClose }: { item: PublicItem; onClose: () => void }) {
  const { lang } = useLang();
  const [url,      setUrl]      = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState(false);
  const [dl,       setDl]       = useState(false);
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const PALETTE = ["#8B5CF6","#3B82F6","#10B981","#F59E0B","#EC4899","#06B6D4","#EF4444"];
  const c = PALETTE[item.title.charCodeAt(0) % PALETTE.length];

  useEffect(() => {
    const ctrl = new AbortController();
    resolveThumb(item, ctrl.signal).then(url => { if (url) setThumbSrc(url); });
    fetchPublicDetail(item.id, lang, ctrl.signal)
      .then(async d => {
        const a = d.mediaAssets.find(x => matchesMediaType(x, 3));
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
      background: "rgba(0,0,0,.75)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 28, width: "100%", maxWidth: 440,
        overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.4)",
      }}>

        {/* Artwork banner */}
        <div style={{
          height: 200, background: `linear-gradient(160deg,${c}cc,${c}44)`,
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
        }}>
          {thumbSrc
            ? <Image src={thumbSrc} alt={item.title} width={120} height={120}
                style={{ borderRadius: 18, objectFit: "cover", boxShadow: "0 16px 48px rgba(0,0,0,.5)" }} />
            : <div style={{
                width: 120, height: 120, borderRadius: 18,
                background: "rgba(255,255,255,.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 16px 48px rgba(0,0,0,.4)",
              }}>
                <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
              </div>
          }
          <button onClick={onClose} style={{
            position: "absolute", top: 14, right: 14,
            width: 32, height: 32, borderRadius: "50%",
            background: "rgba(0,0,0,.35)", border: "none",
            color: "#fff", fontSize: 18, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>

        {/* Info + player */}
        <div style={{ padding: "20px 24px 26px" }}>
          <h2 style={{ color: "var(--ink)", fontWeight: 700, fontSize: 17, lineHeight: 1.35, margin: "0 0 6px" }}>
            {item.title}
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            {item.summary && (
              <span style={{ fontSize: 13, color: c, fontWeight: 600 }}>{item.summary}</span>
            )}
            {item.publishedAt && (
              <span style={{ fontSize: 12, color: "var(--muted-2)" }}>{fmtDate(item.publishedAt)}</span>
            )}
          </div>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 0" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${c}`,
                borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>{lang === "ar" ? "جارٍ التحميل…" : "Loading…"}</p>
            </div>
          )}

          {err && !loading && (
            <p style={{ color: "var(--muted)", textAlign: "center", fontSize: 14, padding: "12px 0" }}>
              تعذّر تحميل الملف الصوتي
            </p>
          )}

          {url && !loading && (
            <>
              <audio ref={audioRef} controls autoPlay src={url}
                style={{ width: "100%", marginBottom: 14, borderRadius: 8, accentColor: c }} />
              <button disabled={dl}
                onClick={async () => { setDl(true); try { await downloadBlob(url, item.title + ".mp3"); } finally { setDl(false); } }}
                style={{
                  width: "100%", padding: "11px 0", borderRadius: 14, border: "none",
                  background: dl ? "var(--line)" : c, color: "#fff",
                  fontSize: 14, fontWeight: 700, cursor: dl ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12l7 7 7-7"/>
                </svg>
                {dl ? (lang === "ar" ? "جارٍ التحميل…" : "Downloading…") : (lang === "ar" ? "تحميل الحلقة" : "Download Episode")}
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
function usePageSize() {
  const [size, setSize] = useState(15);
  useEffect(() => {
    function update() { setSize(window.innerWidth <= 480 ? 8 : 15); }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return size;
}

export default function AudioPage() {
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
      .then(cats => setCategory(cats.find(c => c.sortOrder === 2) ?? null))
      .catch(e => { if (e.name !== "AbortError") setCategory(null); });
    return () => ctrl.abort();
  }, [lang]);

  /* fetch contents filtered by category + optional subcategory */
  useEffect(() => {
    if (category === undefined) return;
    setLoading(true); setError(false);
    const ctrl = new AbortController();
    fetchPublicContents(
      { page, pageSize, mediaType: 3, categoryId: category?.id, subcategoryId: subId ?? undefined, lang },
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

      {/* ── Hero ── */}
      <div style={{
        background: "linear-gradient(150deg,#4c1d95 0%,#5b21b6 40%,#2e1065 100%)",
        padding: "40px 0 32px", position: "relative",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: .06,
          backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
          backgroundSize: "32px 32px" }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4,
          background: "linear-gradient(90deg,var(--gold),#e8c05a,var(--gold))" }} />

        <div className="au-wrap" style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16, flexShrink: 0,
              background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div>
              <h1 style={{ color: "#fff", margin: 0, fontSize: "clamp(22px,4vw,36px)",
                fontWeight: 900, lineHeight: 1.1 }}>
                {lang === "ar" ? "استمتع بالسماع" : "Enjoy Listening"}
              </h1>
              <p style={{ color: "rgba(255,255,255,.5)", margin: "5px 0 0", fontSize: 14 }}>
                {lang === "ar" ? "طاب وقت السماع" : "Have a great listening experience"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Subcategory filter — same pattern as articles ── */}
      <SubFilter subs={category?.subcategories ?? []} lang={lang} activeSubId={subId} onSelect={handleSub} />

      {/* ── Episodes list ── */}
      <main style={{ flex: 1 }}>
        <div className="au-wrap" style={{ paddingTop: 28, paddingBottom: 56 }}>

          {/* Section header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 18, paddingBottom: 14, borderBottom: "2px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 4, height: 22, borderRadius: 2, background: ACCENT, flexShrink: 0 }} />
              <span style={{ fontWeight: 800, fontSize: 18, color: "var(--ink)" }}>{lang === "ar" ? "أبرز المختارات" : "Top Picks"}</span>
            </div>
            {!loading && items.length > 0 && (
              <span style={{ fontSize: 12, color: "var(--muted-2)" }}>
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalPages * pageSize)} {lang === "ar" ? `من ${totalPages * pageSize}+ حلقة` : `of ${totalPages * pageSize}+ episodes`}
              </span>
            )}
          </div>

          {/* Error */}
          {error && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <p style={{ color: "var(--muted)", marginBottom: 16 }}>حدث خطأ أثناء التحميل</p>
              <button onClick={() => window.location.reload()} style={{
                padding: "8px 22px", borderRadius: 10, border: "1px solid var(--line)",
                background: "var(--surface)", color: "var(--ink)", cursor: "pointer", fontSize: 13,
              }}>إعادة المحاولة</button>
            </div>
          )}

          {/* Grid (desktop) / List (mobile) */}
          {loading && (
            <>
              <div className="au-grid">
                {Array.from({ length: pageSize }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </>
          )}

          {!loading && !error && items.length === 0 && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🎧</div>
              <p style={{ color: "var(--muted)", fontSize: 15 }}>لا توجد حلقات بعد</p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              {/* Desktop grid */}
              <div className="au-grid">
                {items.map((item: PublicItem, i: number) => (
                  <EpisodeCard
                    key={item.id}
                    item={item}
                    rank={(page - 1) * pageSize + i + 1}
                    onClick={() => setActiveId(item.id)}
                  />
                ))}
              </div>
              {/* Mobile list */}
              <div className="au-list" style={{
                background: "var(--surface)", borderRadius: 16,
                border: "1px solid var(--line)", overflow: "hidden",
              }}>
                {items.map((item: PublicItem, i: number) => (
                  <div key={item.id}>
                    {i > 0 && <div style={{ height: 1, background: "var(--line)", margin: "0 16px" }} />}
                    <EpisodeCard
                      item={item}
                      rank={(page - 1) * pageSize + i + 1}
                      onClick={() => setActiveId(item.id)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <Pagination page={page} totalPages={totalPages} setPage={handlePage} />
        </div>
      </main>

      <Footer />

      {activeItem && <AudioModal item={activeItem} onClose={() => setActiveId(null)} />}

      <style>{`
        .au-wrap { max-width: 1280px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }

        /* Desktop: 4-column grid, hide mobile list */
        .au-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 20px; }
        .au-list { display: none; }
        .ep-card-desktop { display: flex; }
        .ep-card-mobile { display: none !important; }

        /* Tablet */
        @media (max-width: 1024px) { .au-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 768px)  { .au-grid { grid-template-columns: repeat(2,1fr); } }

        /* Mobile: hide grid, show list */
        @media (max-width: 480px) {
          .au-grid { display: none; }
          .au-list { display: block; }
          .ep-card-desktop { display: none !important; }
          .ep-card-mobile { display: flex !important; }
          .au-wrap { padding-left: 16px; padding-right: 16px; }
          .ep-row { padding: 12px; gap: 12px; }
          .ep-dl-text { display: none; }
          .ep-dl-btn { padding: 7px 9px; border-radius: 50%; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
