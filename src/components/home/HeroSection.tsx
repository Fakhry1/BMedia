"use client";

export default function HeroSection() {
  return (
    <section className="pt-8 pb-4">
      <div className="container-main">
        {/* Hero shell */}
        <div className="relative rounded-3xl overflow-hidden border"
          style={{ background: "var(--surface)", borderColor: "var(--line-gold)", boxShadow: "var(--shadow-lg)" }}>
          {/* BG gradient */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: "radial-gradient(ellipse at 10% 0%,rgba(200,168,75,.12) 0%,transparent 55%), radial-gradient(ellipse at 90% 100%,rgba(26,67,50,.10) 0%,transparent 50%), linear-gradient(180deg,var(--ivory-2,#F3F5EE) 0%,var(--surface) 100%)"
          }} />

          <div className="relative z-10 grid lg:grid-cols-[1.15fr_.85fr] items-center gap-8 p-6 md:p-12">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold border animate-fade-up"
                style={{ background: "color-mix(in srgb,var(--gold) 12%,var(--surface))", borderColor: "var(--line-gold)", color: "var(--ink-2)" }}>
                <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ background: "var(--gold)" }} />
                أحدث محتوى الأسبوع متاح الآن
              </div>

              <h1 className="mt-4 font-extrabold leading-tight animate-fade-up"
                style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", fontSize: "clamp(32px,6vw,60px)", color: "var(--ink)", animationDelay: ".08s" }}>
                اكتشف <em className="not-italic" style={{
                  background: "linear-gradient(135deg,var(--gold),var(--gold-2))",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text"
                }}>المحتوى</em><br />
                الذي تبحث عنه
              </h1>

              <p className="mt-4 text-sm leading-relaxed animate-fade-up max-w-xl"
                style={{ color: "var(--muted)", animationDelay: ".16s" }}>
                منصة متكاملة للمحتوى الرقمي تجمع الفيديو والصوت والصور والمقالات، بجودة عالية وإدارة احترافية.
              </p>

              <div className="flex gap-3 flex-wrap mt-6 animate-fade-up" style={{ animationDelay: ".24s" }}>
                <a href="/video" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{ background: "var(--forest)", color: "#fff", boxShadow: "0 6px 20px rgba(11,35,24,.25)" }}>
                  ابدأ الاستكشاف
                </a>
                <a href="/about" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold border transition-all"
                  style={{ borderColor: "var(--line)", color: "var(--ink)", background: "var(--surface)" }}>
                  تعرف علينا
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-6 flex-wrap mt-7 pt-6 animate-fade-up" style={{ borderTop: "1px solid var(--line)", animationDelay: ".32s" }}>
                {[
                  { val: "+1,200", label: "محتوى مرئي" },
                  { val: "+850", label: "ملف صوتي" },
                  { val: "+450", label: "مقال ومعرفة" },
                  { val: "120K", label: "متابع نشِط" },
                ].map((s) => (
                  <div key={s.label}>
                    <b className="block font-extrabold" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", fontSize: "clamp(18px,2.5vw,24px)", color: "var(--forest)" }}>{s.val}</b>
                    <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — feature card */}
            <aside className="rounded-2xl p-6 animate-fade-up" style={{
              background: "linear-gradient(145deg,var(--forest),#142E22)",
              border: "1px solid rgba(200,168,75,.20)",
              boxShadow: "var(--shadow-lg)",
              animationDelay: ".2s"
            }}>
              <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-4"
                style={{ color: "var(--gold)" }}>
                <span className="w-6 h-px" style={{ background: "var(--gold)", opacity: .5 }} />
                محتوى مميز
                <span className="w-6 h-px" style={{ background: "var(--gold)", opacity: .5 }} />
              </div>

              
              {[
                { icon: "🎙", title: "أحدث الملفات الصوتية", sub: "تلاوات وأناشيد مختارة" },
                { icon: "🎬", title: "آخر الفيديوهات", sub: "جديد · منذ ٣ ساعات" },
              ].map((c) => (
                <a key={c.title} href="#"
                  className="flex items-center gap-3 rounded-xl p-3 mb-2 transition-all cursor-pointer"
                  style={{ background: "rgba(255,255,255,.07)", border: "1px solid rgba(255,255,255,.10)" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: "rgba(200,168,75,.15)", border: "1px solid rgba(200,168,75,.22)" }}>
                    {c.icon}
                  </div>
                  <div>
                    <b className="block text-sm font-semibold text-white">{c.title}</b>
                    <small className="text-xs" style={{ color: "rgba(255,255,255,.55)" }}>{c.sub}</small>
                  </div>
                </a>
              ))}
            </aside>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-4 pb-2">
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollSnapType: "x mandatory" }}>
            {[
              { icon: "🎬", label: "فيديو", sub: "محاضرات وبرامج", href: "/video" },
              { icon: "🖼", label: "صور", sub: "معرض بصري", href: "/gallery" },
              { icon: "🎙", label: "صوت", sub: "تسجيلات وأناشيد", href: "/audio" },
              { icon: "📖", label: "قراءة", sub: "مقالات وكتب", href: "/articles" },
              { icon: "📂", label: "التصنيفات", sub: "تصفح حسب القسم", href: "/categories" },
            ].map((c, i) => (
              <a key={c.label} href={c.href}
                className="flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all cursor-pointer"
                style={{ background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow-sm)", minWidth: "160px", scrollSnapAlign: "start" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--gold)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-3px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; (e.currentTarget as HTMLElement).style.transform = ""; }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: i % 2 === 0 ? "rgba(26,67,50,.10)" : "rgba(200,168,75,.12)" }}>
                  {c.icon}
                </div>
                <div>
                  <b className="block text-sm font-bold" style={{ color: "var(--ink)", fontFamily: "'Noto Kufi Arabic',sans-serif" }}>{c.label}</b>
                  <span className="block text-xs mt-0.5" style={{ color: "var(--muted)" }}>{c.sub}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
