"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { getUser, changePassword, type UserInfo } from "@/lib/auth";
import { useLang } from "@/lib/LangContext";

export default function ProfilePage() {
  const router = useRouter();
  const { lang } = useLang();
  const isAr = lang === "ar";

  const [user, setUser] = useState<UserInfo | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace("/login"); return; }
    setUser(u);
  }, [router]);

  const t = {
    title:           isAr ? "الملف الشخصي"           : "Profile",
    infoSection:     isAr ? "معلومات الحساب"          : "Account Information",
    name:            isAr ? "الاسم"                   : "Name",
    email:           isAr ? "البريد الإلكتروني"       : "Email",
    username:        isAr ? "اسم المستخدم"            : "Username",
    roles:           isAr ? "الأدوار"                  : "Roles",
    pwSection:       isAr ? "تغيير كلمة المرور"       : "Change Password",
    currentPw:       isAr ? "كلمة المرور الحالية"     : "Current Password",
    newPw:           isAr ? "كلمة المرور الجديدة"     : "New Password",
    confirmPw:       isAr ? "تأكيد كلمة المرور"       : "Confirm Password",
    save:            isAr ? "حفظ التغييرات"           : "Save Changes",
    saving:          isAr ? "جارٍ الحفظ…"             : "Saving…",
    successMsg:      isAr ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully",
    mismatch:        isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match",
    emptyFields:     isAr ? "يرجى ملء جميع الحقول"   : "Please fill in all fields",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t.emptyFields); return;
    }
    if (newPassword !== confirmPassword) {
      setError(t.mismatch); return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  const fullName = `${user.firstName} ${user.lastName}`.trim() || user.username;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", padding: "32px 16px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Page title */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "linear-gradient(135deg,var(--gold),var(--gold-2))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <User size={20} style={{ color: "var(--forest)" }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>{t.title}</h1>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{user.email}</p>
          </div>
        </div>

        {/* Account info card */}
        <div style={{
          background: "var(--surface)", borderRadius: 16,
          border: "1px solid var(--line)", overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <User size={15} style={{ color: "var(--gold)" }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{t.infoSection}</span>
          </div>
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: t.name,     value: fullName },
              { label: t.email,    value: user.email },
              { label: t.username, value: user.username },
              { label: t.roles,    value: user.roles.join(", ") || "—" },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                <span style={{ minWidth: 130, fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Change password card */}
        <form onSubmit={handleSubmit} style={{
          background: "var(--surface)", borderRadius: 16,
          border: "1px solid var(--line)", overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Lock size={15} style={{ color: "var(--gold)" }} />
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{t.pwSection}</span>
          </div>

          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Success */}
            {success && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(16,185,129,.1)", borderRadius: 10,
                padding: "10px 14px", color: "#065F46", fontSize: 13, fontWeight: 600,
              }}>
                <CheckCircle size={16} /> {t.successMsg}
              </div>
            )}

            {/* Error */}
            {error && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "rgba(239,68,68,.1)", borderRadius: 10,
                padding: "10px 14px", color: "#B91C1C", fontSize: 13, fontWeight: 600,
              }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Fields */}
            {[
              { id: "cur",  label: t.currentPw, value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
              { id: "new",  label: t.newPw,     value: newPassword,     set: setNewPassword,     show: showNew,     toggle: () => setShowNew(v => !v) },
              { id: "conf", label: t.confirmPw,  value: confirmPassword, set: setConfirmPassword,  show: showConfirm, toggle: () => setShowConfirm(v => !v) },
            ].map(({ id, label, value, set, show, toggle }) => (
              <div key={id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label htmlFor={id} style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-2)" }}>{label}</label>
                <div style={{ position: "relative" }}>
                  <input
                    id={id}
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={e => set(e.target.value)}
                    style={{
                      width: "100%", padding: "10px 40px 10px 14px",
                      borderRadius: 10, border: "1px solid var(--line)",
                      background: "var(--bg)", color: "var(--ink)",
                      fontSize: 14, outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <button type="button" onClick={toggle} style={{
                    position: "absolute", top: "50%", transform: "translateY(-50%)",
                    [isAr ? "left" : "right"]: 12,
                    background: "none", border: "none", cursor: "pointer", padding: 0,
                    color: "var(--muted)",
                  }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            ))}

            <button type="submit" disabled={loading} style={{
              marginTop: 4,
              padding: "11px 24px", borderRadius: 10, border: "none",
              background: loading ? "var(--surface-2)" : "var(--forest)",
              color: loading ? "var(--muted)" : "#fff",
              fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              transition: "opacity .2s",
            }}>
              {loading ? t.saving : t.save}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
