"use client";

import { useState, useEffect } from "react";
import { X, Clock, ArrowLeft, User, MessageSquare } from "lucide-react";
import { getWorkflowHistory, type WorkflowHistoryEntry } from "@/lib/contents";
import { useLang } from "@/lib/LangContext";
import { ApiError } from "@/lib/api";

/* Known action names → Arabic translation */
const ACTION_NAME_AR: Record<string, string> = {
  "Direct Status Override": "تغيير مباشر للحالة",
  "Workflow Transition":    "انتقال سير العمل",
  "System":                 "النظام",
};

/* Status num → meta */
const STATUS_META: Record<number, { bg: string; color: string; ar: string; en: string }> = {
  0: { bg: "rgba(100,116,139,.12)", color: "#64748B", ar: "مسودة",           en: "Draft"                },
  1: { bg: "rgba(234,179,8,.12)",   color: "#B45309", ar: "مراجعة المحتوى",  en: "Content Review"       },
  2: { bg: "rgba(168,85,247,.12)",  color: "#7C3AED", ar: "مراجعة اللغة",    en: "Language Review"      },
  3: { bg: "rgba(59,130,246,.12)",  color: "#1D4ED8", ar: "مراجعة الجودة",   en: "Quality Review"       },
  4: { bg: "rgba(16,185,129,.12)",  color: "#065F46", ar: "منشور",           en: "Published"            },
  5: { bg: "rgba(239,68,68,.12)",   color: "#B91C1C", ar: "مرفوض",           en: "Rejected"             },
  6: { bg: "rgba(107,114,128,.12)", color: "#374151", ar: "مؤرشف",           en: "Archived"             },
  7: { bg: "rgba(107,114,128,.12)", color: "#374151", ar: "غير نشط",         en: "Inactive"             },
  8: { bg: "rgba(59,130,246,.12)",  color: "#1D4ED8", ar: "مجدول",           en: "Scheduled"            },
};

function StatusBadge({ status, lang }: { status: number; lang: string }) {
  const m = STATUS_META[status] ?? { bg: "rgba(100,116,139,.12)", color: "#64748B", ar: String(status), en: String(status) };
  return (
    <span style={{
      padding: "2px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
      background: m.bg, color: m.color, whiteSpace: "nowrap",
    }}>
      {lang === "ar" ? m.ar : m.en}
    </span>
  );
}

function fmtDate(iso: string, lang: string) {
  return new Date(iso).toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

interface Props {
  contentId: string;
  contentTitle: string;
  onClose: () => void;
}

export default function WorkflowHistoryDrawer({ contentId, contentTitle, onClose }: Props) {
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [entries, setEntries] = useState<WorkflowHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  function load() {
    setLoading(true);
    setError(false);
    setForbidden(false);
    getWorkflowHistory(contentId)
      .then(data => { setEntries(data); setLoading(false); })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 403) setForbidden(true);
        else setError(true);
        setLoading(false);
      });
  }

  useEffect(() => { load(); }, [contentId]);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 300);
  }

  const t = {
    title:        isAr ? "سجل سير العمل"                        : "Workflow History",
    empty:        isAr ? "لا يوجد سجل بعد"                      : "No history yet",
    emptyDesc:    isAr ? "لم تُجرَ أي تحولات على هذا المحتوى"   : "No transitions have been made yet",
    errMsg:       isAr ? "تعذّر تحميل السجل"                     : "Failed to load history",
    forbiddenMsg: isAr ? "ليس لديك صلاحية لعرض سجل سير العمل"   : "You don't have permission to view workflow history",
    retry:        isAr ? "إعادة المحاولة"                         : "Retry",
    loading:      isAr ? "جارٍ التحميل…"                         : "Loading…",
    by:           isAr ? "بواسطة"                                 : "By",
    from:         isAr ? "من:"                                    : "From:",
    to:           isAr ? "إلى:"                                   : "To:",
  };

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)",
        opacity: visible ? 1 : 0, transition: "opacity .3s",
      }} />

      {/* Drawer */}
      <aside style={{
        position: "fixed", top: 0, bottom: 0,
        [isAr ? "right" : "left"]: 0,
        zIndex: 201,
        width: "min(480px,100vw)",
        background: "var(--surface)",
        display: "flex", flexDirection: "column",
        boxShadow: isAr ? "-8px 0 40px rgba(0,0,0,.18)" : "8px 0 40px rgba(0,0,0,.18)",
        transform: visible ? "translateX(0)" : isAr ? "translateX(100%)" : "translateX(-100%)",
        transition: "transform .3s cubic-bezier(.32,0,.15,1)",
      }}>
        {/* Top accent */}
        <div style={{ height: 4, background: "linear-gradient(90deg,var(--gold),var(--forest))", flexShrink: 0 }} />

        {/* Header */}
        <div style={{
          padding: "18px 20px 16px", borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "flex-start", gap: 12,
          position: "sticky", top: 0, background: "var(--surface)", zIndex: 10,
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Clock size={16} style={{ color: "var(--gold)", flexShrink: 0 }} />
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>{t.title}</h2>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", lineHeight: 1.4 }}>{contentTitle}</p>
          </div>
          <button onClick={handleClose} style={{
            width: 34, height: 34, borderRadius: 10,
            border: "1px solid var(--line)", background: "var(--surface-2)",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <X size={15} style={{ color: "var(--muted)" }} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 32px" }}>

          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: "60px 0" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%",
                border: "3px solid var(--surface-2)", borderTopColor: "var(--gold)",
                animation: "wh-spin 1s linear infinite" }} />
              <p style={{ color: "var(--muted)", fontSize: 13 }}>{t.loading}</p>
            </div>
          )}

          {forbidden && !loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
              <p style={{ color: "var(--muted)", fontSize: 14 }}>{t.forbiddenMsg}</p>
            </div>
          )}

          {error && !loading && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: "var(--muted)", fontSize: 14, marginBottom: 16 }}>{t.errMsg}</p>
              <button onClick={load} style={{
                padding: "8px 20px", borderRadius: 8, border: "1px solid var(--line)",
                background: "var(--surface-2)", color: "var(--ink)", cursor: "pointer", fontSize: 13,
              }}>{t.retry}</button>
            </div>
          )}

          {!loading && !error && !forbidden && entries.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <p style={{ color: "var(--ink)", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{t.empty}</p>
              <p style={{ color: "var(--muted)", fontSize: 13 }}>{t.emptyDesc}</p>
            </div>
          )}

          {!loading && !error && !forbidden && entries.length > 0 && (
            <div style={{ position: "relative" }}>
              {/* Timeline line */}
              <div style={{
                position: "absolute",
                [isAr ? "right" : "left"]: 18,
                top: 0, bottom: 0, width: 2,
                background: "var(--line)",
              }} />

              <div style={{ display: "flex", flexDirection: "column" }}>
                {entries.map((entry, i) => {
                  const toMeta = STATUS_META[entry.toStatus] ?? STATUS_META[0];
                  return (
                    <div key={entry.id} style={{
                      position: "relative",
                      paddingInlineStart: 48,
                      paddingBottom: i < entries.length - 1 ? 28 : 0,
                    }}>
                      {/* Dot */}
                      <div style={{
                        position: "absolute",
                        [isAr ? "right" : "left"]: 8,
                        top: 4, width: 20, height: 20,
                        borderRadius: "50%",
                        background: toMeta.bg,
                        border: `2px solid ${toMeta.color}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1,
                      }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: toMeta.color }} />
                      </div>

                      {/* Card */}
                      <div style={{
                        background: "var(--bg)", borderRadius: 12,
                        border: "1px solid var(--line)", padding: "12px 14px",
                        boxShadow: "0 1px 4px rgba(0,0,0,.04)",
                      }}>
                        {/* Action name */}
                        {entry.actionName && (
                          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--forest)", marginBottom: 8 }}>
                            {isAr ? (ACTION_NAME_AR[entry.actionName] ?? entry.actionName) : entry.actionName}
                          </div>
                        )}

                        {/* Status transition */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: ".05em" }}>{t.from}</span>
                            <StatusBadge status={entry.fromStatus} lang={lang} />
                          </div>
                          <ArrowLeft size={12} style={{
                            color: "var(--muted-2)", marginTop: 10,
                            transform: isAr ? "none" : "rotate(180deg)",
                          }} />
                          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: ".05em" }}>{t.to}</span>
                            <StatusBadge status={entry.toStatus} lang={lang} />
                          </div>
                        </div>

                        {/* Comment */}
                        {entry.comment && (
                          <div style={{
                            background: "var(--surface)", borderRadius: 8, padding: "8px 10px",
                            marginBottom: 8, borderInlineStart: "3px solid var(--gold)",
                            display: "flex", gap: 6, alignItems: "flex-start",
                          }}>
                            <MessageSquare size={12} style={{ color: "var(--gold)", marginTop: 2, flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.5 }}>
                              {entry.comment}
                            </p>
                          </div>
                        )}

                        {/* Meta: user + date */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                          gap: 8, flexWrap: "wrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 24, height: 24, borderRadius: "50%",
                              background: "linear-gradient(135deg,var(--gold),var(--gold-2))",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <User size={12} style={{ color: "var(--forest)" }} />
                            </div>
                            <div>
                              <p style={{ margin: 0, fontSize: 9, fontWeight: 700, color: "var(--muted-2)", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 1 }}>
                                {t.by}
                              </p>
                              <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
                                {entry.transitionedBy.fullName}
                              </p>
                              <p style={{ margin: 0, fontSize: 10, color: "var(--muted-2)" }}>
                                {entry.transitionedBy.email}
                              </p>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--muted-2)", whiteSpace: "nowrap" }}>
                            {fmtDate(entry.transitionedAt, lang)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>

      <style>{`@keyframes wh-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
