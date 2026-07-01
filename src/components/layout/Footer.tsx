"use client";

import { useLang } from "@/lib/LangContext";

export default function Footer() {
  const { t } = useLang();

  return (
    <footer style={{ background: "color-mix(in srgb,var(--forest) 95%,#000)", borderTop: "1px solid rgba(200,168,75,.12)" }}>
      <div className="container-main">
        <div className="flex justify-between flex-wrap gap-3 py-5 text-xs"
          style={{ color: "rgba(255,255,255,.45)" }}>
          <span>{`© ${new Date().getFullYear()} BMedia. ${t.footerRights}`}</span>
          <div className="flex gap-4">
            {[t.privacy, t.terms].map((label) => (
              <button key={label} type="button" style={{ color: "rgba(255,255,255,.40)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--gold)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,.40)")}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
