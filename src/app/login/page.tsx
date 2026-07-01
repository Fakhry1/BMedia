"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login, saveSession } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { useLang } from "@/lib/LangContext";

export default function LoginPage() {
  const router = useRouter();
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = {
    title:        isAr ? "تسجيل الدخول"                                                              : "Sign In",
    subtitle:     isAr ? "أدخل بياناتك للوصول إلى حسابك"                                            : "Enter your credentials to access your account",
    email:        isAr ? "البريد الإلكتروني"                                                         : "Email",
    password:     isAr ? "كلمة المرور"                                                               : "Password",
    forgot:       isAr ? "نسيت كلمة المرور؟"                                                         : "Forgot password?",
    remember:     isAr ? "تذكّرني"                                                                   : "Remember me",
    show:         isAr ? "إظهار"                                                                      : "Show",
    hide:         isAr ? "إخفاء"                                                                      : "Hide",
    submit:       isAr ? "دخول"                                                                       : "Sign In",
    loading:      isAr ? "جارٍ التحقق..."                                                             : "Verifying...",
    noAccount:    isAr ? "ليس لديك حساب؟"                                                            : "Don't have an account?",
    register:     isAr ? "سجّل مجاناً"                                                               : "Register for free",
    err401:       isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة"                               : "Invalid email or password",
    err429:       isAr ? "تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار قبل المحاولة مجدداً"   : "Too many attempts. Please wait before trying again",
    errNetwork:   isAr ? "تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت"                         : "Could not connect to server. Check your internet connection",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      saveSession(result);
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError(t.err401);
        } else if (err.status === 429) {
          setError(t.err429);
        } else {
          setError(err.message || (isAr ? "حدث خطأ غير متوقع" : "An unexpected error occurred"));
        }
      } else {
        setError(t.errNetwork);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>

      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(155deg,var(--forest) 0%,#142E22 60%,#0B2318 100%)" }}>
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: "absolute", top: "-15%", right: "-15%", width: "380px", height: "380px", borderRadius: "50%", background: "radial-gradient(circle,rgba(200,168,75,.15),transparent 65%)" }} />
          <div style={{ position: "absolute", bottom: "-10%", left: "-10%", width: "300px", height: "300px", borderRadius: "50%", background: "radial-gradient(circle,rgba(26,67,50,.50),transparent 65%)" }} />
        </div>

        

        <div className="relative z-10" />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-up">

         
          <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily: "'Noto Kufi Arabic',sans-serif", color: "var(--ink)" }}>
            {t.title}
          </h1>
          <p className="text-sm mb-8" style={{ color: "var(--muted)" }}>{t.subtitle}</p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium"
              style={{ background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.20)", color: "#DC2626" }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: "var(--ink-2)" }}>{t.email}</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@domain.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{ background: "var(--surface)", border: "1.5px solid var(--line)", color: "var(--ink)", direction: "ltr", boxShadow: "var(--shadow-sm)" }}
                onFocus={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                onBlur={e => (e.currentTarget.style.borderColor = "var(--line)")}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>{t.password}</label>
                <a href="#" className="text-xs font-medium" style={{ color: "var(--forest)" }}>{t.forgot}</a>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{ background: "var(--surface)", border: "1.5px solid var(--line)", color: "var(--ink)", direction: "ltr", paddingLeft: "60px", boxShadow: "var(--shadow-sm)" }}
                  onFocus={e => (e.currentTarget.style.borderColor = "var(--gold)")}
                  onBlur={e => (e.currentTarget.style.borderColor = "var(--line)")}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-xs px-1" style={{ color: "var(--muted)" }}>
                  {showPass ? t.hide : t.show}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" className="w-4 h-4 rounded" />
              <span className="text-sm" style={{ color: "var(--muted)" }}>{t.remember}</span>
            </label>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-bold transition-all mt-1"
              style={{
                background: loading ? "rgba(11,35,24,.45)" : "var(--forest)",
                color: "#fff",
                boxShadow: loading ? "none" : "0 8px 24px rgba(11,35,24,.22)",
                cursor: loading ? "not-allowed" : "pointer",
              }}>
              {loading ? t.loading : t.submit}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: "var(--muted)" }}>
            {t.noAccount}{" "}
            <Link href="/register" className="font-semibold" style={{ color: "var(--forest)" }}>{t.register}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}