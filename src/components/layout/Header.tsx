"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Search, Moon, Sun, Menu, X, LogOut, UserCircle } from "lucide-react";
import { getUser, clearSession, type UserInfo } from "@/lib/auth";
import { useLang } from "@/lib/LangContext";

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
