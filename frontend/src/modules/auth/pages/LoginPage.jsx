import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, BadgeCheck, Loader2, AlertCircle } from "lucide-react";
import { login } from "../hooks/useAuth";

const BRAND = "#F48124";

const features = [
  "Licencias firmadas con ED25519",
  "Control de módulos por compañía",
  "Auditoría completa de eventos",
];

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>{label}</label>
      {children}
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [focused, setFocused] = useState(null);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(form.username, form.password);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (name) => ({
    width: "100%",
    padding: "11px 14px",
    border: `1.5px solid ${focused === name ? BRAND : "#e5e7eb"}`,
    borderRadius: 10,
    fontSize: 14,
    outline: "none",
    color: "#111827",
    background: "#f9fafb",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  });

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>

      <div
        className="hidden lg:flex"
        style={{
          width: "42%",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px",
          background: "#060d1b",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="animate-float" style={{
          position: "absolute", width: 520, height: 520, borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND}28 0%, transparent 68%)`,
          top: -160, left: -160, pointerEvents: "none",
        }} />
        <div className="animate-float-slow" style={{
          position: "absolute", width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 68%)",
          bottom: 20, right: -100, pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "30px 30px", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 10, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, overflow: "hidden",
            background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <img src="/logo-and.png" alt="AND Tools" style={{ width: 34, height: 34, objectFit: "contain" }} />
          </div>
          <span style={{ color: "white", fontWeight: 700, fontSize: 15 }}>AND Tools</span>
        </div>

        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 20, marginBottom: 32,
            background: `linear-gradient(135deg, ${BRAND}22, ${BRAND}0a)`,
            border: `1px solid ${BRAND}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <ShieldCheck size={40} color={BRAND} strokeWidth={1.6} />
          </div>
          <h2 style={{ color: "white", fontSize: 30, fontWeight: 800, lineHeight: 1.2, margin: 0 }}>
            Gestión de licencias<br />
            <span style={{ color: BRAND }}>inteligente.</span>
          </h2>
          <p style={{ color: "#9ca3af", fontSize: 14, marginTop: 14, lineHeight: 1.65, maxWidth: 290 }}>
            Administra clientes, módulos y compañías desde un panel centralizado y seguro.
          </p>
          <div style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 12 }}>
            {features.map((f) => (
              <div key={f} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <BadgeCheck size={18} color={BRAND} strokeWidth={2} style={{ flexShrink: 0 }} />
                <span style={{ color: "#9ca3af", fontSize: 13 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ position: "relative", zIndex: 10, color: "#4b5563", fontSize: 12, margin: 0 }}>
          © 2026 Desarrollado por AND Technology Innovation
        </p>
      </div>

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "48px 24px", background: "white",
      }}>
        <div className="lg:hidden" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", background: "#f3f4f6" }}>
            <img src="/logo-and.png" alt="AND Tools" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <span style={{ fontWeight: 700, color: "#111827" }}>AND Tools Administrador</span>
        </div>

        <div className="animate-fade-in-up" style={{ width: "100%", maxWidth: 360 }}>
          <div style={{ marginBottom: 32 }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: "0.15em",
              textTransform: "uppercase", color: BRAND, marginBottom: 8,
            }}>Acceso al sistema</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", margin: 0 }}>Bienvenido de vuelta</h1>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 6 }}>Ingresa tus credenciales para continuar</p>
          </div>

          {error && (
            <div style={{
              display: "flex", alignItems: "flex-start", gap: 10,
              background: "#fef2f2", border: "1px solid #fecaca",
              borderRadius: 10, padding: "12px 14px",
              fontSize: 13, color: "#b91c1c", marginBottom: 24,
            }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Field label="Usuario">
              <input
                name="username" value={form.username} onChange={handleChange}
                placeholder="Tu nombre de usuario" autoComplete="username" required
                style={inputStyle("username")}
                onFocus={() => setFocused("username")} onBlur={() => setFocused(null)}
              />
            </Field>

            <Field label="Contraseña">
              <div style={{ position: "relative" }}>
                <input
                  name="password" type={showPwd ? "text" : "password"}
                  value={form.password} onChange={handleChange}
                  placeholder="••••••••" autoComplete="current-password" required
                  style={{ ...inputStyle("password"), paddingRight: 42 }}
                  onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                />
                <button
                  type="button" onClick={() => setShowPwd((v) => !v)} tabIndex={-1}
                  style={{
                    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: 0, display: "flex",
                  }}
                >
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>

            <button
              type="submit" disabled={loading}
              style={{
                marginTop: 6, width: "100%", padding: "13px 0", borderRadius: 10, border: "none",
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 600, color: "white", letterSpacing: "0.02em",
                background: loading ? `${BRAND}88` : `linear-gradient(135deg, ${BRAND} 0%, #e06b10 100%)`,
                transition: "opacity 0.15s, transform 0.1s",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                boxShadow: loading ? "none" : `0 4px 14px ${BRAND}44`,
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "scale(0.985)"; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              {loading ? (<><Loader2 size={16} className="animate-spin" />Ingresando...</>) : "Ingresar al sistema"}
            </button>
          </form>

          <div style={{
            marginTop: 28, padding: 16, background: "#f8fafc", borderRadius: 10,
            border: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: `${BRAND}15`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ShieldCheck size={16} color={BRAND} strokeWidth={2} />
            </div>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.5 }}>
              Acceso protegido mediante autenticación con tokens firmados digitalmente.
            </p>
          </div>
        </div>

        <p style={{ marginTop: 36, fontSize: 12, color: "#d1d5db" }}>© 2026 Desarrollado por AND Technology Innovation</p>
      </div>
    </div>
  );
}