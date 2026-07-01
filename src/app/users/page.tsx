"use client";

import { useState, useEffect, useCallback, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { isLoggedIn } from "@/lib/auth";
import {
  getUsers, getUserById, createUser, updateUser, deleteUser,
  assignUserRoles, resetUserPassword,
  getRoles, createRole, updateRole, deleteRole,
  type UserListItem, type UserDetail, type RoleItem,
} from "@/lib/users";

/* ── helpers ── */
function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" }) : "—";
}

function initials(u: UserListItem) {
  return ((u.firstName?.[0] ?? "") + (u.lastName?.[0] ?? "")).toUpperCase() || u.username[0].toUpperCase();
}

const ROLE_COLORS = ["#2563EB","#7C3AED","#059669","#D97706","#DB2777","#0891B2","#DC2626","#92400E"];
const roleColor = (name: string) => ROLE_COLORS[name.charCodeAt(0) % ROLE_COLORS.length];

/* ── User Avatar ── */
function Avatar({ user, size = 36 }: { user: UserListItem; size?: number }) {
  const bg = roleColor(user.username);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${bg}22`, border: `2px solid ${bg}44`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.36, fontWeight: 800, color: bg, flexShrink: 0,
    }}>
      {initials(user)}
    </div>
  );
}

/* ── Status Badge ── */
function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 99,
      background: active ? "#dcfce7" : "#fee2e2",
      color: active ? "#15803d" : "#dc2626",
      border: `1px solid ${active ? "#bbf7d0" : "#fecaca"}`,
    }}>
      {active ? "نشط" : "معطّل"}
    </span>
  );
}

/* ── Input helper ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)" }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: import("react").CSSProperties = {
  padding: "9px 14px", borderRadius: 10,
  border: "1.5px solid var(--line)", background: "var(--surface-2)",
  color: "var(--ink)", fontSize: 13, outline: "none", width: "100%",
};

/* ══════════════════════════════════════════════════════════
   ADD / EDIT USER DRAWER
══════════════════════════════════════════════════════════ */
function UserDrawer({
  userId, allRoles, onClose, onSaved,
}: {
  userId: string | "new";
  allRoles: RoleItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = userId === "new";
  const [visible, setVisible]   = useState(false);
  const [loading, setLoading]   = useState(!isNew);
  const [saving,  setSaving]    = useState(false);
  const [error,   setError]     = useState("");
  const [detail,  setDetail]    = useState<UserDetail | null>(null);

  /* form fields */
  const [firstName,  setFirstName]  = useState("");
  const [lastName,   setLastName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [username,   setUsername]   = useState("");
  const [password,   setPassword]   = useState("");
  const [phone,      setPhone]      = useState("");
  const [lang,       setLang]       = useState("ar");
  const [isActive,   setIsActive]   = useState(true);
  const [selRoles,   setSelRoles]   = useState<string[]>([]);
  const [newPwd,     setNewPwd]     = useState("");
  const [pwdMsg,     setPwdMsg]     = useState("");

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  /* load detail for edit */
  useEffect(() => {
    if (isNew) return;
    getUserById(userId)
      .then(d => {
        setDetail(d);
        setFirstName(d.firstName);
        setLastName(d.lastName);
        setEmail(d.email);
        setUsername(d.username);
        setPhone(d.phoneNumber ?? "");
        setLang(d.preferredLanguage);
        setIsActive(d.isActive);
        setSelRoles(d.roles.map(r => r.id));
      })
      .catch(() => setError("تعذّر تحميل بيانات المستخدم"))
      .finally(() => setLoading(false));
  }, [userId, isNew]);

  function toggleRole(id: string) {
    setSelRoles(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
  }

  function close() { setVisible(false); setTimeout(onClose, 300); }

  async function handleSave() {
    setError(""); setSaving(true);
    try {
      if (isNew) {
        if (!password) { setError("كلمة المرور مطلوبة"); setSaving(false); return; }
        await createUser({ firstName, lastName, email, username, password,
          phoneNumber: phone || undefined, preferredLanguage: lang, roleIds: selRoles });
      } else {
        await updateUser(userId, { firstName, lastName,
          phoneNumber: phone || undefined, preferredLanguage: lang, isActive });
        await assignUserRoles(userId, selRoles);
      }
      onSaved(); close();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ");
    } finally { setSaving(false); }
  }

  async function handleResetPwd() {
    if (!newPwd) return;
    setSaving(true); setPwdMsg("");
    try {
      await resetUserPassword(userId, newPwd);
      setPwdMsg("✓ تم تغيير كلمة المرور"); setNewPwd("");
    } catch (e: unknown) {
      setPwdMsg(e instanceof Error ? e.message : "فشل إعادة تعيين كلمة المرور");
    } finally { setSaving(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, display: "flex" }}>
      <div onClick={close} style={{
        flex: 1, background: "rgba(0,0,0,.6)", backdropFilter: "blur(4px)",
        opacity: visible ? 1 : 0, transition: "opacity .3s",
      }} />
      <div style={{
        width: "min(520px,100vw)", height: "100%", overflowY: "auto",
        background: "var(--bg)", display: "flex", flexDirection: "column",
        transform: visible ? "translateX(0)" : "translateX(100%)",
        transition: "transform .3s cubic-bezier(.32,0,.15,1)",
        boxShadow: "-8px 0 40px rgba(0,0,0,.2)",
      }}>
        {/* Accent */}
        <div style={{ height: 4, background: "linear-gradient(90deg,var(--forest),#22c55e)", flexShrink: 0 }} />

        {/* Header */}
        <div style={{ padding: "18px 24px 16px", borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h2 style={{ color: "var(--ink)", fontWeight: 800, fontSize: 17, margin: 0 }}>
              {isNew ? "إضافة مستخدم جديد" : "تعديل المستخدم"}
            </h2>
            {detail && <p style={{ color: "var(--muted)", fontSize: 12, margin: "4px 0 0" }}>@{detail.username}</p>}
          </div>
          <button onClick={close} style={{ width: 34, height: 34, borderRadius: 9,
            border: "1px solid var(--line)", background: "var(--surface)",
            cursor: "pointer", fontSize: 18, color: "var(--muted)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, padding: "20px 24px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", margin: "0 auto",
                border: "3px solid var(--forest)", borderTopColor: "transparent",
                animation: "um-spin 1s linear infinite" }} />
            </div>
          )}

          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fee2e2",
              color: "#dc2626", fontSize: 13, fontWeight: 600 }}>
              {error}
            </div>
          )}

          {!loading && (
            <>
              {/* Basic info */}
              <section>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)",
                  textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>
                  البيانات الأساسية
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Field label="الاسم الأول *">
                    <input value={firstName} onChange={e => setFirstName(e.target.value)}
                      style={inputStyle} placeholder="الاسم الأول" />
                  </Field>
                  <Field label="اسم العائلة *">
                    <input value={lastName} onChange={e => setLastName(e.target.value)}
                      style={inputStyle} placeholder="اسم العائلة" />
                  </Field>
                  <Field label="البريد الإلكتروني *">
                    <input value={email} onChange={e => setEmail(e.target.value)}
                      type="email" style={inputStyle} placeholder="example@email.com"
                      readOnly={!isNew} />
                  </Field>
                  <Field label="اسم المستخدم *">
                    <input value={username} onChange={e => setUsername(e.target.value)}
                      style={inputStyle} placeholder="username"
                      readOnly={!isNew} />
                  </Field>
                  {isNew && (
                    <Field label="كلمة المرور *">
                      <input value={password} onChange={e => setPassword(e.target.value)}
                        type="password" style={inputStyle} placeholder="••••••••" />
                    </Field>
                  )}
                  <Field label="رقم الهاتف">
                    <input value={phone} onChange={e => setPhone(e.target.value)}
                      style={inputStyle} placeholder="+966..." />
                  </Field>
                  <Field label="اللغة المفضّلة">
                    <select value={lang} onChange={e => setLang(e.target.value)} style={inputStyle}>
                      <option value="ar">العربية</option>
                      <option value="en">English</option>
                    </select>
                  </Field>
                  {!isNew && (
                    <Field label="الحالة">
                      <select value={String(isActive)} onChange={e => setIsActive(e.target.value === "true")}
                        style={inputStyle}>
                        <option value="true">نشط</option>
                        <option value="false">معطّل</option>
                      </select>
                    </Field>
                  )}
                </div>
              </section>

              {/* Roles */}
              <section>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)",
                  textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>
                  الأدوار
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {allRoles.map(r => {
                    const selected = selRoles.includes(r.id);
                    const c = roleColor(r.name);
                    return (
                      <button key={r.id} onClick={() => toggleRole(r.id)}
                        style={{
                          padding: "6px 14px", borderRadius: 99,
                          border: `1.5px solid ${selected ? c : "var(--line)"}`,
                          background: selected ? `${c}18` : "var(--surface-2)",
                          color: selected ? c : "var(--muted)",
                          fontSize: 12, fontWeight: selected ? 700 : 500,
                          cursor: "pointer", transition: "all .15s",
                          display: "flex", alignItems: "center", gap: 5,
                        }}>
                        {selected && <span>✓</span>}
                        {r.name}
                      </button>
                    );
                  })}
                  {allRoles.length === 0 && (
                    <p style={{ color: "var(--muted)", fontSize: 13 }}>لا توجد أدوار متاحة</p>
                  )}
                </div>
              </section>

              {/* Reset password (edit only) */}
              {!isNew && (
                <section>
                  <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)",
                    textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 14 }}>
                    إعادة تعيين كلمة المرور
                  </h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={newPwd} onChange={e => setNewPwd(e.target.value)}
                      type="password" style={{ ...inputStyle, flex: 1 }} placeholder="كلمة مرور جديدة" />
                    <button onClick={handleResetPwd} disabled={!newPwd || saving}
                      style={{ padding: "9px 16px", borderRadius: 10, border: "none",
                        background: "var(--forest)", color: "#fff",
                        fontSize: 12, fontWeight: 700, cursor: newPwd ? "pointer" : "default",
                        opacity: !newPwd ? .5 : 1, whiteSpace: "nowrap" }}>
                      تعيين
                    </button>
                  </div>
                  {pwdMsg && (
                    <p style={{ fontSize: 12, marginTop: 6,
                      color: pwdMsg.startsWith("✓") ? "#15803d" : "#dc2626" }}>
                      {pwdMsg}
                    </p>
                  )}
                </section>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--line)",
          display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={close}
            style={{ padding: "9px 20px", borderRadius: 10,
              border: "1px solid var(--line)", background: "var(--surface-2)",
              color: "var(--muted)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            إلغاء
          </button>
          <button onClick={handleSave} disabled={saving || loading}
            style={{ padding: "9px 22px", borderRadius: 10, border: "none",
              background: "var(--forest)", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              opacity: saving ? .7 : 1,
              display: "flex", alignItems: "center", gap: 6 }}>
            {saving
              ? <><span className="um-spin" style={{ width: 14, height: 14, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff",
                  display: "inline-block" }} /> جارٍ الحفظ…</>
              : isNew ? "إضافة المستخدم" : "حفظ التعديلات"
            }
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ROLES MODAL
══════════════════════════════════════════════════════════ */
function RolesModal({
  roles, onClose, onRefresh,
}: {
  roles: RoleItem[];
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [visible,  setVisible]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState("");
  const [newName,  setNewName]  = useState("");
  const [newDesc,  setNewDesc]  = useState("");
  const [editId,   setEditId]   = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => { setTimeout(() => setVisible(true), 10); }, []);

  function close() { setVisible(false); setTimeout(onClose, 300); }

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true); setError("");
    try {
      await createRole({ name: newName.trim(), description: newDesc || undefined });
      setNewName(""); setNewDesc(""); onRefresh();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  async function handleUpdate(id: string) {
    setSaving(true); setError("");
    try {
      await updateRole(id, { name: editName.trim(), description: editDesc || undefined });
      setEditId(null); onRefresh();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`هل تريد حذف الدور "${name}"؟`)) return;
    setSaving(true); setError("");
    try {
      await deleteRole(id); onRefresh();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  return (
    <div onClick={close} style={{ position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,.7)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      opacity: visible ? 1 : 0, transition: "opacity .25s" }}>
      <div onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg)", borderRadius: 20, width: "min(600px,100%)",
          maxHeight: "88vh", overflow: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,.3)",
          transform: visible ? "scale(1)" : "scale(.95)",
          transition: "transform .25s cubic-bezier(.34,1.4,.64,1)",
        }}>
        <div style={{ height: 4, background: "linear-gradient(90deg,#7C3AED,#a855f7)" }} />
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ color: "var(--ink)", fontWeight: 800, fontSize: 17, margin: 0 }}>
            إدارة الأدوار
          </h2>
          <button onClick={close} style={{ width: 34, height: 34, borderRadius: 9,
            border: "1px solid var(--line)", background: "var(--surface)",
            cursor: "pointer", fontSize: 18, color: "var(--muted)",
            display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        <div style={{ padding: "20px 24px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
          {error && (
            <div style={{ padding: "10px 14px", borderRadius: 10, background: "#fee2e2",
              color: "#dc2626", fontSize: 13 }}>{error}</div>
          )}

          {/* Add new role */}
          <section>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
              إضافة دور جديد
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)}
                style={inputStyle} placeholder="اسم الدور (مثل: Reviewer)" />
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
                style={inputStyle} placeholder="وصف الدور (اختياري)" />
              <button onClick={handleCreate} disabled={!newName.trim() || saving}
                style={{ padding: "9px 18px", borderRadius: 10, border: "none",
                  background: "#7C3AED", color: "#fff", fontSize: 13, fontWeight: 700,
                  cursor: newName.trim() ? "pointer" : "default",
                  opacity: !newName.trim() ? .5 : 1, alignSelf: "flex-start" }}>
                + إضافة
              </button>
            </div>
          </section>

          {/* Roles list */}
          <section>
            <h3 style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 12 }}>
              الأدوار الموجودة
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {roles.map(r => {
                const c = roleColor(r.name);
                const isEditing = editId === r.id;
                return (
                  <div key={r.id} style={{ padding: "12px 16px", borderRadius: 12,
                    border: "1px solid var(--line)", background: "var(--surface)" }}>
                    {isEditing ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input value={editName} onChange={e => setEditName(e.target.value)}
                          style={inputStyle} disabled={r.isSystem} />
                        <input value={editDesc} onChange={e => setEditDesc(e.target.value)}
                          style={inputStyle} placeholder="الوصف" />
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => handleUpdate(r.id)} disabled={saving}
                            style={{ padding: "6px 14px", borderRadius: 8, border: "none",
                              background: c, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                            حفظ
                          </button>
                          <button onClick={() => setEditId(null)}
                            style={{ padding: "6px 14px", borderRadius: 8,
                              border: "1px solid var(--line)", background: "var(--surface-2)",
                              color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%",
                          background: c, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{r.name}</span>
                            {r.isSystem && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                                background: "#fef9c3", color: "#854d0e", border: "1px solid #fde68a" }}>
                                نظام
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: "var(--muted-2)" }}>
                              · {r.userCount} مستخدم
                            </span>
                          </div>
                          {r.description && (
                            <p style={{ color: "var(--muted)", fontSize: 12, margin: "2px 0 0" }}>{r.description}</p>
                          )}
                        </div>
                        {!r.isSystem && (
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button onClick={() => { setEditId(r.id); setEditName(r.name); setEditDesc(r.description ?? ""); }}
                              style={{ padding: "5px 10px", borderRadius: 7,
                                border: "1px solid var(--line)", background: "var(--surface-2)",
                                color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>
                              تعديل
                            </button>
                            <button onClick={() => handleDelete(r.id, r.name)} disabled={saving}
                              style={{ padding: "5px 10px", borderRadius: 7,
                                border: "1px solid #fecaca", background: "#fee2e2",
                                color: "#dc2626", fontSize: 11, cursor: "pointer" }}>
                              حذف
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {roles.length === 0 && (
                <p style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                  لا توجد أدوار بعد
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════ */
export default function UsersPage() {
  const router = useRouter();

  useEffect(() => { if (!isLoggedIn()) router.replace("/login"); }, [router]);

  const [items,       setItems]       = useState<UserListItem[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);
  const [search,      setSearch]      = useState("");
  const [filterRole,  setFilterRole]  = useState("");
  const [allRoles,    setAllRoles]    = useState<RoleItem[]>([]);
  const [drawerUser,  setDrawerUser]  = useState<string | null>(null);
  const [showRoles,   setShowRoles]   = useState(false);
  const [deleting,    setDeleting]    = useState<string | null>(null);

  const loadRoles = useCallback(() => {
    getRoles().then(setAllRoles).catch(() => {});
  }, []);

  const loadUsers = useCallback(() => {
    setLoading(true); setError("");
    getUsers({ page, pageSize: 15, search: search || undefined })
      .then(r => { setItems(r.items); setTotalPages(r.totalPages); setTotalCount(r.totalCount); })
      .catch(() => setError("تعذّر تحميل المستخدمين"))
      .finally(() => setLoading(false));
  }, [page, search]);

  useEffect(() => { loadRoles(); }, [loadRoles]);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  async function handleDelete(id: string, name: string, e: MouseEvent) {
    e.stopPropagation();
    if (!confirm(`هل تريد حذف المستخدم "${name}"؟`)) return;
    setDeleting(id);
    try { await deleteUser(id); loadUsers(); }
    catch { alert("تعذّر حذف المستخدم"); }
    finally { setDeleting(null); }
  }

  /* filter by role client-side */
  const displayed = filterRole
    ? items.filter(u => u.roles.some(r => r.toLowerCase() === filterRole.toLowerCase()))
    : items;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <Header />

      {/* ── Hero ── */}
      <section style={{
        background: "linear-gradient(135deg,#1e1b4b 0%,#312e81 50%,#1e1b4b 100%)",
        padding: "48px 0 44px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -50, left: "30%", width: 200, height: 200,
          borderRadius: "50%", background: "rgba(255,255,255,.03)" }} />
        <div className="um-wrap">
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            gap: 16, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 26 }}>👥</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#a5b4fc",
                  textTransform: "uppercase", letterSpacing: ".1em" }}>B-Media · Users</span>
              </div>
              <h1 style={{ color: "#fff", fontSize: "clamp(24px,4vw,42px)", fontWeight: 900,
                lineHeight: 1.15, margin: "0 0 8px", fontFamily: "'Noto Kufi Arabic',sans-serif" }}>
                إدارة المستخدمين
              </h1>
              <p style={{ color: "rgba(255,255,255,.55)", fontSize: 14, margin: 0 }}>
                {totalCount} مستخدم مسجّل
              </p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowRoles(true)}
                style={{ padding: "10px 18px", borderRadius: 12,
                  border: "1.5px solid rgba(165,180,252,.4)",
                  background: "rgba(255,255,255,.08)", color: "#a5b4fc",
                  fontSize: 13, fontWeight: 700, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6 }}>
                🎭 إدارة الأدوار
              </button>
              <button onClick={() => setDrawerUser("new")}
                style={{ padding: "10px 20px", borderRadius: 12, border: "none",
                  background: "#a5b4fc", color: "#1e1b4b",
                  fontSize: 13, fontWeight: 800, cursor: "pointer" }}>
                + إضافة مستخدم
              </button>
            </div>
          </div>
        </div>
      </section>

      <main style={{ flex: 1, padding: "32px 0 60px" }}>
        <div className="um-wrap">

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
            <input
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="ابحث بالاسم أو البريد..."
              style={{ ...inputStyle, flex: "1 1 220px", maxWidth: 360 }}
            />
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              style={{ ...inputStyle, width: "auto", minWidth: 160 }}>
              <option value="">جميع الأدوار</option>
              {allRoles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            </select>
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "14px 18px", borderRadius: 12, background: "#fee2e2",
              color: "#dc2626", fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* Table */}
          <div style={{ background: "var(--surface)", borderRadius: 16,
            border: "1px solid var(--line)", overflow: "hidden" }}>

            {/* Table header */}
            <div style={{
              display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 80px",
              padding: "12px 20px", background: "var(--surface-2)",
              borderBottom: "1px solid var(--line)",
              fontSize: 11, fontWeight: 700, color: "var(--muted)",
              textTransform: "uppercase", letterSpacing: ".07em", gap: 12,
            }}>
              <span>المستخدم</span>
              <span>البريد الإلكتروني</span>
              <span>الأدوار</span>
              <span>الحالة</span>
              <span>آخر دخول</span>
              <span></span>
            </div>

            {/* Loading rows */}
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse" style={{
                display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 80px",
                padding: "14px 20px", borderBottom: "1px solid var(--line)", gap: 12,
                alignItems: "center",
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--surface-2)", flexShrink: 0 }} />
                  <div style={{ height: 12, borderRadius: 4, background: "var(--surface-2)", width: "60%" }} />
                </div>
                {[1,2,3,4].map(j => (
                  <div key={j} style={{ height: 12, borderRadius: 4, background: "var(--surface-2)", width: "70%" }} />
                ))}
                <div />
              </div>
            ))}

            {/* Rows */}
            {!loading && displayed.map(user => (
              <div key={user.id}
                onClick={() => setDrawerUser(user.id)}
                style={{
                  display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 80px",
                  padding: "14px 20px", borderBottom: "1px solid var(--line)",
                  gap: 12, alignItems: "center", cursor: "pointer",
                  transition: "background .15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-2)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                {/* Name + avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Avatar user={user} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: "var(--ink)", fontWeight: 700, fontSize: 13,
                      margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p style={{ color: "var(--muted-2)", fontSize: 11, margin: 0 }}>
                      @{user.username}
                    </p>
                  </div>
                </div>

                {/* Email */}
                <span style={{ color: "var(--muted)", fontSize: 12,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </span>

                {/* Roles */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {user.roles.slice(0, 2).map(r => {
                    const c = roleColor(r);
                    return (
                      <span key={r} style={{
                        fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                        background: `${c}18`, color: c, border: `1px solid ${c}33`,
                      }}>{r}</span>
                    );
                  })}
                  {user.roles.length > 2 && (
                    <span style={{ fontSize: 10, color: "var(--muted-2)", alignSelf: "center" }}>
                      +{user.roles.length - 2}
                    </span>
                  )}
                </div>

                {/* Status */}
                <StatusBadge active={user.isActive} />

                {/* Last login */}
                <span style={{ color: "var(--muted-2)", fontSize: 11 }}>
                  {fmtDate(user.lastLoginAt)}
                </span>

                {/* Actions */}
                <div style={{ display: "flex", gap: 5 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setDrawerUser(user.id)}
                    style={{ padding: "5px 8px", borderRadius: 7,
                      border: "1px solid var(--line)", background: "var(--surface-2)",
                      color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>
                    تعديل
                  </button>
                  <button
                    onClick={(e) => handleDelete(user.id, `${user.firstName} ${user.lastName}`, e)}
                    disabled={deleting === user.id}
                    style={{ padding: "5px 8px", borderRadius: 7,
                      border: "1px solid #fecaca", background: "#fee2e2",
                      color: "#dc2626", fontSize: 11,
                      cursor: deleting === user.id ? "default" : "pointer",
                      opacity: deleting === user.id ? .5 : 1 }}>
                    حذف
                  </button>
                </div>
              </div>
            ))}

            {/* Empty */}
            {!loading && displayed.length === 0 && !error && (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
                <p style={{ color: "var(--muted)", fontSize: 14 }}>
                  {search ? "لا توجد نتائج للبحث" : "لا يوجد مستخدمون بعد"}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 24 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "7px 16px", borderRadius: 9,
                  border: "1px solid var(--line)", background: "var(--surface)",
                  color: page === 1 ? "var(--muted-2)" : "var(--ink)",
                  fontSize: 13, cursor: page === 1 ? "default" : "pointer" }}>
                ‹ السابق
              </button>
              <span style={{ padding: "7px 14px", fontSize: 13, color: "var(--muted)" }}>
                {page} / {totalPages}
              </span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "7px 16px", borderRadius: 9,
                  border: "1px solid var(--line)", background: "var(--surface)",
                  color: page === totalPages ? "var(--muted-2)" : "var(--ink)",
                  fontSize: 13, cursor: page === totalPages ? "default" : "pointer" }}>
                التالي ›
              </button>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Drawers / Modals */}
      {drawerUser && (
        <UserDrawer
          userId={drawerUser}
          allRoles={allRoles}
          onClose={() => setDrawerUser(null)}
          onSaved={loadUsers}
        />
      )}

      {showRoles && (
        <RolesModal
          roles={allRoles}
          onClose={() => setShowRoles(false)}
          onRefresh={loadRoles}
        />
      )}

      <style>{`
        .um-wrap { max-width: 1280px; margin: 0 auto; padding-left: 24px; padding-right: 24px; }
        @media (max-width: 900px) {
          .um-wrap { padding-left: 16px; padding-right: 16px; }
        }
        @media (max-width: 700px) {
          .um-grid-row { grid-template-columns: 1fr 1fr 80px !important; }
          .um-col-email, .um-col-last { display: none; }
        }
        @keyframes um-spin { to { transform: rotate(360deg); } }
        .um-spin { animation: um-spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
