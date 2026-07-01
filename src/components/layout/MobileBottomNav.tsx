"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Headphones, Home, Images, Video } from "lucide-react";
import { useLang } from "@/lib/LangContext";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (pathname: string) => boolean;
};

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { t } = useLang();

  if (pathname === "/login") {
    return null;
  }

  const items: NavItem[] = [
    { href: "/", label: t.home, icon: Home, match: (value) => value === "/" },
    { href: "/articles", label: t.articles, icon: BookOpen, match: (value) => value.startsWith("/articles") },
    { href: "/video", label: t.video, icon: Video, match: (value) => value.startsWith("/video") },
    { href: "/audio", label: t.audio, icon: Headphones, match: (value) => value.startsWith("/audio") },
    { href: "/gallery", label: t.gallery, icon: Images, match: (value) => value.startsWith("/gallery") },
  ];

  return (
    <>
      <div className="md:hidden" aria-hidden="true" style={{ height: "92px" }} />

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40"
        aria-label="Mobile bottom navigation"
        style={{
          padding: "0",
          background: "color-mix(in srgb,var(--surface) 92%,transparent)",
          backdropFilter: "saturate(180%) blur(18px)",
          borderTop: "1px solid var(--line)",
          boxShadow: "0 -4px 24px rgba(11,35,24,.10)",
        }}
      >
        <div
          style={{
            padding: "6px 0 calc(6px + env(safe-area-inset-bottom))",
            display: "grid",
            gridTemplateColumns: "repeat(5,minmax(0,1fr))",
            gap: 0,
          }}
        >
          {items.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                style={{
                  minWidth: 0,
                  padding: "10px 6px 8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 5,
                  color: active ? "var(--forest)" : "var(--muted)",
                  background: active ? "linear-gradient(180deg,var(--gold-pale),#fff7df)" : "transparent",
                  boxShadow: active ? "0 10px 24px rgba(200,168,75,.24)" : "none",
                  transition: "all .2s ease",
                }}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                <span
                  style={{
                    maxWidth: "100%",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 11,
                    fontWeight: active ? 800 : 700,
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
