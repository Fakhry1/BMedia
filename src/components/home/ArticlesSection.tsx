"use client";

const articles = [
  { tag: "تقنية", date: "١٤ يونيو", readTime: "8 دقائق", title: "كيف تبني منصة محتوى احترافية في ٢٠٢٦؟", excerpt: "دليل شامل لبناء منصات المحتوى الرقمية باستخدام أحدث التقنيات...", author: "أ.م", authorName: "م. أحمد علي", bg: "radial-gradient(ellipse at 30% 30%,rgba(200,168,75,.22),transparent 50%),linear-gradient(145deg,#DEEADC,#EFF5ED)" },
  { tag: "تصميم", date: "١٢ يونيو", readTime: "12 دقيقة", title: "أفضل ممارسات تصميم واجهات المستخدم العربية", excerpt: "نظرة عميقة على تصميم المنتجات الرقمية العربية وتجربة المستخدم...", author: "س.م", authorName: "س. محمد طه", bg: "radial-gradient(ellipse at 70% 25%,rgba(200,168,75,.25),transparent 50%),linear-gradient(145deg,#F0E8D8,#FAF3E6)" },
  { tag: "أمان", date: "١٠ يونيو", readTime: "6 دقائق", title: "حماية بياناتك في عصر الذكاء الاصطناعي", excerpt: "رؤية شاملة لأمان البيانات والخصوصية في العصر الرقمي الحديث...", author: "د.س", authorName: "د. سامي القاضي", bg: "radial-gradient(ellipse at 40% 60%,rgba(26,67,50,.14),transparent 50%),linear-gradient(145deg,#E5EAE8,#F2F5F3)" },
];

export default function ArticlesSection() {
  return (
    <section className="py-14">
      <div className="container-main">
        <div className="flex items-end justify-between gap-4 mb-7">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase mb-2">
              <span className="w-5 h-0.5 rounded" style={{ background: "var(--gold)" }} />
              <span style={{ color: "var(--gold)" }}>قراءة ومعرفة</span>
            </div>
            <h2 className="font-extrabold" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", fontSize: "clamp(20px,3.5vw,32px)", color: "var(--ink)" }}>
              مقالات ومحتوى منتقى
            </h2>
          </div>
          <a href="/articles" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border whitespace-nowrap"
            style={{ borderColor: "var(--line-gold)", color: "var(--forest)" }}>المكتبة الكاملة ←</a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {articles.map((a) => (
            <article key={a.title} className="rounded-2xl overflow-hidden border flex flex-col transition-all duration-200"
              style={{ background: "var(--surface)", borderColor: "var(--line)", boxShadow: "var(--shadow-sm)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--line-gold)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ""; (e.currentTarget as HTMLElement).style.borderColor = "var(--line)"; (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-sm)"; }}>
              {/* Thumbnail */}
              <div className="h-48 relative" style={{ background: a.bg }}>
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg,transparent 50%,rgba(0,0,0,.22))" }} />
                <span className="absolute bottom-3 right-3 text-xs font-black px-3 py-1 rounded-lg"
                  style={{ background: "rgba(255,255,255,.92)", color: "var(--forest)" }}>{a.tag}</span>
              </div>
              {/* Body */}
              <div className="p-5 flex flex-col gap-2 flex-1">
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="w-4 h-0.5" style={{ background: "var(--gold)" }} />
                  {a.date} · {a.readTime} قراءة
                </div>
                <h3 className="font-bold leading-snug" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", fontSize: "16px", color: "var(--ink)" }}>
                  {a.title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{a.excerpt}</p>
                <div className="mt-auto pt-4 flex items-center justify-between border-t" style={{ borderColor: "var(--line)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background: "linear-gradient(135deg,var(--gold),var(--gold-2))", color: "var(--forest)" }}>{a.author}</div>
                    <span className="text-xs font-bold" style={{ color: "var(--forest)" }}>{a.authorName}</span>
                  </div>
                  <a href="#" className="text-xs font-bold transition-all" style={{ color: "var(--forest)" }}>اقرأ المقال ←</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
