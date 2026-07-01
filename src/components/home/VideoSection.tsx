"use client";

const videos = [
  { id: 1, tag: "حصري", dur: "42:18", title: "رحلة في رحاب المحتوى الرقمي — الحلقة الأولى", views: "24,500", main: true, bg: "radial-gradient(ellipse at 20% 25%,rgba(200,168,75,.28),transparent 50%),linear-gradient(145deg,#142820,#081A10)" },
  { id: 2, tag: "تقني", dur: "28:54", title: "إدارة الوسائط الرقمية بالذكاء الاصطناعي", views: "18.2K", main: false, bg: "radial-gradient(ellipse at 80% 20%,rgba(200,168,75,.22),transparent 50%),linear-gradient(145deg,#1A1408,#0D0B06)" },
  { id: 3, tag: "تصميم", dur: "15:32", title: "أفضل ممارسات واجهة المستخدم العربية", views: "12.8K", main: false, bg: "radial-gradient(ellipse at 30% 70%,rgba(26,67,50,.35),transparent 50%),linear-gradient(145deg,#0C1E28,#06101A)" },
  { id: 4, tag: "برمجة", dur: "22:10", title: "بناء API احترافي بـ .NET 9", views: "9.6K", main: false, bg: "radial-gradient(ellipse at 70% 30%,rgba(200,168,75,.18),transparent 50%),linear-gradient(145deg,#1C1428,#0C0814)" },
  { id: 5, tag: "أمان", dur: "19:45", title: "تأمين تطبيقات الويب — الدليل الشامل", views: "7.1K", main: false, bg: "radial-gradient(ellipse at 40% 60%,rgba(26,67,50,.30),transparent 50%),linear-gradient(145deg,#0C2018,#071008)" },
];

export default function VideoSection() {
  return (
    <section className="py-14">
      <div className="container-main">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-2">
              <span className="w-5 h-0.5 rounded" style={{ background: "var(--gold)" }} />
              <span style={{ color: "var(--gold)" }}>محتوى مرئي</span>
            </div>
            <h2 className="font-extrabold leading-tight" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", fontSize: "clamp(20px,3.5vw,32px)", color: "var(--ink)" }}>
              أحدث الفيديوهات والمحتوى المرئي
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>محتوى بجودة عالية من نخبة المتخصصين</p>
          </div>
          <a href="/video" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all whitespace-nowrap"
            style={{ borderColor: "var(--line-gold)", color: "var(--forest)" }}>
            شاهد الكل ←
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => (
            <article key={v.id}
              className={`rounded-2xl overflow-hidden relative cursor-pointer group transition-all duration-200 ${v.main ? "sm:col-span-2 lg:col-span-2" : ""}`}
              style={{ boxShadow: "var(--shadow-sm)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-lg)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; }}>
              {/* Thumbnail */}
              <div className="relative" style={{ aspectRatio: v.main ? "16/8" : "16/10", background: v.bg }}>
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 30%,rgba(0,0,0,.65))" }} />
                {/* Play button */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all group-hover:scale-110"
                  style={{ width: v.main ? 64 : 52, height: v.main ? 64 : 52, background: "rgba(200,168,75,.90)", boxShadow: "0 8px 24px rgba(200,168,75,.40)" }}>
                  <div className="absolute top-1/2 left-1/2 -translate-y-1/2"
                    style={{ borderRight: `${v.main ? 16 : 13}px solid var(--forest)`, borderTop: `${v.main ? 10 : 8}px solid transparent`, borderBottom: `${v.main ? 10 : 8}px solid transparent`, transform: "translateX(-30%) translateY(-50%)" }} />
                </div>
                {/* Badges */}
                {v.tag && <span className="absolute top-3 right-3 text-xs font-black px-2.5 py-1 rounded-lg z-10"
                  style={{ background: "var(--gold)", color: "var(--forest)" }}>{v.tag}</span>}
                <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-lg z-10"
                  style={{ background: "rgba(0,0,0,.60)", color: "#fff" }}>{v.dur}</span>
                {/* Info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-10">
                  <h3 className="text-white font-bold leading-snug" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", fontSize: v.main ? "clamp(16px,2.5vw,20px)" : "14px" }}>
                    {v.title}
                  </h3>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,.65)" }}>{v.views} مشاهدة</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
