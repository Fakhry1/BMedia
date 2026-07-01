"use client";

import { useState, useEffect, useRef, type MouseEvent } from "react";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  fetchPublicContents, fetchPublicCategories, fetchPublicDetail,
  fetchSignedUrl, resolveThumb, assetThumbUrl, downloadBlob,
  matchesMediaType,
  type PublicItem, type PubCategory,
} from "@/lib/public";
import { useLang } from "@/lib/LangContext";

/* ─── Constants ────────────────────────────────────────────── */
const TOPIC_DEFS = [
  { href: "/video",    key: "video"    as const, icon: "🎬", color: "#10B981" },
  { href: "/audio",    key: "audio"    as const, icon: "🎧", color: "#8B5CF6" },
  { href: "/articles", key: "articles" as const, icon: "📖", color: "#3B82F6" },
  { href: "/gallery",  key: "gallery"  as const, icon: "🖼️", color: "#F59E0B" },
];

const TYPE_COLOR: Record<number, { color: string; playIcon: boolean }> = {
  1: { color: "#10B981", playIcon: true  },
  2: { color: "#F59E0B", playIcon: false },
  3: { color: "#8B5CF6", playIcon: false },
  4: { color: "#3B82F6", playIcon: false },
};

function fmtDate(iso: string | null) {
  return iso
    ? new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" })
    : "";
}

/* ─── Unified Content Modal ────────────────────────────────── */
function ContentModal({ item, mediaType, onClose }: {
  item: PublicItem;
  mediaType: number;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const [url,      setUrl]      = useState<string | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState(false);
  const [dl,       setDl]       = useState(false);
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);
  const [zoom,     setZoom]     = useState(1);
  const audioRef = useRef<HTMLAudioElement>(null);

  const meta  = TYPE_COLOR[mediaType] ?? TYPE_COLOR[1];
  const PALETTE = ["#10B981","#8B5CF6","#3B82F6","#F59E0B","#EC4899","#06B6D4","#EF4444"];
  const c = PALETTE[item.title.charCodeAt(0) % PALETTE.length];

  /* Fetch asset URL */
  useEffect(() => {
    const ctrl = new AbortController();
    resolveThumb(item, ctrl.signal).then(u => { if (u) setThumbSrc(u); });
    fetchPublicDetail(item.id, lang, ctrl.signal)
      .then(async d => {
        const assetTypeNum = mediaType === 1 ? 1 : mediaType === 3 ? 3 : mediaType === 4 ? 4 : 2;
        const a = d.mediaAssets.find(x => matchesMediaType(x, assetTypeNum)) ?? d.mediaAssets[0];
        if (!a) { setErr(true); setLoading(false); return; }
        const s = await fetchSignedUrl(a.id, ctrl.signal);
        setUrl(s.url);
        setLoading(false);
      })
      .catch(e => { if (e.name !== "AbortError") { setErr(true); setLoading(false); } });
    return () => ctrl.abort();
  }, [item.id, lang, mediaType]);

  /* Close on Escape */
  useEffect(() => {
    const fn = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (mediaType === 2) {
        if (e.key === "+") setZoom(z => Math.min(5, z + 0.5));
        if (e.key === "-") setZoom(z => Math.max(1, z - 0.5));
        if (e.key === "0") setZoom(1);
      }
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose, mediaType]);

  const Spinner = () => (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "32px 0" }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%",
        border: `3px solid ${c}33`, borderTopColor: c,
        animation: "hp-spin 1s linear infinite" }} />
      <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>جارٍ التحميل…</p>
    </div>
  );

  /* ── Video modal ── */
  if (mediaType === 1) return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,.96)", backdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", overflowY: "auto",
    }}>
      <button onClick={onClose} style={{
        position: "fixed", top: 16, right: 16, zIndex: 310,
        width: 40, height: 40, borderRadius: "50%",
        background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)",
        color: "#fff", fontSize: 22, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>×</button>

      <div onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 1080, padding: "0 0 32px" }}>
        <div style={{ position: "relative", paddingTop: "56.25%", background: "#000" }}>
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Spinner />
            </div>
          )}
          {err && !loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: "rgba(255,255,255,.4)" }}>تعذّر تحميل الفيديو</p>
            </div>
          )}
          {url && !loading && (
            <video controls autoPlay
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }}
              src={url} />
          )}
        </div>
        <div style={{ background: "#111", padding: "16px 24px 20px",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ color: "#fff", fontWeight: 700, fontSize: "clamp(15px,2.5vw,20px)", margin: "0 0 6px" }}>
              {item.title}
            </h2>
            {item.publishedAt && (
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)" }}>{fmtDate(item.publishedAt)}</span>
            )}
            {item.summary && (
              <p style={{ color: "rgba(255,255,255,.45)", fontSize: 13, lineHeight: 1.6, marginTop: 8, marginBottom: 0 }}>
                {item.summary}
              </p>
            )}
          </div>
          {url && (
            <button disabled={dl}
              onClick={async () => { setDl(true); try { await downloadBlob(url, item.title + ".mp4"); } finally { setDl(false); } }}
              style={{
                display: "flex", alignItems: "center", gap: 7, padding: "9px 20px",
                borderRadius: 10, border: "1px solid rgba(255,255,255,.18)",
                background: dl ? "rgba(255,255,255,.04)" : "rgba(255,255,255,.1)",
                color: dl ? "rgba(255,255,255,.25)" : "#fff",
                fontSize: 13, fontWeight: 600, cursor: dl ? "default" : "pointer", flexShrink: 0,
              }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              {dl ? "جارٍ..." : "تحميل الفيديو"}
            </button>
          )}
        </div>
      </div>
      <style>{`@keyframes hp-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Audio modal ── */
  if (mediaType === 3) return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,.75)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={(e: MouseEvent<HTMLDivElement>) => e.stopPropagation()} style={{
        background: "var(--surface)", borderRadius: 28, width: "100%", maxWidth: 440,
        overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,.4)",
      }}>
        {/* Artwork */}
        <div style={{
          height: 200, background: `linear-gradient(160deg,${c}cc,${c}44)`,
          display: "flex", alignItems: "center", justifyContent: "center", position: "relative",
        }}>
          {thumbSrc
            ? <Image src={thumbSrc} alt={item.title} width={120} height={120}
                style={{ borderRadius: 18, objectFit: "cover", boxShadow: "0 16px 48px rgba(0,0,0,.5)" }} />
            : <div style={{ width: 100, height: 100, borderRadius: 18,
                background: "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.5">
                  <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
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

        <div style={{ padding: "20px 24px 26px" }}>
          <h2 style={{ color: "var(--ink)", fontWeight: 700, fontSize: 17, lineHeight: 1.35, margin: "0 0 6px" }}>
            {item.title}
          </h2>
          {item.publishedAt && (
            <span style={{ fontSize: 12, color: "var(--muted-2)" }}>{fmtDate(item.publishedAt)}</span>
          )}
          {loading && <Spinner />}
          {err && !loading && (
            <p style={{ color: "var(--muted)", textAlign: "center", fontSize: 14, padding: "12px 0" }}>تعذّر تحميل الملف الصوتي</p>
          )}
          {url && !loading && (
            <>
              <audio ref={audioRef} controls autoPlay src={url}
                style={{ width: "100%", margin: "14px 0", borderRadius: 8, accentColor: c }} />
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
                {dl ? "جارٍ التحميل…" : "تحميل الحلقة"}
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes hp-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Article (PDF) drawer ── */
  if (mediaType === 4) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex", alignItems: "stretch" }}>
      <div onClick={onClose} style={{
        flex: 1, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
      }} />
      <div style={{
        width: "min(700px,100vw)", height: "100%",
        background: "var(--bg)", overflowY: "auto",
        display: "flex", flexDirection: "column",
        boxShadow: "-8px 0 40px rgba(0,0,0,.2)",
      }}>
        <div style={{ height: 4, background: `linear-gradient(90deg,${c},${c}66)`, flexShrink: 0 }} />

        <div style={{
          padding: "20px 28px 18px", borderBottom: "1px solid var(--line)",
          position: "sticky", top: 0, background: "var(--bg)", zIndex: 10,
          display: "flex", alignItems: "flex-start", gap: 14,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: "var(--ink)", fontWeight: 800, fontSize: 18, lineHeight: 1.4, margin: 0 }}>
              {item.title}
            </h2>
            {item.publishedAt && (
              <span style={{ fontSize: 12, color: "var(--muted-2)" }}>{fmtDate(item.publishedAt)}</span>
            )}
          </div>
          <button onClick={onClose}
            style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid var(--line)",
              background: "var(--surface)", cursor: "pointer", color: "var(--muted)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>×</button>
        </div>

        {item.summary && (
          <div style={{ padding: "20px 28px 0" }}>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: "var(--ink-2)", margin: 0,
              padding: "16px 20px", background: "var(--surface)", borderRadius: 12,
              borderInlineStart: `4px solid ${c}` }}>
              {item.summary}
            </p>
          </div>
        )}

        <div style={{ padding: "24px 28px 32px", flex: 1 }}>
          {loading && <Spinner />}
          {err && !loading && (
            <p style={{ color: "var(--muted)", textAlign: "center" }}>تعذّر تحميل المستند</p>
          )}
          {url && !loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 20,
                background: `linear-gradient(135deg,${c}22,${c}44)`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.4">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>المستند جاهز للعرض أو التحميل</p>
              <div style={{ display: "flex", gap: 10 }}>
                <a href={url} target="_blank" rel="noreferrer"
                  style={{ padding: "10px 24px", borderRadius: 10, border: "none",
                    background: c, color: "#fff", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  فتح PDF
                </a>
                <button disabled={dl}
                  onClick={async () => { setDl(true); try { await downloadBlob(url, item.title + ".pdf"); } finally { setDl(false); } }}
                  style={{ padding: "10px 20px", borderRadius: 10,
                    border: "1px solid var(--line)", background: "var(--surface)",
                    color: "var(--ink)", fontSize: 13, fontWeight: 600, cursor: dl ? "default" : "pointer",
                    display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12l7 7 7-7"/>
                  </svg>
                  {dl ? "جارٍ..." : "تحميل"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes hp-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  /* ── Image lightbox ── */
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,.97)", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 310,
        padding: "14px 18px",
        background: "linear-gradient(to bottom,rgba(0,0,0,.85),transparent)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ color: "#fff", fontWeight: 700, fontSize: 14, margin: 0,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
          {item.publishedAt && (
            <p style={{ color: "rgba(255,255,255,.45)", fontSize: 11, margin: "2px 0 0" }}>{fmtDate(item.publishedAt)}</p>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <button onClick={() => setZoom(z => Math.max(1, z - 0.5))} style={iconBtn}>−</button>
          <button onClick={() => setZoom(1)}
            style={{ ...iconBtn, minWidth: 52, fontSize: 11, borderRadius: 8, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={() => setZoom(z => Math.min(5, z + 0.5))} style={iconBtn}>+</button>
          <div style={{ width: 1, height: 24, background: "rgba(255,255,255,.15)", margin: "0 4px" }} />
          {url && (
            <button disabled={dl}
              onClick={async () => { setDl(true); try { await downloadBlob(url, item.title + ".jpg"); } finally { setDl(false); } }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", borderRadius: 20,
                border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.12)",
                color: "#fff", fontSize: 12, fontWeight: 600, cursor: dl ? "default" : "pointer" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 5v14M5 12l7 7 7-7"/>
              </svg>
              {dl ? "جارٍ..." : "تحميل"}
            </button>
          )}
          <button onClick={onClose} style={iconBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Image */}
      <div onClick={onClose} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%",
              border: "3px solid var(--gold)", borderTopColor: "transparent",
              animation: "hp-spin 1s linear infinite" }} />
            <p style={{ color: "rgba(255,255,255,.4)", fontSize: 12, margin: 0 }}>جارٍ تحميل الصورة...</p>
          </div>
        )}
        {url && (
          <img src={url} alt={item.title} onClick={e => e.stopPropagation()}
            style={{
              maxWidth: "calc(100vw - 80px)", maxHeight: "calc(100vh - 120px)",
              objectFit: "contain",
              transform: `scale(${zoom})`,
              transition: zoom === 1 ? "transform .25s" : "none",
              cursor: zoom > 1 ? "grab" : "default",
              borderRadius: zoom === 1 ? 10 : 0,
              boxShadow: zoom === 1 ? "0 24px 80px rgba(0,0,0,.8)" : "none",
            } as import("react").CSSProperties} />
        )}
      </div>
      <style>{`@keyframes hp-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const iconBtn: import("react").CSSProperties = {
  width: 36, height: 36, borderRadius: "50%", border: "1px solid rgba(255,255,255,.2)",
  background: "rgba(255,255,255,.08)", color: "#fff", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: 18, transition: "background .15s", flexShrink: 0,
};

/* ─── News Ticker ────────────────────────────────────────── */
function NewsTicker() {
  const { lang, t } = useLang();
  const [texts, setTexts] = useState<string[]>([]);
  const isAr = lang === "ar";

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPublicCategories(lang, ctrl.signal)
      .then(cats => {
        const newsCat = cats.find(c => c.sortOrder === 6);
        if (!newsCat) return Promise.resolve(null);
        return fetchPublicContents({ categoryId: newsCat.id, pageSize: 50, lang }, ctrl.signal);
      })
      .then(result => {
        if (!result) return;
        const texts = result.items.map(i => i.summary || i.title).filter((s): s is string => !!s);
        setTexts(texts);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [lang]);

  if (texts.length === 0) return null;

  const repeated = [...texts, ...texts, ...texts];
  const duration = texts.length * 6;
  /* badge arrow points INTO the ticker: right-arrow when badge is on left (LTR), left-arrow when badge is on right (RTL) */
  const badgeClip = isAr
    ? "polygon(12px 0,100% 0,100% 100%,12px 100%,0 50%)"
    : "polygon(0 0,calc(100% - 12px) 0,100% 50%,calc(100% - 12px) 100%,0 100%)";
  const tickerAnim = isAr ? "newsticker-ltr" : "newsticker-rtl";

  return (
    <div style={{
      background: "linear-gradient(90deg,#0a1f12 0%,var(--forest) 30%,var(--forest) 70%,#0a1f12 100%)",
      borderTop: "1px solid rgba(200,168,75,.25)",
      borderBottom: "1px solid rgba(200,168,75,.25)",
      display: "flex", alignItems: "center", height: 46, overflow: "hidden",
      flexDirection: isAr ? "row-reverse" : "row",
      direction: "ltr",
    }}>
      <div style={{
        flexShrink: 0, position: "relative", zIndex: 2,
        background: "linear-gradient(135deg,var(--gold),#e8c05a)",
        color: "var(--forest)", height: "100%",
        display: "flex", alignItems: "center", gap: 7,
        fontWeight: 800, fontSize: 12, letterSpacing: ".6px",
        clipPath: badgeClip,
        paddingInlineStart: isAr ? 28 : 20,
        paddingInlineEnd: isAr ? 20 : 28,
      }}>
        <span style={{ fontSize: 10 }}>📡</span>
        {t.tickerLabel}
      </div>
      <div style={{
        position: "absolute", [isAr ? "left" : "right"]: 0,
        width: 80, height: 46, zIndex: 1, pointerEvents: "none",
        background: isAr ? "linear-gradient(to right,#0a1f12,transparent)" : "linear-gradient(to left,#0a1f12,transparent)",
      }} />
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div style={{
          display: "inline-flex", gap: 0,
          animation: `${tickerAnim} ${duration}s linear infinite`,
          willChange: "transform",
        }}>
          {repeated.map((text, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", whiteSpace: "nowrap",
              color: "rgba(255,255,255,.82)", fontSize: 13, fontWeight: 500,
              padding: "0 32px",
            }}>
              <span style={{ color: "var(--gold)", fontSize: 7, marginInlineEnd: 14, opacity: .8 }}>◆</span>
              {text}
            </span>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes newsticker-rtl { from{transform:translateX(0)} to{transform:translateX(-33.333%)} }
        @keyframes newsticker-ltr { from{transform:translateX(-33.333%)} to{transform:translateX(0)} }
      `}</style>
    </div>
  );
}

/* ─── Hero ────────────────────────────────────────────────── */
function Hero() {
  const { t } = useLang();
  return (
    <div style={{
      background: "linear-gradient(150deg,var(--forest) 0%,#1a4332 55%,#0a1f12 100%)",
      padding: "72px 0 60px", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, opacity: .045,
        backgroundImage: "radial-gradient(circle,#C8A84B 1px,transparent 1px)",
        backgroundSize: "36px 36px" }} />
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 5,
        background: "linear-gradient(90deg,var(--gold),#e8c05a,var(--gold))" }} />
      <div className="hp-wrap" style={{ position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(200,168,75,.12)", border: "1px solid rgba(200,168,75,.3)",
            color: "var(--gold)", fontSize: 12, fontWeight: 700, padding: "6px 20px",
            borderRadius: 999, marginBottom: 26, letterSpacing: ".4px" }}>
            {t.heroEyebrow}
          </div>
          <h1 style={{
            color: "#fff", margin: "0 0 18px",
            fontSize: "clamp(15px,3.5vw,35px)", fontWeight: 900, lineHeight: 1.15,
            fontFamily: "'Noto Kufi Arabic',sans-serif", letterSpacing: "-.5px",
          }}>
            {t.heroHeadline}
          </h1>
          <p style={{
            color: "rgba(255,255,255,.6)", margin: "0 0 40px",
            fontSize: "clamp(15px,2vw,18px)", lineHeight: 1.75, maxWidth: 520, marginInline: "auto",
          }}>
            {t.heroSubtext}
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            {TOPIC_DEFS.map(topic => (
              <TopicPill key={topic.href} href={topic.href} icon={topic.icon} color={topic.color} label={t[topic.key]} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopicPill({ href, icon, label, color }: { href: string; icon: string; label: string; color: string }) {
  const [h, setH] = useState(false);
  return (
    <a href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 7,
        padding: "10px 22px", borderRadius: 999,
        background: h ? color + "40" : color + "20",
        border: `1.5px solid ${h ? color : color + "50"}`,
        color: "#fff", fontSize: 14, fontWeight: 600,
        textDecoration: "none", transition: "all .18s",
        transform: h ? "translateY(-2px)" : "none",
        boxShadow: h ? `0 6px 20px ${color}33` : "none",
      }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </a>
  );
}

/* ─── Content Card ───────────────────────────────────────── */
function ContentCard({ item, mediaType, onOpen }: {
  item: PublicItem;
  mediaType: number;
  onOpen: () => void;
}) {
  const [h, setH] = useState(false);
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);
  const { lang, t } = useLang();
  const meta = TYPE_COLOR[mediaType] ?? TYPE_COLOR[1];

  useEffect(() => {
    const ctrl = new AbortController();
    resolveThumb(item, ctrl.signal).then(url => {
      if (url) { setThumbSrc(url); return; }
      if (mediaType === 1 || mediaType === 2) {
        fetchPublicDetail(item.id, lang, ctrl.signal)
          .then(d => {
            const a = d.mediaAssets.find(x => matchesMediaType(x, mediaType) && x.isPrimary)
              ?? d.mediaAssets.find(x => matchesMediaType(x, mediaType));
            if (!a) return;
            setThumbSrc(assetThumbUrl(a.id));
          })
          .catch(() => {});
      }
    });
    return () => ctrl.abort();
  }, [item, mediaType, lang]);

  return (
    <div onClick={onOpen} style={{
        display: "block", cursor: "pointer",
        borderRadius: 12,
        border: `1.5px solid ${h ? meta.color + "60" : "var(--line)"}`,
        overflow: "hidden",
        background: "var(--surface)",
        boxShadow: h ? `0 6px 24px ${meta.color}22` : "var(--shadow-sm)",
        transition: "border-color .2s, box-shadow .2s, transform .2s",
        transform: h ? "translateY(-3px)" : "none",
      }}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}>

      {/* Thumbnail */}
      <div style={{ position: "relative", paddingTop: "56.25%", overflow: "hidden",
        background: `linear-gradient(135deg,${meta.color}18,${meta.color}30)` }}>
        {thumbSrc ? (
          <Image src={thumbSrc} alt={item.title} fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1100px) 33vw, 25vw"
            style={{ objectFit: "cover", transform: h ? "scale(1.04)" : "scale(1)", transition: "transform .45s" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 36, color: meta.color, opacity: .55 }}>
            {mediaType === 1 ? "🎬" : mediaType === 3 ? "🎧" : mediaType === 4 ? "📄" : "🖼️"}
          </div>
        )}
        <div style={{ position: "absolute", top: 10, right: 10,
          background: meta.color, color: "#fff",
          fontSize: 11, fontWeight: 700, padding: "3px 11px", borderRadius: 999 }}>
          {mediaType === 1 ? t.video : mediaType === 3 ? t.audio : mediaType === 4 ? t.articles : t.gallery}
        </div>
        {/* Play icon overlay for video/audio */}
        {(mediaType === 1 || mediaType === 3) && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", background: h ? "rgba(0,0,0,.3)" : "rgba(0,0,0,.12)", transition: "background .2s" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%",
              background: h ? "var(--gold)" : "rgba(255,255,255,.88)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transform: h ? "scale(1.12)" : "scale(1)", transition: "all .2s" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill={h ? "var(--forest)" : "#1a1a1a"} style={{ marginRight: -2 }}>
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>
        )}
        {item.isFeatured && (
          <div style={{ position: "absolute", top: 10, left: 10,
            background: "var(--gold)", color: "var(--forest)",
            fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 999 }}>{t.featured}</div>
        )}
      </div>

      <div style={{ height: 3, background: meta.color,
        transform: h ? "scaleX(1)" : "scaleX(.35)",
        transition: "transform .3s", transformOrigin: "right" }} />

      <div style={{ padding: "14px 14px 16px" }}>
        <h3 style={{
          color: "var(--ink)", fontSize: 16, fontWeight: 700, lineHeight: 1.45, margin: "0 0 7px",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {item.title}
        </h3>
        {item.summary && (
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.55, margin: "0 0 10px",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.summary}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {item.categoryName && (
            <span style={{ fontSize: 12, color: meta.color, fontWeight: 700 }}>{item.categoryName}</span>
          )}
          {item.categoryName && item.publishedAt && (
            <span style={{ fontSize: 12, color: "var(--muted-2)" }}>·</span>
          )}
          {item.publishedAt && (
            <span style={{ fontSize: 12, color: "var(--muted-2)" }}>{fmtDate(item.publishedAt)}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div style={{ paddingTop: "56.25%", background: "var(--surface-2)", borderRadius: 6, position: "relative" }} />
      <div style={{ height: 3, background: "var(--surface-2)", marginBottom: 14 }} />
      <div style={{ height: 16, borderRadius: 4, background: "var(--surface-2)", width: "88%", marginBottom: 8 }} />
      <div style={{ height: 13, borderRadius: 4, background: "var(--surface-2)", width: "65%", marginBottom: 8 }} />
      <div style={{ height: 12, borderRadius: 4, background: "var(--surface-2)", width: "40%" }} />
    </div>
  );
}

/* ─── Content Section ──────────────────────────────────────── */
function Section({ title, icon, href, mediaType, categoryId, count = 4, onOpen }:
  { title: string; icon: string; href: string; mediaType: number; categoryId?: string; count?: number;
    onOpen: (item: PublicItem, mt: number) => void }) {
  const { lang, t } = useLang();
  const [items, setItems] = useState<PublicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const meta = TYPE_COLOR[mediaType];

  useEffect(() => {
    const ctrl = new AbortController();
    const params = categoryId
      ? { pageSize: count, categoryId, lang }
      : { pageSize: count, mediaType, lang };
    fetchPublicContents(params, ctrl.signal)
      .then(d => { setItems(d.items); setLoading(false); })
      .catch(() => setLoading(false));
    return () => ctrl.abort();
  }, [mediaType, categoryId, count, lang]);

  return (
    <section style={{ padding: "56px 0 0" }}>
      <div className="hp-wrap">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 28, paddingBottom: 18, borderBottom: `2px solid var(--line)` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 26, borderRadius: 2, background: meta.color, flexShrink: 0 }} />
            <h2 style={{ color: "var(--ink)", fontWeight: 800, fontSize: 22,
              fontFamily: "'Noto Kufi Arabic',sans-serif", margin: 0,
              display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              {title}
            </h2>
          </div>
          <SeeAll href={href} color={meta.color} />
        </div>

        <div className="hp-grid">
          {loading
            ? Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)
            : items.length === 0
              ? <p style={{ color: "var(--muted)", fontSize: 14, gridColumn: "1/-1", padding: "20px 0" }}>{t.noContent}</p>
              : items.map(item => (
                  <ContentCard key={item.id} item={item} mediaType={mediaType}
                    onOpen={() => onOpen(item, mediaType)} />
                ))
          }
        </div>
      </div>
    </section>
  );
}

function SeeAll({ href, color }: { href: string; color: string }) {
  const [h, setH] = useState(false);
  const { t } = useLang();
  return (
    <a href={href} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        color: h ? color : "var(--muted)", fontSize: 13, fontWeight: 700,
        textDecoration: "none", padding: "7px 14px", borderRadius: 8,
        border: `1.5px solid ${h ? color + "55" : "var(--line)"}`,
        background: h ? color + "0d" : "transparent", transition: "all .15s",
      }}>
      {t.seeAll}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </a>
  );
}

/* ─── Page ────────────────────────────────────────────────── */
export default function HomePage() {
  const { lang, t } = useLang();
  const [articlesCatId, setArticlesCatId] = useState<string | undefined>(undefined);
  const [activeItem, setActiveItem] = useState<{ item: PublicItem; mediaType: number } | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPublicCategories(lang, ctrl.signal)
      .then(cats => {
        const cat = cats.find((c: PubCategory) => c.sortOrder === 1);
        setArticlesCatId(cat?.id);
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [lang]);

  function handleOpen(item: PublicItem, mediaType: number) {
    setActiveItem({ item, mediaType });
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Hero />
        <NewsTicker />
        <Section title={t.video}    icon="🎬" href="/video"    mediaType={1} count={4} onOpen={handleOpen} />
        <Section title={t.audio}    icon="🎧" href="/audio"    mediaType={3} count={4} onOpen={handleOpen} />
        <Section title={t.articles} icon="📖" href="/articles" mediaType={4} categoryId={articlesCatId} count={4} onOpen={handleOpen} />
        <Section title={t.gallery}  icon="🖼️" href="/gallery"  mediaType={2} count={4} onOpen={handleOpen} />
        <div style={{ height: 80 }} />
      </main>
      <Footer />

      {activeItem && (
        <ContentModal
          item={activeItem.item}
          mediaType={activeItem.mediaType}
          onClose={() => setActiveItem(null)}
        />
      )}

      <style>{`
        .hp-wrap { max-width: 1280px; margin: 0 auto; padding-inline: 24px; }
        .hp-grid { display: grid; gap: 32px 24px; grid-template-columns: repeat(4,1fr); }
        @media (max-width: 1100px) { .hp-grid { grid-template-columns: repeat(3,1fr); } }
        @media (max-width: 768px)  { .hp-grid { grid-template-columns: repeat(2,1fr); gap: 24px 16px; } }
        @media (max-width: 480px)  { .hp-grid { grid-template-columns: 1fr; gap: 28px; }
                                      .hp-wrap { padding-inline: 16px; } }
      `}</style>
    </div>
  );
}
