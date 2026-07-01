"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getContents, STATUS_LABEL_AR, STATUS_LABEL_EN, STATUS_COLOR, type ContentListItem, type ContentStatus } from "@/lib/contents";
import { useLang } from "@/lib/LangContext";
import { isLoggedIn } from "@/lib/auth";
import { useDebounce } from "@/hooks/useDebounce";

const STATUSES: ContentStatus[] = [
  "Draft","ContentReview","LanguageReview","MediaQualityReview","FinalApproval","Published","Rejected","Scheduled","Archived",
];

function StatusBadge({ status, lang }: { status: ContentStatus; lang: "ar" | "en" }) {
  const color = STATUS_COLOR[status];
  const label = lang === "ar" ? STATUS_LABEL_AR[status] : STATUS_LABEL_EN[status];
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
      style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
      {label}
    </span>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

export default function ContentsPage() {
  const { lang, t } = useLang();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) router.replace("/login");
  }, [router]);

  const [items, setItems] = useState<ContentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const [status, setStatus] = useState<ContentStatus | "">("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true); setError("");
    getContents({ page, pageSize: 12, search: debouncedSearch || undefined, status: status || undefined })
      .then(r => { setItems(r.items); setTotalPages(r.totalPages); setTotalCount(r.totalCount); })
      .catch(() => setError(lang === "ar" ? "تعذّر تحميل المحتوى" : "Failed to load content"))
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, status, lang]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Header bar */}
        <section className="py-10 relative overflow-hidden"
          style={{ background: "linear-gradient(150deg,var(--forest),#142E22)" }}>
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at 60% 50%,rgba(200,168,75,.14),transparent 60%)" }} />
          <div className="container-main relative z-10 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase mb-2 flex items-center gap-2">
                <span className="w-5 h-0.5 rounded" style={{ background: "var(--gold)" }} />
                <span style={{ color: "var(--gold)" }}>{lang === "ar" ? "إدارة المحتوى" : "Content Management"}</span>
              </p>
              <h1 className="font-extrabold text-white" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", fontSize: "clamp(24px,4vw,38px)" }}>
                {lang === "ar" ? "المحتوى" : "Contents"}
              </h1>
              <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,.55)" }}>
                {totalCount} {lang === "ar" ? "عنصر" : "items"}
              </p>
            </div>
            <Link href="/contents/new"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: "var(--gold)", color: "var(--forest)", boxShadow: "var(--shadow-gold)" }}>
              + {lang === "ar" ? "إضافة محتوى" : "Add Content"}
            </Link>
          </div>
        </section>

        <section className="py-8">
          <div className="container-main">
            {/* Filters */}
            <div className="flex gap-3 flex-wrap mb-6">
              <input
                type="search"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder={lang === "ar" ? "ابحث في العناوين..." : "Search titles..."}
                className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--surface)", border: "1.5px solid var(--line)", color: "var(--ink)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--line)")}
              />
              <select value={status} onChange={e => { setStatus(e.target.value as ContentStatus | ""); setPage(1); }}
                className="px-4 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--surface)", border: "1.5px solid var(--line)", color: "var(--ink)", minWidth: "160px" }}>
                <option value="">{lang === "ar" ? "كل الحالات" : "All Statuses"}</option>
                {STATUSES.map(s => (
                  <option key={s} value={s}>{lang === "ar" ? STATUS_LABEL_AR[s] : STATUS_LABEL_EN[s]}</option>
                ))}
              </select>
            </div>

            {/* Table */}
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: "var(--surface-2)" }} />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-lg font-bold mb-4" style={{ color: "var(--ink)" }}>⚠️ {error}</p>
                <button onClick={load} className="px-5 py-2 rounded-xl text-sm font-bold"
                  style={{ background: "var(--forest)", color: "#fff" }}>
                  {t.retry}
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-5xl mb-4">📄</p>
                <p className="font-bold mb-4" style={{ color: "var(--ink)", fontSize: "18px" }}>
                  {lang === "ar" ? "لا يوجد محتوى بعد" : "No content yet"}
                </p>
                <Link href="/contents/new" className="px-5 py-2.5 rounded-xl text-sm font-bold"
                  style={{ background: "var(--forest)", color: "#fff" }}>
                  + {lang === "ar" ? "أضف أول محتوى" : "Add First Content"}
                </Link>
              </div>
            ) : (
              <>
                <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "var(--line)", overflowX: "auto" }}>
                  <table className="w-full text-sm" style={{ minWidth: 520 }}>
                    <thead>
                      <tr style={{ background: "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
                        <th className="px-5 py-3 text-start font-bold" style={{ color: "var(--ink-2)" }}>
                          {lang === "ar" ? "العنوان" : "Title"}
                        </th>
                        <th className="px-4 py-3 text-start font-bold hidden sm:table-cell" style={{ color: "var(--ink-2)" }}>
                          {lang === "ar" ? "الحالة" : "Status"}
                        </th>
                        <th className="px-4 py-3 text-start font-bold hidden md:table-cell" style={{ color: "var(--ink-2)" }}>
                          {lang === "ar" ? "التصنيف" : "Category"}
                        </th>
                        <th className="px-4 py-3 text-start font-bold hidden lg:table-cell" style={{ color: "var(--ink-2)" }}>
                          {lang === "ar" ? "التاريخ" : "Date"}
                        </th>
                        <th className="px-4 py-3 text-start font-bold" style={{ color: "var(--ink-2)" }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={item.id}
                          style={{ background: i % 2 === 0 ? "var(--surface)" : "var(--surface-2)", borderBottom: "1px solid var(--line)" }}>
                          <td className="px-5 py-4">
                            <div className="font-semibold" style={{ color: "var(--ink)" }}>{item.title}</div>
                            {item.summary && <div className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--muted)" }}>{item.summary}</div>}
                          </td>
                          <td className="px-4 py-4 hidden sm:table-cell">
                            <StatusBadge status={item.status} lang={lang} />
                          </td>
                          <td className="px-4 py-4 hidden md:table-cell text-xs" style={{ color: "var(--muted)" }}>
                            {item.categoryName ?? "—"}
                          </td>
                          <td className="px-4 py-4 hidden lg:table-cell text-xs" style={{ color: "var(--muted)" }}>
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-4 py-4">
                            <Link href={`/contents/${item.id}`}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                              style={{ background: "var(--surface-3)", color: "var(--forest)", border: "1px solid var(--line-gold)" }}>
                              {lang === "ar" ? "إدارة" : "Manage"}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                      className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                      style={{ borderColor: "var(--line)", color: "var(--ink)", opacity: page === 1 ? 0.4 : 1 }}>
                      {lang === "ar" ? "السابق" : "Prev"}
                    </button>
                    <span className="text-sm" style={{ color: "var(--muted)" }}>{page} / {totalPages}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                      className="px-4 py-2 rounded-xl text-sm font-bold border transition-all"
                      style={{ borderColor: "var(--line)", color: "var(--ink)", opacity: page === totalPages ? 0.4 : 1 }}>
                      {lang === "ar" ? "التالي" : "Next"}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
