"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, Moon, Sun, Menu, X, LogOut, UserCircle, Bell } from "lucide-react";
import { getUser, clearSession, type UserInfo } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { useLang } from "@/lib/LangContext";

/* ─── Notifications types & API ─────────────────────────────── */
interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  referenceId: string | null;
  actionUrl: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  items: Notification[];
  totalCount: number;
  page: number;
}

async function fetchNotifications(signal?: AbortSignal): Promise<NotificationsResponse> {
  return apiFetch<NotificationsResponse>(
    "/api/v1/Notifications?unreadOnly=false&page=1&pageSize=20",
    { signal }
  );
}

async function markAsRead(id: string): Promise<boolean> {
  return apiFetch<boolean>(`/api/v1/Notifications/${id}/read`, { method: "PUT" });
}

function fmtNotifDate(iso: string, isAr: boolean) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1)  return isAr ? "الآن" : "Just now";
  if (diffMin < 60) return isAr ? `منذ ${diffMin} د` : `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)   return isAr ? `منذ ${diffH} س` : `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)    return isAr ? `منذ ${diffD} يوم` : `${diffD}d ago`;
  return d.toLocaleDateString(isAr ? "ar-EG" : "en-GB", { month: "short", day: "numeric" });
}

/* ─── NotificationBell component ────────────────────────────── */
function NotificationBell({ lang }: { lang: string }) {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [isMobile,      setIsMobile]      = useState(false);
  const panelRef       = useRef<HTMLDivElement>(null);
  const portalPanelRef = useRef<HTMLDivElement>(null);

  /* Detect mobile screen */
  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 640); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true);
      const data = await fetchNotifications(signal);
      setNotifications(data.items);
      setUnreadCount(data.items.filter(n => !n.isRead).length);
    } catch {
      /* silently ignore — don't disrupt the page */
    } finally {
      setLoading(false);
    }
  }, []);

  /* Initial load + poll every 60 s */
  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    const interval = setInterval(() => load(), 60_000);
    return () => { ctrl.abort(); clearInterval(interval); };
  }, [load]);

  /* Close on outside click — exclude both the inline panel and the portal panel */
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const insidePanel  = panelRef.current?.contains(target);
      const insidePortal = portalPanelRef.current?.contains(target);
      if (!insidePanel && !insidePortal) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* Reload when opening */
  function handleOpen() {
    setOpen(v => !v);
    if (!open) load();
  }

  async function handleNotifClick(id: string, isRead: boolean) {
    if (isRead) return;
    /* Optimistic update — reflect change immediately */
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
    /* Persist to backend — revert on failure */
    try {
      await markAsRead(id);
    } catch {
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: false, readAt: null } : n)
      );
      setUnreadCount(prev => prev + 1);
    }
  }

  const isAr = lang === "ar";

  return (
    <div ref={panelRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        title={isAr ? "الإشعارات" : "Notifications"}
        style={{
          width: 40, height: 40, borderRadius: 12,
          border: "1px solid var(--line)",
          background: open ? "var(--surface-2)" : "var(--surface)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", position: "relative", transition: "background .15s",
        }}>
        <Bell size={17} style={{ color: "var(--ink-2)" }} />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 6, right: 6,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "#EF4444", color: "#fff",
            fontSize: 9, fontWeight: 800, lineHeight: "16px",
            textAlign: "center", padding: "0 3px",
            border: "1.5px solid var(--surface)",
          }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop dropdown — absolute, stays inside header stacking context */}
      {open && !isMobile && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: "min(360px, calc(100vw - 32px))",
          maxHeight: 480,
          borderRadius: 18,
          border: "1px solid var(--line)",
          background: "var(--surface)",
          boxShadow: "0 16px 48px rgba(0,0,0,.14)",
          zIndex: 100,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 12px", borderBottom: "1px solid var(--line)" }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>
              {isAr ? "الإشعارات" : "Notifications"}
            </span>
            {unreadCount > 0 && (
              <span style={{ background: "rgba(239,68,68,.1)", color: "#EF4444", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                {unreadCount} {isAr ? "جديد" : "new"}
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && notifications.length === 0 && (
              <div style={{ padding: "32px 0", textAlign: "center" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", margin: "0 auto 10px",
                  border: "2.5px solid var(--forest)", borderTopColor: "transparent",
                  animation: "notif-spin 1s linear infinite",
                }} />
                <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
                  {isAr ? "جارٍ التحميل…" : "Loading…"}
                </p>
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div style={{ padding: "40px 0", textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
                <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
                  {isAr ? "لا توجد إشعارات" : "No notifications"}
                </p>
              </div>
            )}

            {notifications.map((n, idx) => (
              <div key={n.id} style={{
                borderLeft: n.isRead ? "3px solid transparent" : "3px solid #EF4444",
                background: n.isRead ? "transparent" : "rgba(239,68,68,.06)",
                transition: "background .2s",
              }}>
                {idx > 0 && <div style={{ height: 1, background: "var(--line)" }} />}
                <button
                  onClick={() => handleNotifClick(n.id, n.isRead)}
                  style={{
                    width: "100%", textAlign: isAr ? "right" : "left",
                    padding: "12px 14px",
                    background: "transparent",
                    border: "none", cursor: n.isRead ? "default" : "pointer",
                    display: "flex", alignItems: "flex-start", gap: 10,
                    opacity: n.isRead ? 0.55 : 1,
                    transition: "opacity .2s",
                  }}
                  onMouseEnter={e => { if (!n.isRead) e.currentTarget.style.opacity = "0.85"; }}
                  onMouseLeave={e => { if (!n.isRead) e.currentTarget.style.opacity = "1"; }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                    background: n.isRead ? "var(--surface-2)" : "rgba(239,68,68,.12)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Bell size={15} style={{ color: n.isRead ? "var(--muted-2)" : "#EF4444" }} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      color: n.isRead ? "var(--muted)" : "var(--ink)",
                      fontSize: 13, fontWeight: n.isRead ? 400 : 700,
                      lineHeight: 1.4, margin: "0 0 3px",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {n.title}
                    </p>
                    <p style={{
                      color: "var(--muted-2)", fontSize: 12, lineHeight: 1.5, margin: "0 0 4px",
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {n.message}
                    </p>
                    <span style={{
                      fontSize: 10,
                      color: n.isRead ? "var(--muted-2)" : "#EF4444",
                      fontWeight: n.isRead ? 400 : 600,
                    }}>
                      {fmtNotifDate(n.createdAt, isAr)}
                    </span>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{ padding: "10px 14px", borderTop: "1px solid var(--line)", textAlign: "center" }}>
              <span style={{ fontSize: 12, color: "var(--muted-2)" }}>
                {isAr ? `${notifications.length} إشعار` : `${notifications.length} notifications`}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Mobile bottom sheet — rendered via Portal at body level to escape header stacking context */}
      {open && isMobile && typeof document !== "undefined" && createPortal(
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed", inset: 0, zIndex: 9998,
              background: "rgba(0,0,0,.5)", backdropFilter: "blur(4px)",
            }}
          />
          {/* Bottom sheet */}
          <div ref={portalPanelRef} style={{
            position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
            maxHeight: "75vh",
            borderRadius: "20px 20px 0 0",
            border: "1px solid var(--line)",
            background: "var(--surface)",
            boxShadow: "0 -8px 40px rgba(0,0,0,.25)",
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", borderBottom: "1px solid var(--line)" }}>
              {/* Drag handle */}
              <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--line)" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 18px 14px" }}>
                <span style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>
                  {isAr ? "الإشعارات" : "Notifications"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {unreadCount > 0 && (
                    <span style={{ background: "rgba(239,68,68,.1)", color: "#EF4444", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>
                      {unreadCount} {isAr ? "جديد" : "new"}
                    </span>
                  )}
                  <button onClick={() => setOpen(false)} style={{
                    width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--line)",
                    background: "var(--surface-2)", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <X size={14} style={{ color: "var(--ink-2)" }} />
                  </button>
                </div>
              </div>
            </div>

            {/* List */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading && notifications.length === 0 && (
                <div style={{ padding: "32px 0", textAlign: "center" }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto 10px", border: "2.5px solid var(--forest)", borderTopColor: "transparent", animation: "notif-spin 1s linear infinite" }} />
                  <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>{isAr ? "جارٍ التحميل…" : "Loading…"}</p>
                </div>
              )}
              {!loading && notifications.length === 0 && (
                <div style={{ padding: "40px 0", textAlign: "center" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>🔔</div>
                  <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>{isAr ? "لا توجد إشعارات" : "No notifications"}</p>
                </div>
              )}
              {notifications.map((n, idx) => (
                <div key={n.id} style={{
                  borderLeft: n.isRead ? "3px solid transparent" : "3px solid #EF4444",
                  background: n.isRead ? "transparent" : "rgba(239,68,68,.06)",
                  transition: "background .2s",
                }}>
                  {idx > 0 && <div style={{ height: 1, background: "var(--line)" }} />}
                  <button
                    onClick={() => handleNotifClick(n.id, n.isRead)}
                    style={{
                      width: "100%", textAlign: isAr ? "right" : "left",
                      padding: "12px 14px",
                      background: "transparent",
                      border: "none", cursor: n.isRead ? "default" : "pointer",
                      display: "flex", alignItems: "flex-start", gap: 10,
                      opacity: n.isRead ? 0.55 : 1,
                      transition: "opacity .2s",
                    }}
                    onMouseEnter={e => { if (!n.isRead) e.currentTarget.style.opacity = "0.85"; }}
                    onMouseLeave={e => { if (!n.isRead) e.currentTarget.style.opacity = "1"; }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                      background: n.isRead ? "var(--surface-2)" : "rgba(239,68,68,.12)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Bell size={15} style={{ color: n.isRead ? "var(--muted-2)" : "#EF4444" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: n.isRead ? "var(--muted)" : "var(--ink)", fontSize: 13, fontWeight: n.isRead ? 400 : 700, lineHeight: 1.4, margin: "0 0 3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {n.title}
                      </p>
                      <p style={{ color: "var(--muted-2)", fontSize: 12, lineHeight: 1.5, margin: "0 0 4px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {n.message}
                      </p>
                      <span style={{ fontSize: 10, color: n.isRead ? "var(--muted-2)" : "#EF4444", fontWeight: n.isRead ? 400 : 600 }}>
                        {fmtNotifDate(n.createdAt, isAr)}
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>

            {notifications.length > 0 && (
              <div style={{ padding: "10px 14px", borderTop: "1px solid var(--line)", textAlign: "center" }}>
                <span style={{ fontSize: 12, color: "var(--muted-2)" }}>
                  {isAr ? `${notifications.length} إشعار` : `${notifications.length} notifications`}
                </span>
              </div>
            )}
          </div>
        </>,
        document.body
      )}

      <style>{`@keyframes notif-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function Header() {
  const { lang, t, setLang } = useLang();
  const isAr = lang === "ar";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const saved = localStorage.getItem("bmedia-theme");
      if (saved === "light" || saved === "dark") {
        setTheme(saved);
        return;
      }

      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUser(getUser());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("bmedia-theme", next);
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setUserMenuOpen(false);
    window.location.href = "/login";
  };

  const displayName = user ? (user.firstName || user.username) : null;

  const categoryLinks = [
    { href: "/articles", label: t.articles, icon: "📖" },
    { href: "/audio",    label: t.audio,    icon: "🎧" },
    { href: "/video",    label: t.video,    icon: "🎬" },
    { href: "/gallery",  label: t.gallery,  icon: "🖼️" },
  ];

  return (
    <>
      {/* Announcement bar */}
      <div style={{ background: "linear-gradient(90deg,var(--forest),#1A4332)", color: "var(--gold-pale)" }}
        className="text-xs font-medium py-2 text-center">
        {user ? (
          <>{`${t.greetingHello} `}<span style={{ color: "var(--gold)", fontWeight: 700 }}>{displayName}</span>{` ${t.welcomeToPlatform}`}</>
        ) : (
          <>{`👋 مرحبا بك في المنصة الرقمية`}</>
        )}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b"
        style={{ background: "color-mix(in srgb,var(--surface) 92%,transparent)", borderColor: "var(--line)", backdropFilter: "saturate(180%) blur(16px)" }}>
        <div className="container-main">
          <div className="flex items-center justify-between gap-4 py-3">

            {/* Brand */}
            <Link href="/" className="flex items-center gap-3">
              <Image src="/logo.gif" alt="BMedia Logo" width={60} height={60} priority />
              <div>
                
               
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {/* Home */}
              <Link href="/" className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                style={{ color: "var(--muted)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}>
                {t.home}
              </Link>

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: "var(--line)", margin: "0 4px" }} />

              {/* Category links — highlighted */}
              {categoryLinks.map((l) => (
                <Link key={l.href} href={l.href}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: "var(--ink-2)" }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = "var(--forest)";
                    e.currentTarget.style.background = "var(--surface-2)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = "var(--ink-2)";
                    e.currentTarget.style.background = "transparent";
                  }}>
                  <span style={{ fontSize: 15 }}>{l.icon}</span>
                  {l.label}
                </Link>
              ))}

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: "var(--line)", margin: "0 4px" }} />

              {/* Secondary links */}
              {[{ href: "/categories", label: t.categories }, { href: "/contents", label: t.contents }, { href: "/users", label: t.users }].map((l) => (
                <Link key={l.href} href={l.href}
                  className="px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "var(--ink)")}
                  onMouseLeave={e => (e.currentTarget.style.color = "var(--muted)")}>
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border"
                style={{ background: "var(--surface-2)", borderColor: "var(--line)", width: "200px" }}>
                <Search size={14} style={{ color: "var(--muted-2)", flexShrink: 0 }} />
                <input type="search" placeholder={t.search} className="bg-transparent border-none outline-none w-full text-sm"
                  style={{ color: "var(--ink)" }} />
              </div>

              {/* Lang toggle */}
              <button onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="hidden sm:flex w-10 h-10 rounded-xl border items-center justify-center text-xs font-bold transition-all"
                style={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--forest)" }}
                title={t.switchLanguage}>
                {lang === "ar" ? "EN" : "ع"}
              </button>

              {/* Notification bell — always visible in header for logged-in users */}
              {user && <NotificationBell lang={lang} />}

              {/* Theme toggle */}
              <button onClick={toggleTheme} className="w-10 h-10 rounded-xl border flex items-center justify-center transition-all"
                style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
                {theme === "dark" ? <Sun size={16} style={{ color: "var(--gold)" }} /> : <Moon size={16} style={{ color: "var(--ink-2)" }} />}
              </button>

              {/* User area */}
              {user ? (
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(v => !v)}
                    className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border transition-all"
                    style={{ background: "var(--surface)", borderColor: "var(--line-gold)" }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: "linear-gradient(135deg,var(--gold),var(--gold-2))", color: "var(--forest)" }}>
                      {displayName?.[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-semibold" style={{ color: "var(--ink)" }}>{displayName}</span>
                  </button>
                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute left-0 mt-2 w-48 rounded-2xl border z-20 overflow-hidden"
                        style={{ background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow-lg)" }}>
                        <div className="px-4 py-3 border-b" style={{ borderColor: "var(--line)" }}>
                          <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>{displayName}</p>
                          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{user.email}</p>
                        </div>
                        <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm transition-all"
                          style={{ color: "var(--ink-2)" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <UserCircle size={14} /> {isAr ? "الملف الشخصي" : "Profile"}
                        </Link>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-3 text-sm transition-all"
                          style={{ color: "#DC2626" }}
                          onMouseEnter={e => (e.currentTarget.style.background = "rgba(220,38,38,.06)")}
                          onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                          <LogOut size={14} /> {t.logout}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link href="/login" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                  style={{ background: "var(--forest)", color: "#fff" }}>
                  {t.login}
                </Link>
              )}

              {/* Mobile menu */}
              <button onClick={() => setDrawerOpen(true)} className="md:hidden w-10 h-10 rounded-xl border flex items-center justify-center"
                style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
                <Menu size={18} style={{ color: "var(--ink-2)" }} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[70]" onClick={() => setDrawerOpen(false)}
          style={{ background: "rgba(0,0,0,.45)", backdropFilter: "blur(4px)" }} />
      )}
      <aside className={`fixed top-0 bottom-0 right-0 left-0 z-[80] flex flex-col transition-transform duration-300 ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "var(--surface)", boxShadow: "var(--shadow-lg)" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--line)" }}>
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-black"
                style={{ background: "linear-gradient(135deg,var(--gold),var(--gold-2))", color: "var(--forest)" }}>
                {displayName?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>{displayName}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>{user.email}</p>
              </div>
            </div>
          ) : (
            <Image src="/logo.svg" alt="BMedia Logo" width={36} height={36} />
          )}
          <button onClick={() => setDrawerOpen(false)} className="w-9 h-9 rounded-xl border flex items-center justify-center"
            style={{ background: "var(--surface-2)", borderColor: "var(--line)" }}>
            <X size={16} style={{ color: "var(--ink)" }} />
          </button>
        </div>
        <nav className="flex-1 p-4 flex flex-col gap-1 overflow-y-auto">
          {/* Home */}
          <Link href="/" onClick={() => setDrawerOpen(false)}
            className="px-4 py-3 rounded-xl text-sm font-medium" style={{ color: "var(--ink)" }}>
            {t.home}
          </Link>

          {/* Category label */}
          <p className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--muted-2)" }}>
            {lang === "ar" ? "التصنيفات" : "Categories"}
          </p>

          {/* Category links */}
          {categoryLinks.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setDrawerOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ color: "var(--ink)" }}
              onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <span style={{ fontSize: 20, width: 28, textAlign: "center" }}>{l.icon}</span>
              {l.label}
            </Link>
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: "var(--line)", margin: "8px 0" }} />

          {/* Secondary links */}
          {[{ href: "/categories", label: t.categories }, { href: "/contents", label: t.contents }, { href: "/users", label: t.users }].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setDrawerOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-medium" style={{ color: "var(--ink)" }}>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t flex gap-2" style={{ borderColor: "var(--line)" }}>
          {user ? (
            <>
              <Link href="/profile" onClick={() => setDrawerOpen(false)}
                className="flex-1 py-2 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "var(--surface-2)", color: "var(--ink)", border: "1px solid var(--line)" }}>
                <UserCircle size={14} /> {isAr ? "الملف الشخصي" : "Profile"}
              </Link>
              <button onClick={handleLogout} className="flex-1 py-2 rounded-xl text-center text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: "rgba(220,38,38,.10)", color: "#DC2626", border: "1px solid rgba(220,38,38,.20)" }}>
                <LogOut size={14} /> {t.logout}
              </button>
            </>
          ) : (
            <Link href="/login" className="flex-1 py-2 rounded-xl text-center text-sm font-bold"
              style={{ background: "var(--forest)", color: "#fff" }}>
              {t.login}
            </Link>
          )}
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="w-10 h-10 rounded-xl border flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--surface-2)", borderColor: "var(--line)", color: "var(--forest)" }}>
            {lang === "ar" ? "EN" : "ع"}
          </button>
          <button onClick={toggleTheme} className="w-10 h-10 rounded-xl border flex items-center justify-center"
            style={{ background: "var(--surface-2)", borderColor: "var(--line)" }}>
            {theme === "dark" ? <Sun size={16} style={{ color: "var(--gold)" }} /> : <Moon size={16} />}
          </button>
        </div>
      </aside>
    </>
  );
}
