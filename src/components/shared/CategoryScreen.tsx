"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  fetchPublicContents,
  fetchPublicCategories,
  type PublicItem,
  type PubCategory,
} from "@/lib/public";
import { useLang } from "@/lib/LangContext";

/* ─── Pagination ─────────────────────────────────────────── */
export function Pagination({
  page, totalPages, setPage,
}: {
  page: number; totalPages: number; setPage: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const range = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return Array.from({ length: 7 }, (_, i) => i + 1);
    if (page >= totalPages - 3) return Array.from({ length: 7 }, (_, i) => totalPages - 6 + i);
    return Array.from({ length: 7 }, (_, i) => page - 3 + i);
  })();

  const btn = (label: ReactNode, active: boolean, disabled: boolean, onClick: () => void) => (
    <button onClick={onClick} disabled={disabled} style={{
      minWidth: 38, height: 38, padding: "0 10px", borderRadius: 10,
      border: `1px solid ${active ? "var(--gold)" : "var(--line)"}`,
      background: active ? "var(--gold)" : "var(--surface)",
      color: disabled ? "var(--muted-2)" : active ? "var(--forest)" : "var(--ink)",
      fontWeight: active ? 700 : 400, cursor: disabled ? "default" : "pointer",
      fontSize: 13, transition: "all .15s",
    }}>
      {label}
    </button>
  );

  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 40, flexWrap: "wrap" }}>
      {btn("→", false, page === 1, () => setPage(page - 1))}
      {range.map(p => btn(p, p === page, false, () => setPage(p)))}
      {btn("←", false, page === totalPages, () => setPage(page + 1))}
    </div>
  );
}

/* ─── Skeleton grid ──────────────────────────────────────── */
export function SkeletonGrid({ count, ratio = "56.25%" }: { count: number; ratio?: string }) {
  return (
    <div className="cs-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse" style={{
          borderRadius: 20, overflow: "hidden",
          background: "var(--surface)", border: "1px solid var(--line)",
        }}>
          <div style={{ paddingTop: ratio, background: "var(--surface-2)" }} />
          <div style={{ padding: "14px 16px" }}>
            <div style={{ height: 14, borderRadius: 6, background: "var(--surface-2)", width: "70%", marginBottom: 8 }} />
            <div style={{ height: 11, borderRadius: 6, background: "var(--surface-2)", width: "45%" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Filter pill ────────────────────────────────────────── */
function SubPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        flexShrink: 0, padding: "7px 20px", borderRadius: 999,
        border: `1px solid ${active ? "var(--gold)" : hover ? "var(--forest)" : "var(--line)"}`,
        background: active ? "var(--gold)" : hover ? "var(--surface-2)" : "transparent",
        color: active ? "var(--forest)" : hover ? "var(--ink)" : "var(--ink-2)",
        fontWeight: active ? 700 : 500, fontSize: 13,
        cursor: "pointer", transition: "all .15s",
        boxShadow: active ? "0 2px 10px rgba(200,168,75,.28)" : "none",
      }}
    >
      {label}
    </button>
  );
}

/* ─── Subcategory filter bar ─────────────────────────────── */
/*
 * category === undefined  → still loading  → show skeleton pills
 * category === null       → not found      → hide bar
 * subs.length === 0       → no subs        → hide bar
 * subs.length > 0         → show pills
 */
function SubcategoryBar({
  category, activeSubId, onSelect,
}: {
  category: PubCategory | null | undefined;
  activeSubId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const barStyle: React.CSSProperties = {
    position: "sticky", top: 65, zIndex: 40,
    background: "color-mix(in srgb,var(--bg) 94%,transparent)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid var(--line)",
  };

  /* Skeleton while loading */
  if (category === undefined) {
    return (
      <div style={barStyle}>
        <div className="cs-container">
          <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 0" }}>
            <span style={{ fontSize: 12, color: "var(--muted-2)", fontWeight: 600, flexShrink: 0 }}>تصفية:</span>
            {[90, 70, 110, 80, 100].map((w, i) => (
              <div key={i} className="animate-pulse" style={{ flexShrink: 0, height: 34, width: w, borderRadius: 999, background: "var(--surface-2)" }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const subs = category?.subcategories ?? [];
  if (subs.length === 0) return null;

  return (
    <div style={barStyle}>
      <div className="cs-container">
        <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "10px 0", overflowX: "auto", scrollbarWidth: "none" }}>
          <span style={{ fontSize: 12, color: "var(--muted-2)", fontWeight: 600, flexShrink: 0 }}>تصفية:</span>
          <SubPill label="الكل" active={activeSubId === null} onClick={() => onSelect(null)} />
          {subs.map(sub => (
            <SubPill key={sub.id} label={sub.name} active={sub.id === activeSubId} onClick={() => onSelect(sub.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Main hook ──────────────────────────────────────────── */
export function useCategoryData(
  categoryName: string,
  page: number,
  subId: string | null,
  pageSize: number,
  mediaType?: number,
) {
  const { lang } = useLang();
  const [category, setCategory] = useState<PubCategory | null | undefined>(undefined);
  const [items, setItems]       = useState<PublicItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);

  /* Find this screen's category — re-fetch when language changes */
  useEffect(() => {
    const ctrl = new AbortController();
    fetchPublicCategories(lang, ctrl.signal)
      .then(cats => setCategory(cats.find(c => c.name === categoryName) ?? null))
      .catch(e => { if (e.name !== "AbortError") setCategory(null); });
    return () => ctrl.abort();
  }, [categoryName, lang]);

  /* Fetch content once category lookup finishes */
  useEffect(() => {
    if (category === undefined) return;
    const ctrl = new AbortController();
    const resetTimer = window.setTimeout(() => {
      setLoading(true);
      setError(false);
    }, 0);
    fetchPublicContents(
      {
        page, pageSize, mediaType,
        categoryId: category?.id,
        subcategoryId: subId ?? undefined,
        lang,
      },
      ctrl.signal,
    )
      .then(d => { setItems(d.items); setTotalPages(d.totalPages); })
      .catch(e => { if (e.name !== "AbortError") setError(true); })
      .finally(() => setLoading(false));
    return () => {
      window.clearTimeout(resetTimer);
      ctrl.abort();
    };
  }, [category, page, subId, pageSize, mediaType, lang]);

  return { category, items, totalPages, loading, error };
}

/* ─── CategoryScreen ─────────────────────────────────────── */
export interface CategoryScreenProps {
  /** Exact category name as stored in DB e.g. "الاطلاع / Reading" */
  categoryName: string;
  /** 1=Video 2=Image 3=Audio 4=Document 5=PDF */
  mediaType: number;
  icon: string;
  title: string;
  subtitle: string;
  emptyMessage: string;
  pageSize?: number;
  gridCols?: string;
  skeletonRatio?: string;
  renderCard: (item: PublicItem, onClick: () => void) => ReactNode;
  renderModal?: (item: PublicItem | null, onClose: () => void) => ReactNode;
}

export default function CategoryScreen({
  categoryName, mediaType, icon, title, subtitle, emptyMessage,
  pageSize = 12, gridCols = "repeat(3,1fr)",
  skeletonRatio = "56.25%",
  renderCard, renderModal,
}: CategoryScreenProps) {
  const [page, setPage]         = useState(1);
  const [subId, setSubId]       = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const { category, items, totalPages, loading, error } = useCategoryData(
    categoryName, page, subId, pageSize, mediaType,
  );

  const handleSub = useCallback((id: string | null) => {
    setSubId(id);
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handlePage = useCallback((p: number) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const activeSub = category?.subcategories.find(s => s.id === subId) ?? null;
  const activeItem = items.find(i => i.id === activeId) ?? null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <Header />

      {/* Page header */}
      <div style={{ padding: "28px 0 18px", borderBottom: "1px solid var(--line)" }}>
        <div className="cs-container">
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)", fontFamily: "'Noto Kufi Arabic',sans-serif", margin: 0 }}>
                {icon} {title}
              </h1>
              <p style={{ color: "var(--muted)", marginTop: 5, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                {subtitle}
                {activeSub && (
                  <><span style={{ color: "var(--line)" }}>›</span>
                  <span style={{ color: "var(--gold)", fontWeight: 600 }}>{activeSub.name}</span></>
                )}
              </p>
            </div>

            {/* Active subcategory badge */}
            {subId && activeSub && (
              <button onClick={() => handleSub(null)} style={{
                display: "flex", alignItems: "center", gap: 5, padding: "5px 14px",
                borderRadius: 999, border: "1px solid var(--gold)",
                background: "rgba(200,168,75,.08)", color: "var(--gold)",
                fontSize: 12, fontWeight: 700, cursor: "pointer",
              }}>
                {activeSub.name} <span>×</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sticky subcategory filter bar */}
      <SubcategoryBar category={category} activeSubId={subId} onSelect={handleSub} />

      {/* Content */}
      <main style={{ flex: 1 }}>
        <div className="cs-container" style={{ padding: "32px 0 56px" }}>

          {error && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <p style={{ color: "var(--muted)", marginBottom: 16 }}>حدث خطأ أثناء التحميل</p>
              <button onClick={() => window.location.reload()} style={{
                padding: "8px 22px", borderRadius: 10, border: "1px solid var(--line)",
                background: "var(--surface)", color: "var(--ink)", cursor: "pointer", fontSize: 13,
              }}>
                إعادة المحاولة
              </button>
            </div>
          )}

          {loading && <SkeletonGrid count={pageSize} ratio={skeletonRatio} />}

          {!loading && !error && items.length === 0 && (
            <div style={{ textAlign: "center", padding: 60 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
              <p style={{ color: "var(--muted)", fontSize: 15 }}>{emptyMessage}</p>
              {subId && (
                <button onClick={() => handleSub(null)} style={{
                  marginTop: 16, padding: "8px 22px", borderRadius: 10,
                  border: "1px solid var(--gold)", background: "transparent",
                  color: "var(--forest)", cursor: "pointer", fontSize: 13, fontWeight: 600,
                }}>
                  عرض جميع المحتويات
                </button>
              )}
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="cs-grid">
              {items.map(item => renderCard(item, () => setActiveId(item.id)))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} setPage={handlePage} />
        </div>
      </main>

      <Footer />

      {renderModal?.(activeItem, () => setActiveId(null))}

      <style>{`
        .cs-container { max-width: 1280px; margin: 0 auto; padding-inline: 24px; }
        .cs-grid { display: grid; gap: 24px; grid-template-columns: ${gridCols}; }
        @media (max-width: 1024px) { .cs-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 640px)  { .cs-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  );
}
