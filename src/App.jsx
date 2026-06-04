import { useState, useEffect, useCallback, useRef } from "react";

const SUPABASE_URL = "https://uqkbeelnhrvtpwrkrbrp.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxa2JlZWxuaHJ2dHB3cmtyYnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2ODUyNjMsImV4cCI6MjA5NTI2MTI2M30.nX7g6UP8fTL8U6KWeOV4C8RyXj7k53Mu4Ru6CwpqAiE";

// ─── API ─────────────────────────────────────────────────────────────────────
const hdr = (tok) => ({
  apikey: SUPABASE_KEY,
  "Content-Type": "application/json",
  Authorization: `Bearer ${tok || SUPABASE_KEY}`,
});

const db = {
  async login(email, password) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST", headers: hdr(), body: JSON.stringify({ email, password }),
    });
    return r.json();
  },
  async getPerfil(uid, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${uid}&select=*`, { headers: hdr(tok) });
    const d = await r.json();
    return Array.isArray(d) ? d[0] : null;
  },
  async createPerfil(data, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/perfiles`, {
      method: "POST", headers: { ...hdr(tok), Prefer: "return=representation" }, body: JSON.stringify(data),
    });
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  },
  async savePerfil(id, data, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${id}`, {
      method: "PATCH", headers: { ...hdr(tok), Prefer: "return=representation" }, body: JSON.stringify(data),
    });
    return r.json();
  },
  async getSolicitudes(tok) {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/solicitudes?select=*,adscritos(nombre)&order=created_at.desc`,
      { headers: hdr(tok) }
    );
    return r.json();
  },
  async getSolicitudesByMonth(tok, year, month) {
    const start = `${year}-${String(month).padStart(2,"0")}-01T00:00:00`;
    const lastDay = new Date(year, month, 0).getDate();
    const end   = `${year}-${String(month).padStart(2,"0")}-${String(lastDay).padStart(2,"0")}T23:59:59`;
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/solicitudes?select=*,adscritos(nombre)&created_at=gte.${start}&created_at=lte.${end}&order=created_at.asc`,
      { headers: hdr(tok) }
    );
    return r.json();
  },
  async getAdscritos(tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/adscritos?order=nombre`, { headers: hdr(tok) });
    return r.json();
  },
  async updateAdscrito(id, data, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/adscritos?id=eq.${id}`, {
      method: "PATCH", headers: { ...hdr(tok), Prefer: "return=representation" }, body: JSON.stringify(data),
    });
    return r.json();
  },
  async changePassword(newPassword, tok) {
    const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "PUT", headers: hdr(tok), body: JSON.stringify({ password: newPassword }),
    });
    return r.json();
  },
  async createSolicitud(data) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/solicitudes`, {
      method: "POST", headers: { ...hdr(null), Prefer: "return=representation" }, body: JSON.stringify(data),
    });
    return r.json();
  },
  async updateSolicitud(id, data, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/solicitudes?id=eq.${id}`, {
      method: "PATCH", headers: { ...hdr(tok), Prefer: "return=representation" }, body: JSON.stringify(data),
    });
    return r.json();
  },
  async createToken() {
    const token = Math.random().toString(36).substring(2,10).toUpperCase() +
                  Math.random().toString(36).substring(2,6).toUpperCase();
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tokens_qr`, {
      method: "POST", headers: { ...hdr(null), Prefer: "return=representation" }, body: JSON.stringify({ token }),
    });
    const d = await r.json();
    return Array.isArray(d) ? d[0] : d;
  },
  async validateToken(token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tokens_qr?token=eq.${token}&usado=eq.false&select=*`, { headers: hdr(null) });
    const d = await r.json();
    return Array.isArray(d) && d.length > 0 ? d[0] : null;
  },
  async useToken(token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tokens_qr?token=eq.${token}`, {
      method: "PATCH", headers: { ...hdr(null), Prefer: "return=representation" }, body: JSON.stringify({ usado: true }),
    });
    return r.json();
  },
  async checkTokenUsed(token) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tokens_qr?token=eq.${token}&select=usado`, { headers: hdr(null) });
    const d = await r.json();
    return Array.isArray(d) && d.length > 0 ? d[0].usado : true;
  },
  async getAnuncios(tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/anuncios?order=created_at.desc`, { headers: hdr(tok) });
    return r.json();
  },
  async createAnuncio(data, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/anuncios`, {
      method: "POST", headers: { ...hdr(tok), Prefer: "return=representation" }, body: JSON.stringify(data),
    });
    return r.json();
  },
  async deleteAnuncio(id, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/anuncios?id=eq.${id}`, {
      method: "DELETE", headers: hdr(tok),
    });
    return r.json();
  },
  async cleanHistory(tok) {
    const today = new Date().toISOString().split('T')[0];
    const r = await fetch(`${SUPABASE_URL}/rest/v1/solicitudes?created_at=lt.${today}T00:00:00`, {
      method: "DELETE", headers: hdr(tok),
    });
    return r.status === 204 || r.ok ? { success: true } : r.json();
  },
  async getPerfiles(tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?order=nombre`, { headers: hdr(tok) });
    return r.json();
  },
  async updatePerfil(id, data, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/perfiles?id=eq.${id}`, {
      method: "PATCH", headers: { ...hdr(tok), Prefer: "return=representation" }, body: JSON.stringify(data),
    });
    return r.json();
  },
  async createSolicitud(data, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/solicitudes`, {
      method: "POST", headers: { ...hdr(tok), Prefer: "return=representation" }, body: JSON.stringify(data),
    });
    return r.json();
  },
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const AREAS = ["Tomografía", "Ultrasonido General", "Mama"];

// Mapeo de áreas a tipos de estudio incluidos
const AREA_ESTUDIOS = {
  "Tomografía": ["Tomografía (TC)"],
  "Ultrasonido General": ["Ultrasonido"],
  "Mama": [],
};

const ESTUDIOS_SUB = {
  "Tomografía (TC)": ["Simple", "Contrastada"],
  Ultrasonido: ["General", "Obstétrico", "Ginecológico"],
  Mama: ["Ultrasonido mamario", "Mastografía", "Ambas"],
};

const ESTADOS_CFG = {
  pendiente:   { label: "Pendiente",          bg: "#FEF3C7", color: "#92400E" },
  en_proceso:  { label: "En proceso",         bg: "#DBEAFE", color: "#1E40AF" },
  agendado:    { label: "Agendado",           bg: "#D1FAE5", color: "#065F46" },
  reagendado:  { label: "Re-agendado",        bg: "#ECFDF5", color: "#047857" },
  realizado:   { label: "Realizado",          bg: "#A7F3D0", color: "#064E3B" },
  postpuesto:  { label: "Postpuesto",         bg: "#EDE9FE", color: "#5B21B6" },
  denegado:    { label: "Denegado por momento", bg: "#FEE2E2", color: "#991B1B" },
  expirado:    { label: "Expirado",           bg: "#F3F4F6", color: "#374151" },
  cancelado:   { label: "Cancelado",          bg: "#FEE2E2", color: "#DC2626" },
};

const PRIORIDADES_CFG = {
  Rutina:    { bg: "#F3F4F6", color: "#6B7280" },
  Urgente:   { bg: "#FEF3C7", color: "#92400E" },
  Inmediato: { bg: "#FEE2E2", color: "#991B1B" },
};

const SERVICIOS = [
  "Toco Cirugía", "Ginecología y Obstetricia", "Urgencias",
  "Urgencias Pediátricas", "Terapia Intensiva", "UTIP",
  "Cirugía", "Traumatología", "Medicina Interna", "Hospice", "Otro",
];

// ─── Estilos base ─────────────────────────────────────────────────────────────
const cx = {
  input: {
    width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB",
    borderRadius: 8, fontSize: 14, background: "#fff", color: "#111827",
    boxSizing: "border-box", fontFamily: "inherit",
  },
  label: { fontSize: 12, color: "#6B7280", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 },
  card: { background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "16px 20px" },
  btn: { border: "1px solid #D1D5DB", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", background: "transparent", color: "#374151", fontFamily: "inherit" },
  btnPrimary: { border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", background: "#1E3A8A", color: "#fff", width: "100%", fontFamily: "inherit" },
};

// ─── Componentes pequeños ─────────────────────────────────────────────────────
function Badge({ label, bg, color }) {
  return <span style={{ background: bg, color, padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap" }}>{label}</span>;
}

function FG({ label, children, optional = false, half = false, style = {} }) {
  return (
    <div style={{ marginBottom: 12, ...(half ? { display: "inline-block", width: "calc(50% - 6px)" } : {}), ...style }}>
      <label style={cx.label}>
        {label}
        {optional && <span style={{ fontSize: 10, background: "#F3F4F6", color: "#9CA3AF", padding: "1px 6px", borderRadius: 20, border: "1px solid #E5E7EB" }}>Opcional</span>}
      </label>
      {children}
    </div>
  );
}

function SecLabel({ children }) {
  return <p style={{ margin: "0 0 14px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" }}>{children}</p>;
}

// ─── Mexico Timezone Converter ────────────────────────────────────────────────
function toMexicoTime(utcDate) {
  return new Date(new Date(utcDate).toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
}

// Convertir a Title Case (primera letra mayúscula en cada palabra)
function toTitleCase(str) {
  if (!str) return str;
  return str.trim().replace(/\b\w/g, char => char.toUpperCase()).replace(/\s+/g, ' ');
}

// Rango de jornada (7am a 7am siguiente) en México Centro
function getJornadaRange(dateStr) {
  // dateStr es YYYY-MM-DD en México Centro (del selector)
  // Crear fecha a las 7am en México Centro
  const [year, month, day] = dateStr.split("-").map(Number);
  
  // Crear fecha como si fuera México Centro a las 7am
  const startMexico = new Date(year, month - 1, day, 7, 0, 0);
  const endMexico = new Date(year, month - 1, day + 1, 7, 0, 0);
  
  // Convertir a strings ISO
  const startISO = startMexico.toISOString();
  const endISO = endMexico.toISOString();
  
  return { startISO, endISO };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 640);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return mobile;
}

// ─── Toast notification ───────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 4500); return () => clearTimeout(t); }, []);
  return (
    <div style={{
      position: "fixed", top: 72, right: 16, zIndex: 9998,
      background: "#1E3A8A", color: "#fff",
      padding: "13px 20px", borderRadius: 12,
      boxShadow: "0 4px 24px rgba(30,58,138,0.35)",
      display: "flex", alignItems: "center", gap: 10,
      fontSize: 14, fontWeight: 600, maxWidth: 320,
      animation: "slideInRight 0.35s ease",
    }}>
      <span style={{ fontSize: 22 }}>🔔</span>
      <span>{message}</span>
      <button onClick={onDone} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", borderRadius: 6, padding: "2px 8px", cursor: "pointer", marginLeft: 4, fontSize: 13 }}>✕</button>
    </div>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [busy, setBusy]   = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const data = await db.login(email, pass);
      if (!data.access_token) { setErr("Correo o contraseña incorrectos."); setBusy(false); return; }
      const perfil = await db.getPerfil(data.user.id, data.access_token);
      onLogin({ uid: data.user.id, email: data.user.email, token: data.access_token, perfil });
    } catch { setErr("Error de conexión. Intenta de nuevo."); }
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)" }}>
      <div style={{ ...cx.card, width: 360, boxShadow: "0 8px 32px rgba(30,58,138,0.12)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🩻</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#1E3A8A" }}>Imagenología</h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#6B7280" }}>Sistema de gestión de estudios</p>
        </div>
        <form onSubmit={submit}>
          <FG label="Correo electrónico">
            <input style={cx.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@hospital.com" required autoComplete="email" />
          </FG>
          <FG label="Contraseña" style={{ marginBottom: 20 }}>
            <input style={cx.input} type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
          </FG>
          {err && <p style={{ color: "#DC2626", fontSize: 13, marginBottom: 12 }}>{err}</p>}
          <button style={cx.btnPrimary} type="submit" disabled={busy}>{busy ? "Iniciando sesión..." : "Iniciar sesión"}</button>
        </form>
      </div>
    </div>
  );
}

// ─── SetupPerfil (primer acceso) ──────────────────────────────────────────────
function SetupPerfil({ uid, token, onDone }) {
  const [nombre, setNombre] = useState("");
  const [rol, setRol]       = useState("r1");
  const [busy, setBusy]     = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const p = await db.createPerfil({ id: uid, nombre, rol, area_rotacion: "General" }, token);
    onDone(Array.isArray(p) ? p[0] : p);
    setBusy(false);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)" }}>
      <div style={{ ...cx.card, width: 380, boxShadow: "0 8px 32px rgba(30,58,138,0.12)" }}>
        <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>👋</div>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700 }}>Primer acceso</h2>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: "#6B7280" }}>Completa tu perfil para continuar.</p>
        <form onSubmit={submit}>
          <FG label="Nombre completo">
            <input style={cx.input} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Dr(a). Apellidos, Nombre" required />
          </FG>
          <FG label="Nivel / Rol" style={{ marginBottom: 24 }}>
            <select style={cx.input} value={rol} onChange={e => setRol(e.target.value)}>
              <option value="r1">R1 — Primer año</option>
              <option value="r3">R3 — Tercer año</option>
              <option value="r4">R4 — Cuarto año</option>
              <option value="jefe">Jefe de Servicio</option>
            </select>
          </FG>
          <button style={cx.btnPrimary} type="submit" disabled={busy}>{busy ? "Guardando..." : "Entrar al sistema"}</button>
        </form>
      </div>
    </div>
  );
}

// ─── QR Screen (tablet) ───────────────────────────────────────────────────────
function QRScreen() {
  const [t, setT]           = useState(new Date());
  const [token, setToken]   = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const tokenRef            = useRef(null);

  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);

  const generateToken = useCallback(async () => {
    setRefreshing(true);
    const tok = await db.createToken();
    const newToken = tok?.token || null;
    tokenRef.current = newToken;
    setToken(newToken);
    setRefreshing(false);
  }, []);

  useEffect(() => { generateToken(); }, [generateToken]);

  // Poll every 3 seconds using ref to always read latest token
  useEffect(() => {
    const i = setInterval(async () => {
      if (!tokenRef.current) return;
      const used = await db.checkTokenUsed(tokenRef.current);
      if (used) generateToken();
    }, 3000);
    return () => clearInterval(i);
  }, [generateToken]);

  const url = token
    ? `${window.location.origin}${window.location.pathname}?page=form&token=${token}`
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "linear-gradient(160deg, #EFF6FF 0%, #DBEAFE 100%)", padding: 32, gap: 28 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 13, color: "#6B7280", letterSpacing: "0.12em", textTransform: "uppercase" }}>Servicio de Imagenología</p>
        <h1 style={{ margin: "8px 0 0", fontSize: 36, fontWeight: 800, color: "#1E3A8A" }}>Solicitar Estudio</h1>
        <p style={{ margin: "10px 0 0", fontSize: 16, color: "#374151" }}>Presenta tu paciente y escanea el código con tu teléfono</p>
      </div>
      <div style={{ background: "#fff", padding: 20, borderRadius: 20, boxShadow: "0 8px 48px rgba(30,58,138,0.18)", border: "3px solid #BFDBFE" }}>
        {refreshing || !url ? (
          <div style={{ width: 260, height: 260, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 36 }}>🔄</div>
            <p style={{ color: "#6B7280", fontSize: 14 }}>Generando código...</p>
          </div>
        ) : (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=1E3A8A&margin=10`}
            alt="QR Solicitud"
            width={260} height={260}
            style={{ display: "block" }}
          />
        )}
      </div>
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 14, color: "#6B7280" }}>
          {t.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 28, fontWeight: 700, color: "#1E3A8A" }}>
          {t.toLocaleTimeString("es-MX")}
        </p>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "#93C5FD" }}>
          ● Código de un solo uso — cambia automáticamente al ser utilizado
        </p>
      </div>
    </div>
  );
}

// ─── Solicitud Form (público) ─────────────────────────────────────────────────
function SolicitudForm() {
  const params     = new URLSearchParams(window.location.search);
  const tokenParam = params.get("token");

  const empty = {
    nombre_paciente: "", nss_expediente: "", edad: "", sexo: "",
    tipo_estudio: "", sub_tipo: "", protocolo: "",
    servicio_solicitante: "", servicio_otro: "", prioridad: "Rutina",
    motivo_clinico: "", nombre_medico: "", mip_solicitante: "", telefono: "", ubicacion_paciente: "",
    creatinina: "",
  };
  const [form, setForm]       = useState(empty);
  const [busy, setBusy]       = useState(false);
  const [done, setDone]       = useState(false);
  const [tokenOk, setTokenOk] = useState(null); // null=checking, true=valid, false=invalid

  useEffect(() => {
    if (!tokenParam) { setTokenOk(false); return; }
    db.validateToken(tokenParam).then(t => setTokenOk(!!t));
  }, [tokenParam]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const valid = await db.validateToken(tokenParam);
      if (!valid) {
        alert("Este código ya fue utilizado. Solicita uno nuevo al servicio de imagenología.");
        setBusy(false);
        return;
      }
      const formCleaned = {
        ...form,
        nombre_paciente: toTitleCase(form.nombre_paciente),
        nombre_medico: toTitleCase(form.nombre_medico),
        mip_solicitante: form.mip_solicitante ? toTitleCase(form.mip_solicitante) : null,
      };
      await Promise.all([db.useToken(tokenParam), db.createSolicitud(formCleaned)]);
      setDone(true);
    } catch { alert("Error al enviar la solicitud. Intenta de nuevo."); }
    setBusy(false);
  }

  // Token checking
  if (tokenOk === null) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F0F7FF" }}>
      <p style={{ color: "#6B7280", fontSize: 15 }}>Verificando código...</p>
    </div>
  );

  if (tokenOk === false) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#FEF2F2" }}>
      <div style={{ ...cx.card, maxWidth: 360, textAlign: "center", padding: 40 }}>
        <p style={{ fontSize: 48, margin: "0 0 16px" }}>🚫</p>
        <h2 style={{ margin: "0 0 10px", fontSize: 18, fontWeight: 700, color: "#991B1B" }}>Código inválido</h2>
        <p style={{ color: "#6B7280", fontSize: 14 }}>Este código ya fue utilizado o no es válido. Presenta tu paciente al servicio de imagenología y escanea el código QR nuevamente.</p>
      </div>
    </div>
  );

  if (done) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#ECFDF5" }}>
      <div style={{ ...cx.card, maxWidth: 360, textAlign: "center", padding: 40 }}>
        <p style={{ fontSize: 52, margin: "0 0 16px" }}>✅</p>
        <h2 style={{ margin: "0 0 10px", fontSize: 20, fontWeight: 700 }}>¡Solicitud enviada!</h2>
        <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 20px" }}>El servicio de imagenología recibió tu solicitud. Te contactarán en breve para coordinar el traslado de tu paciente.</p>
        <p style={{ color: "#9CA3AF", fontSize: 13 }}>Para una nueva solicitud presenta tu paciente al servicio y escanea el código QR nuevamente.</p>
      </div>
    </div>
  );

  return (
    <div style={{ background: "#F8FAFC", minHeight: "100vh", paddingBottom: 40 }}>
      <div style={{ background: "#1E3A8A", padding: "20px 20px 16px" }}>
        <p style={{ margin: 0, fontSize: 12, color: "#93C5FD", textTransform: "uppercase", letterSpacing: "0.1em" }}>Servicio de Imagenología</p>
        <h1 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700, color: "#fff" }}>Nueva solicitud de estudio</h1>
      </div>

      <form onSubmit={submit} style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>

        {/* ── Paciente ── */}
        <div style={{ ...cx.card, marginBottom: 16 }}>
          <SecLabel>Datos del paciente</SecLabel>
          <FG label="Nombre completo *">
            <input style={cx.input} value={form.nombre_paciente} onChange={set("nombre_paciente")} placeholder="Apellidos, Nombre" required />
          </FG>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 0.7fr 0.8fr", gap: 10 }}>
            <FG label="NSS / Expediente" optional>
              <input style={cx.input} value={form.nss_expediente} onChange={set("nss_expediente")} placeholder="Si disponible" />
            </FG>
            <FG label="Edad *">
              <input style={cx.input} value={form.edad} onChange={set("edad")} placeholder="Años" required />
            </FG>
            <FG label="Sexo *">
              <select style={cx.input} value={form.sexo} onChange={set("sexo")} required>
                <option value="">—</option>
                <option>Femenino</option>
                <option>Masculino</option>
              </select>
            </FG>
          </div>
        </div>

        {/* ── Estudio ── */}
        <div style={{ ...cx.card, marginBottom: 16 }}>
          <SecLabel>Tipo de estudio</SecLabel>
          <FG label="Estudio solicitado *">
            <select style={cx.input} value={form.tipo_estudio}
              onChange={(e) => setForm(f => ({ ...f, tipo_estudio: e.target.value, sub_tipo: "" }))} required>
              <option value="">Seleccionar...</option>
              <option>Tomografía (TC)</option>
              <option>Ultrasonido</option>
              <option>Mama</option>
              <option>Estudios dinámicos</option>
            </select>
          </FG>

          {ESTUDIOS_SUB[form.tipo_estudio] && (
            <FG label="Modalidad *">
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {ESTUDIOS_SUB[form.tipo_estudio].map((op) => (
                  <label key={op} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input type="radio" name="sub" value={op} checked={form.sub_tipo === op} onChange={set("sub_tipo")} required />
                    {op}
                  </label>
                ))}
              </div>
            </FG>
          )}

          {form.tipo_estudio === "Tomografía (TC)" && form.sub_tipo === "Contrastada" && (
            <FG label="Creatinina (mg/dL) *">
              <input
                style={cx.input}
                type="number"
                step="0.01"
                min="0"
                value={form.creatinina}
                onChange={set("creatinina")}
                placeholder="Ej. 0.9"
                required
              />
            </FG>
          )}

          <FG label="Protocolo / área a estudiar" optional>
            <input style={cx.input} value={form.protocolo} onChange={set("protocolo")} placeholder="Ej. abdomen superior, columna lumbar, cuello..." />
          </FG>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FG label="Servicio solicitante *">
              <select style={cx.input} value={form.servicio_solicitante} onChange={set("servicio_solicitante")} required>
                <option value="">Seleccionar...</option>
                {SERVICIOS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </FG>
            <FG label="Prioridad *">
              <select style={cx.input} value={form.prioridad} onChange={set("prioridad")}>
                <option>Rutina</option>
                <option>Urgente</option>
                <option>Inmediato</option>
              </select>
            </FG>
          </div>

          {form.servicio_solicitante === "Otro" && (
            <FG label="Especificar servicio">
              <input style={cx.input} value={form.servicio_otro} onChange={set("servicio_otro")} placeholder="Ej. Consulta externa, Dirección, Psiquiatría..." />
            </FG>
          )}

          <FG label="Motivo clínico / sospecha diagnóstica" optional>
            <textarea style={{ ...cx.input, resize: "none" }} rows={3} value={form.motivo_clinico} onChange={set("motivo_clinico")} placeholder="Breve descripción del cuadro clínico..." />
          </FG>
        </div>

        {/* ── Médico ── */}
        <div style={{ ...cx.card, marginBottom: 24 }}>
          <SecLabel>Médico solicitante y contacto</SecLabel>
          <FG label="Nombre del médico *">
            <input style={cx.input} value={form.nombre_medico} onChange={set("nombre_medico")} placeholder="Dr(a). Apellidos, Nombre — cargo" required />
          </FG>
          <FG label="MIP/Residente solicitante" optional>
            <input style={cx.input} value={form.mip_solicitante || ""} onChange={set("mip_solicitante")} placeholder="Nombre del MIP o residente" />
          </FG>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <FG label="Teléfono / extensión *">
              <input style={cx.input} type="tel" value={form.telefono} onChange={set("telefono")} placeholder="Núm. o extensión" required />
            </FG>
            <FG label="Ubicación del paciente" optional>
              <input style={cx.input} value={form.ubicacion_paciente} onChange={set("ubicacion_paciente")} placeholder="Ej. Cama 12, Pasillo B" />
            </FG>
          </div>
        </div>

        <button style={cx.btnPrimary} type="submit" disabled={busy}>{busy ? "Enviando..." : "Enviar solicitud"}</button>
      </form>
    </div>
  );
}

// ─── Modal detalle / edición solicitud ────────────────────────────────────────
function SolicitudModal({ sol, adscritos, token, onUpdate, onClose }) {
  const [exp,      setExp]     = useState(sol.nss_expediente    || "");
  const [adscrito, setAdscrito]= useState(sol.adscrito_id       || "");
  const [estado,   setEstado]  = useState(sol.estado            || "pendiente");
  const [horario,  setHorario] = useState(sol.horario_programado|| "");
  const [notas,    setNotas]   = useState(sol.notas             || "");
  const [hallazgos,setHallazgos]=useState(sol.hallazgos         || "");
  const [fechaRecordatorio, setFechaRecordatorio] = useState(sol.fecha_recordatorio || "");
  const [busy, setBusy]        = useState(false);

  async function save() {
    setBusy(true);
    await db.updateSolicitud(sol.id, { nss_expediente: exp, adscrito_id: adscrito || null, estado, horario_programado: horario, notas, hallazgos, fecha_recordatorio: fechaRecordatorio || null }, token);
    await onUpdate();
    setBusy(false);
    onClose();
  }

  const E   = ESTADOS_CFG[estado]       || ESTADOS_CFG.pendiente;
  const P   = PRIORIDADES_CFG[sol.prioridad] || PRIORIDADES_CFG.Rutina;
  const svc = sol.servicio_solicitante === "Otro" ? sol.servicio_otro : sol.servicio_solicitante;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
      <div style={{ ...cx.card, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
              {sol.tipo_estudio}{sol.sub_tipo ? ` — ${sol.sub_tipo}` : ""}
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#9CA3AF" }}>
              {new Date(sol.created_at).toLocaleString("es-MX")}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: "#9CA3AF", lineHeight: 1, padding: 0 }}>✕</button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <Badge label={E.label} bg={E.bg} color={E.color} />
          <Badge label={sol.prioridad} bg={P.bg} color={P.color} />
        </div>

        {/* Info paciente */}
        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "12px 14px", marginBottom: 12 }}>
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 15 }}>{sol.nombre_paciente}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 13, color: "#374151" }}>
            <span>Edad: {sol.edad || "—"}</span>
            <span>Sexo: {sol.sexo || "—"}</span>
            <span>Servicio: {svc}</span>
            {sol.protocolo && <span>Protocolo: {sol.protocolo}</span>}
            {sol.nss_expediente && <span>Expediente: {sol.nss_expediente}</span>}
          </div>
          {sol.motivo_clinico && (
            <p style={{ margin: "8px 0 0", paddingTop: 8, borderTop: "1px solid #E5E7EB", fontSize: 13, color: "#4B5563" }}>
              <b>Motivo:</b> {sol.motivo_clinico}
            </p>
          )}
        </div>

        {/* Contacto médico */}
        <div style={{ background: "#FFF7ED", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
          <p style={{ margin: "0 0 4px", fontSize: 11, fontWeight: 700, color: "#92400E", letterSpacing: "0.06em" }}>MÉDICO SOLICITANTE</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{sol.nombre_medico}</p>
          {sol.mip_solicitante && (
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>
              👨‍⚕️ MIP/Residente: <span style={{ fontWeight: 600 }}>{sol.mip_solicitante}</span>
            </p>
          )}
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "#374151" }}>
            📞 {sol.telefono}
            {sol.ubicacion_paciente && <span> · 📍 {sol.ubicacion_paciente}</span>}
          </p>
        </div>

        {/* Campos editables */}
        <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 16 }}>
          <FG label="NSS / Expediente" optional>
            <input style={cx.input} value={exp} onChange={e => setExp(e.target.value)} placeholder="Agregar o corregir número de expediente..." />
          </FG>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <FG label="Adscrito asignado">
              <select style={cx.input} value={adscrito} onChange={e => setAdscrito(e.target.value)}>
                <option value="">Sin asignar</option>
                {adscritos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </FG>
            <FG label="Estado">
              <select style={cx.input} value={estado} onChange={e => setEstado(e.target.value)}>
                <option value="pendiente">Pendiente</option>
                <option value="agendado">Agendado</option>
                <option value="en_proceso">En proceso</option>
                <option value="reagendado">Re-agendado</option>
                <option value="postpuesto">Postpuesto</option>
                <option value="realizado">Realizado</option>
                <option value="denegado">Denegado por momento</option>
                <option value="expirado">Expirado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </FG>
          </div>

          {["agendado", "reagendado"].includes(estado) && (
            <FG label="Recordatorio — Fecha para volver a pendiente" optional>
              <input 
                type="date" 
                style={cx.input} 
                value={fechaRecordatorio} 
                onChange={e => setFechaRecordatorio(e.target.value)} 
                placeholder="Fecha de recordatorio"
              />
              <p style={{ margin: "6px 0 0", fontSize: 11, color: "#6B7280" }}>
                💡 En esta fecha, la solicitud volverá automáticamente a <strong>Pendiente</strong> para que no se pierda de vista.
              </p>
            </FG>
          )}

          {["denegado","postpuesto","expirado","reagendado","cancelado"].includes(estado) && (
            <FG label={`Motivo — ${ESTADOS_CFG[estado]?.label}`}>
              <textarea
                style={{ ...cx.input, resize: "none", borderColor: "#F87171", background: "#FFF5F5" }}
                rows={2}
                value={notas}
                onChange={e => setNotas(e.target.value)}
                placeholder={
                  estado === "denegado"   ? "¿Por qué se deniega por el momento?" :
                  estado === "postpuesto" ? "¿Por qué se pospone?" :
                  estado === "expirado"   ? "¿Por qué expiró la solicitud?" :
                  estado === "reagendado" ? "¿Por qué se re-agenda?" :
                  "¿Por qué se cancela?"
                }
                required
              />
            </FG>
          )}
          <FG label="Horario programado" optional>
            <input style={cx.input} value={horario} onChange={e => setHorario(e.target.value)} placeholder="Ej. 11:30 am · Sala 2" />
          </FG>
          <FG label="Hallazgos de imagen" optional style={{ marginBottom: 20 }}>
            <textarea
              style={{ ...cx.input, resize: "none", borderColor: "#A7F3D0", background: "#F0FDF4" }}
              rows={3}
              value={hallazgos}
              onChange={e => setHallazgos(e.target.value)}
              placeholder="Descripción de los hallazgos encontrados en el estudio..."
            />
          </FG>
          <FG label="Notas adicionales" optional style={{ marginBottom: 20 }}>
            <textarea style={{ ...cx.input, resize: "none" }} rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones, datos adicionales..." />
          </FG>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={cx.btnPrimary} onClick={save} disabled={busy}>{busy ? "Guardando..." : "Guardar cambios"}</button>
            <button style={{ ...cx.btn, flexShrink: 0 }} onClick={onClose}>Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Paleta de colores por doctor ────────────────────────────────────────────
const DOCTOR_COLORS = [
  { header: "#1E3A8A", light: "#EFF6FF", border: "#BFDBFE", text: "#1E40AF" },
  { header: "#065F46", light: "#ECFDF5", border: "#A7F3D0", text: "#047857" },
  { header: "#7C2D12", light: "#FFF7ED", border: "#FED7AA", text: "#C2410C" },
  { header: "#4C1D95", light: "#F5F3FF", border: "#DDD6FE", text: "#6D28D9" },
  { header: "#831843", light: "#FDF2F8", border: "#F9A8D4", text: "#BE185D" },
  { header: "#164E63", light: "#ECFEFF", border: "#A5F3FC", text: "#0E7490" },
  { header: "#713F12", light: "#FFFBEB", border: "#FDE68A", text: "#B45309" },
  { header: "#1F2937", light: "#F9FAFB", border: "#D1D5DB", text: "#374151" },
  { header: "#134E4A", light: "#F0FDF4", border: "#BBF7D0", text: "#15803D" },
  { header: "#4A1D96", light: "#FAF5FF", border: "#E9D5FF", text: "#7C3AED" },
];

// ─── CensoView (compartida entre Residente y Jefe) ────────────────────────────
function CensoView({ solicitudes, loading, token }) {
  const today = toMexicoTime(new Date());
  const defaultFecha = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [fecha, setFecha] = useState(defaultFecha);
  const [perfiles, setPerfiles] = useState([]);

  useEffect(() => {
    if (token) {
      db.getPerfiles(token).then(d => setPerfiles(Array.isArray(d) ? d : []));
      const interval = setInterval(() => {
        db.getPerfiles(token).then(d => setPerfiles(Array.isArray(d) ? d : []));
      }, 10000); // Recargar cada 10s
      return () => clearInterval(interval);
    }
  }, [token]);
  const { startISO, endISO } = getJornadaRange(fecha);
  const list = solicitudes.filter(s => {
    if (!s.created_at) return false;
    const sTime = new Date(s.created_at);
    return sTime >= new Date(startISO) && sTime < new Date(endISO);
  });
  const cnt  = { total: list.length, pendiente: 0, en_proceso: 0, realizado: 0 };
  list.forEach(s => { if (cnt[s.estado] !== undefined) cnt[s.estado]++; });

  const grouped = {};
  [...list]
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .forEach(sol => {
      const turno = sol.adscritos?.turno_actual || "Sin asignar";
      const doctor = sol.adscritos?.nombre || "Sin adscrito asignado";
      const key = `${turno}|${doctor}`;
      if (!grouped[key]) grouped[key] = { turno, doctor, estudios: [] };
      grouped[key].estudios.push(sol);
    });

  // Agrupar por turno para la vista
  const turnoOrder = ["Matutino", "Vespertino", "Nocturno", "Dia jornada acumulada", "Jornada acumulada", "Festivo dia", "Festivo noche"];
  const groupedByTurno = {};
  Object.values(grouped).forEach(g => {
    if (!groupedByTurno[g.turno]) groupedByTurno[g.turno] = [];
    groupedByTurno[g.turno].push(g);
  });

  const turnos = turnoOrder.filter(t => groupedByTurno[t]);
  if (groupedByTurno["Sin asignar"]) turnos.push("Sin asignar");

  function exportExcel() {
    const fechaObj = new Date(fecha + "T12:00:00");
    const fechaFormato = fechaObj.toLocaleDateString("es-MX");
    const fechaFile = fechaFormato.replace(/\//g, "-");
    
    // Obtener guardias (residentes con en_guardia = true)
    const guardias = perfiles.filter(p => p.en_guardia);

    let html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel'>
      <head><meta charset="UTF-8"></head>
      <body>
      <table style="border-collapse:collapse; font-family:Arial,sans-serif; font-size:12px;">
        <tr>
          <td colspan="7" style="background:#1E3A8A;color:white;font-size:16px;font-weight:bold;padding:14px 18px;letter-spacing:1px;height:30px;">
            🩻 CENSO DE IMAGENOLOGÍA &nbsp;—&nbsp; ${fechaFormato}
          </td>
        </tr>
        <tr><td colspan="7" style="padding:4px;height:8px;"></td></tr>
    `;

    // Sección de guardias
    if (guardias.length > 0) {
      html += `
        <tr>
          <td colspan="7" style="background:#F3E8FF;color:#7C3AED;font-weight:bold;font-size:13px;padding:11px 16px;height:25px;">
            🚨 RESIDENTES DE GUARDIA
          </td>
        </tr>
      `;
      guardias.forEach(g => {
        html += `
          <tr style="background:#F9FAFB;height:40px;">
            <td colspan="7" style="padding:8px 12px;border:1px solid #E5E7EB;color:#374151;font-weight:600;vertical-align:middle;">
              ${g.nombre}
            </td>
          </tr>
        `;
      });
      html += `<tr><td colspan="7" style="padding:6px;height:12px;"></td></tr>`;
    }

    // Stats
    html += `
      <tr>
        <td style="background:#EFF6FF;color:#1E3A8A;font-weight:bold;padding:10px 14px;border:2px solid #BFDBFE;font-size:14px;height:25px;">Total: ${cnt.total}</td>
        <td style="background:#D1FAE5;color:#065F46;font-weight:bold;padding:10px 14px;border:2px solid #6EE7B7;font-size:14px;height:25px;">✅ Realizados: ${cnt.realizado}</td>
        <td style="background:#FEF3C7;color:#92400E;font-weight:bold;padding:10px 14px;border:2px solid #FDE68A;font-size:14px;height:25px;">⏳ Pendientes: ${cnt.pendiente}</td>
        <td colspan="4" style="padding:8px;height:25px;"></td>
      </tr>
      <tr><td colspan="7" style="padding:6px;height:12px;"></td></tr>
    `;

    // Sección de consulta externa
    const consultasExternas = list.filter(s => s.es_consulta_externa);
    if (consultasExternas.length > 0) {
      html += `
        <tr>
          <td colspan="7" style="background:#1E40AF;color:white;font-weight:bold;font-size:13px;padding:11px 16px;height:25px;">
            ➕ CONSULTA EXTERNA
          </td>
        </tr>
        <tr style="background:#DBEAFE;height:30px;">
          <th style="padding:7px 12px;border:1px solid #93C5FD;color:#1E40AF;font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Paciente</th>
          <th style="padding:7px 12px;border:1px solid #93C5FD;color:#1E40AF;font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Estudio</th>
          <th style="padding:7px 12px;border:1px solid #93C5FD;color:#1E40AF;font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Modalidad</th>
          <th style="padding:7px 12px;border:1px solid #93C5FD;color:#1E40AF;font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Servicio</th>
          <th style="padding:7px 12px;border:1px solid #93C5FD;color:#1E40AF;font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Prioridad</th>
          <th style="padding:7px 12px;border:1px solid #93C5FD;color:#1E40AF;font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Médico</th>
          <th style="padding:7px 12px;border:1px solid #93C5FD;color:#1E40AF;font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Notas</th>
        </tr>
      `;
      consultasExternas.forEach((sol, idx) => {
        const svc = sol.servicio_solicitante === "Otro" ? sol.servicio_otro : sol.servicio_solicitante;
        const P = PRIORIDADES_CFG[sol.prioridad] || PRIORIDADES_CFG.Rutina;
        const rowBg = idx % 2 === 0 ? "#ffffff" : "#DBEAFE";
        html += `
          <tr style="background:${rowBg};height:40px;">
            <td style="padding:8px 12px;border:1px solid #93C5FD;font-weight:600;vertical-align:middle;">${sol.nombre_paciente}</td>
            <td style="padding:8px 12px;border:1px solid #93C5FD;vertical-align:middle;">${sol.tipo_estudio}</td>
            <td style="padding:8px 12px;border:1px solid #93C5FD;vertical-align:middle;">${sol.sub_tipo || "—"}</td>
            <td style="padding:8px 12px;border:1px solid #93C5FD;vertical-align:middle;">${svc}</td>
            <td style="padding:8px 12px;border:1px solid #93C5FD;background:${P.bg};color:${P.color};font-weight:bold;vertical-align:middle;">${sol.prioridad}</td>
            <td style="padding:8px 12px;border:1px solid #93C5FD;vertical-align:middle;">${sol.nombre_medico || "—"}</td>
            <td style="padding:8px 12px;border:1px solid #93C5FD;color:#374151;vertical-align:middle;">${sol.hallazgos || "—"}</td>
          </tr>
        `;
      });
      html += `<tr><td colspan="7" style="padding:6px;height:12px;"></td></tr>`;
    }

    // Detectar si es fin de semana (sábado=6, domingo=0)
    const fechaObj2 = new Date(fecha + "T12:00:00");
    const diaSemana = fechaObj2.getDay();
    const esFinDeSemana = diaSemana === 0 || diaSemana === 6;
    
    const turnosFiltrados = esFinDeSemana 
      ? ["Matutino", "Vespertino", "Nocturno", "Dia jornada acumulada", "Jornada acumulada", "Festivo dia", "Festivo noche"]
      : ["Matutino", "Vespertino", "Nocturno"];
    
    turnosFiltrados.forEach((turno) => {
      const estudiosTurno = groupedByTurno[turno] || [];
      if (estudiosTurno.length === 0) return;
      
      html += `
        <tr>
          <td colspan="7" style="background:#1E3A8A;color:white;font-weight:bold;font-size:13px;padding:11px 16px;height:25px;">
            ${turno === "Matutino" ? "🌅" : turno === "Vespertino" ? "🌤️" : turno === "Nocturno" ? "🌙" : turno === "Dia jornada acumulada" ? "📅" : turno === "Jornada acumulada" ? "📅" : turno === "Festivo dia" ? "🏆" : turno === "Festivo noche" ? "🏆" : "❓"} ${turno}
          </td>
        </tr>
      `;

      estudiosTurno.forEach((group, idx) => {
        const clr = group.doctor === "Sin adscrito asignado"
          ? { header: "#78350F", light: "#FFFBEB", border: "#FDE68A", text: "#92400E" }
          : DOCTOR_COLORS[idx % DOCTOR_COLORS.length];

        html += `
          <tr>
            <td colspan="7" style="background:${clr.header};color:white;font-weight:bold;font-size:12px;padding:9px 14px;height:22px;">
              👨‍⚕️ ${group.doctor} &nbsp;&nbsp; (${group.estudios.length} estudio${group.estudios.length !== 1 ? "s" : ""})
            </td>
          </tr>
          <tr style="background:${clr.light};height:30px;">
            <th style="padding:7px 12px;border:1px solid ${clr.border};color:${clr.text};font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Paciente</th>
            <th style="padding:7px 12px;border:1px solid ${clr.border};color:${clr.text};font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Estudio</th>
            <th style="padding:7px 12px;border:1px solid ${clr.border};color:${clr.text};font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Modalidad</th>
            <th style="padding:7px 12px;border:1px solid ${clr.border};color:${clr.text};font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Servicio</th>
            <th style="padding:7px 12px;border:1px solid ${clr.border};color:${clr.text};font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Prioridad</th>
            <th style="padding:7px 12px;border:1px solid ${clr.border};color:${clr.text};font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Estado</th>
            <th style="padding:7px 12px;border:1px solid ${clr.border};color:${clr.text};font-size:10px;text-transform:uppercase;letter-spacing:1px;vertical-align:middle;">Hallazgos</th>
          </tr>
        `;

        group.estudios.forEach(sol => {
          const svc = sol.servicio_solicitante === "Otro" ? sol.servicio_otro : sol.servicio_solicitante;
          const E   = ESTADOS_CFG[sol.estado] || ESTADOS_CFG.pendiente;
          const P   = PRIORIDADES_CFG[sol.prioridad] || PRIORIDADES_CFG.Rutina;
          const rowBg = group.estudios.indexOf(sol) % 2 === 0 ? "#ffffff" : clr.light;
          html += `
            <tr style="background:${rowBg};height:40px;">
              <td style="padding:8px 12px;border:1px solid ${clr.border};font-weight:600;vertical-align:middle;">${sol.nombre_paciente}</td>
              <td style="padding:8px 12px;border:1px solid ${clr.border};vertical-align:middle;">${sol.tipo_estudio}</td>
              <td style="padding:8px 12px;border:1px solid ${clr.border};vertical-align:middle;">${sol.sub_tipo || "—"}</td>
              <td style="padding:8px 12px;border:1px solid ${clr.border};vertical-align:middle;">${svc}</td>
              <td style="padding:8px 12px;border:1px solid ${clr.border};background:${P.bg};color:${P.color};font-weight:bold;vertical-align:middle;">${sol.prioridad}</td>
              <td style="padding:8px 12px;border:1px solid ${clr.border};background:${E.bg};color:${E.color};font-weight:bold;vertical-align:middle;">${E.label}</td>
              <td style="padding:8px 12px;border:1px solid ${clr.border};color:#374151;vertical-align:middle;">${sol.hallazgos || "—"}</td>
            </tr>
          `;
        });
        html += `<tr><td colspan="7" style="padding:5px;height:10px;"></td></tr>`;
      });
    });

    html += `</table></body></html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `Censo_Imagenologia_${fechaFile}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#111827" }}>Censo del día</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>
            {new Date(fecha + "T12:00:00").toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} style={{ ...cx.input, width: "auto", fontSize: 13 }} />
          <button onClick={exportExcel} disabled={list.length === 0} style={{ background: "#065F46", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: list.length === 0 ? "not-allowed" : "pointer", opacity: list.length === 0 ? 0.5 : 1, fontFamily: "inherit" }}>
            📥 Excel
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        {[
          ["Total",      cnt.total,      "#1E3A8A", "#EFF6FF", "#BFDBFE"],
          ["Pendientes", cnt.pendiente,  "#92400E", "#FEF3C7", "#FDE68A"],
          ["En proceso", cnt.en_proceso, "#1E40AF", "#DBEAFE", "#93C5FD"],
          ["Realizados", cnt.realizado,  "#065F46", "#D1FAE5", "#6EE7B7"],
        ].map(([l, v, color, bg, border]) => (
          <div key={l} style={{ background: bg, borderRadius: 12, border: `1.5px solid ${border}`, padding: "14px 16px" }}>
            <p style={{ margin: 0, fontSize: 30, fontWeight: 800, color }}>{v}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color, opacity: 0.8, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{l}</p>
          </div>
        ))}
      </div>

      {/* Consulta Externa */}
      {loading ? null : (() => {
        const consultasExternas = list.filter(s => s.es_consulta_externa);
        return consultasExternas.length > 0 ? (
          <div style={{ background: "#DBEAFE", borderRadius: 12, border: "1.5px solid #93C5FD", padding: "16px", marginBottom: 24 }}>
            <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.05em" }}>➕ Consulta Externa ({consultasExternas.length})</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {consultasExternas.map(sol => {
                const svc = sol.servicio_solicitante === "Otro" ? sol.servicio_otro : sol.servicio_solicitante;
                const P = PRIORIDADES_CFG[sol.prioridad] || PRIORIDADES_CFG.Rutina;
                return (
                  <div key={sol.id} style={{ background: "#fff", borderRadius: 8, padding: "12px", border: "1px solid #93C5FD" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <div>
                        <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#1F2937" }}>{sol.nombre_paciente}</p>
                        <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>{sol.tipo_estudio} {sol.sub_tipo ? `· ${sol.sub_tipo}` : ""}</p>
                      </div>
                      <span style={{ background: P.bg, color: P.color, padding: "4px 10px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>{sol.prioridad}</span>
                    </div>
                    <p style={{ margin: "0 0 6px", fontSize: 12, color: "#374151" }}>👨‍⚕️ {sol.nombre_medico} · {svc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null;
      })()}

      {/* Guardias */}
      {loading ? null : (
        <div style={{ background: "#F3E8FF", borderRadius: 12, border: "1.5px solid #E9D5FF", padding: "16px", marginBottom: 24 }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.05em" }}>🚨 Residentes de guardia</p>
          {perfiles.filter(p => p.en_guardia).length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {perfiles.filter(p => p.en_guardia).map(res => (
                <span key={res.id} style={{ background: "#8B5CF6", color: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 13, fontWeight: 600 }}>
                  {res.nombre}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ margin: 0, fontSize: 13, color: "#6D28D9" }}>Sin guardias asignadas hoy.</p>
          )}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>Cargando...</p>
      ) : list.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "#9CA3AF" }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>📋</p>
          <p style={{ fontSize: 15 }}>Sin estudios registrados hoy.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {turnos.map((turno) => (
            <div key={turno}>
              {/* Turno header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, paddingBottom: 12, borderBottom: "2px solid #E5E7EB" }}>
                <span style={{ fontSize: 20 }}>
                  {turno === "Matutino" ? "🌅" : turno === "Vespertino" ? "🌤️" : turno === "Nocturno" ? "🌙" : turno === "Dia jornada acumulada" ? "📅" : turno === "Jornada acumulada" ? "📅" : turno === "Festivo dia" ? "🏆" : turno === "Festivo noche" ? "🏆" : "❓"}
                </span>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "#1E3A8A" }}>{turno}</h3>
                <span style={{ marginLeft: "auto", fontSize: 12, color: "#6B7280" }}>
                  {groupedByTurno[turno]?.reduce((sum, g) => sum + g.estudios.length, 0)} estudio{groupedByTurno[turno]?.reduce((sum, g) => sum + g.estudios.length, 0) !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Doctors within turno */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {groupedByTurno[turno]?.map((group, idx) => {
                  const clr = group.doctor === "Sin adscrito asignado"
                    ? { header: "#78350F", light: "#FFFBEB", border: "#FDE68A", text: "#92400E" }
                    : DOCTOR_COLORS[idx % DOCTOR_COLORS.length];

                  return (
                    <div key={group.doctor} style={{ borderRadius: 12, overflow: "hidden", border: `1.5px solid ${clr.border}`, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                      {/* Doctor card header */}
                      <div style={{ background: clr.header, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>
                          {group.doctor === "Sin adscrito asignado" ? "⚠️ " : "👨‍⚕️ "}{group.doctor}
                        </span>
                        <span style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>
                          {group.estudios.length}
                        </span>
                      </div>

                      {/* Studies table */}
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 }}>
                          <thead>
                            <tr style={{ background: clr.light }}>
                              {["Paciente", "Edad", "Estudio", "Servicio", "Prioridad", "Estado", "Hallazgos"].map(h => (
                                <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 10, color: clr.text, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: `1.5px solid ${clr.border}` }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {group.estudios.map((sol, i) => {
                              const E   = ESTADOS_CFG[sol.estado] || ESTADOS_CFG.pendiente;
                              const P   = PRIORIDADES_CFG[sol.prioridad] || PRIORIDADES_CFG.Rutina;
                              const svc = sol.servicio_solicitante === "Otro" ? sol.servicio_otro : sol.servicio_solicitante;
                              return (
                                <tr key={sol.id} style={{ background: i % 2 === 0 ? "#fff" : clr.light, borderBottom: `1px solid ${clr.border}66` }}>
                                  <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827" }}>{sol.nombre_paciente}</td>
                                  <td style={{ padding: "8px 12px", color: "#374151" }}>{sol.edad || <span style={{ color: "#D1D5DB" }}>—</span>}</td>
                                  <td style={{ padding: "8px 12px", color: "#374151" }}>{sol.tipo_estudio}{sol.sub_tipo ? ` · ${sol.sub_tipo}` : ""}</td>
                                  <td style={{ padding: "8px 12px", color: "#374151" }}>{svc}</td>
                                  <td style={{ padding: "8px 12px" }}><Badge label={sol.prioridad} bg={P.bg} color={P.color} /></td>
                                  <td style={{ padding: "8px 12px" }}><Badge label={E.label} bg={E.bg} color={E.color} /></td>
                                  <td style={{ padding: "8px 12px", color: "#374151", fontSize: 11, maxWidth: 200 }}>{sol.hallazgos || <span style={{ color: "#D1D5DB" }}>—</span>}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Estadísticas mensuales ───────────────────────────────────────────────────
function EstadisticasView({ token }) {
  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [sols,  setSols]  = useState([]);
  const [loading, setLoad]= useState(true);

  useEffect(() => {
    setLoad(true);
    db.getSolicitudesByMonth(token, year, month).then(d => {
      setSols(Array.isArray(d) ? d : []);
      setLoad(false);
    });
  }, [year, month, token]);

  const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  function countBy(key, transform) {
    const map = {};
    sols.forEach(s => {
      const k = transform ? transform(s) : s[key];
      if (!k) return;
      map[k] = (map[k] || 0) + 1;
    });
    return Object.entries(map).sort((a,b) => b[1]-a[1]);
  }

  const byTipo    = countBy(null, s => s.tipo_estudio);
  const byServicio= countBy(null, s => s.servicio_solicitante === "Otro" ? s.servicio_otro : s.servicio_solicitante);
  const byAdscrito= countBy(null, s => s.adscritos?.nombre || "Sin asignar");
  const byEstado  = countBy("estado");
  const maxVal    = (arr) => arr.length ? Math.max(...arr.map(([,v])=>v)) : 1;

  function BarChart({ data, colorFrom }) {
    const max = maxVal(data);
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map(([label, val]) => (
          <div key={label}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
              <span style={{ color: "#374151", fontWeight: 500 }}>{label}</span>
              <span style={{ color: "#6B7280", fontWeight: 700 }}>{val}</span>
            </div>
            <div style={{ background: "#F3F4F6", borderRadius: 6, height: 10, overflow: "hidden" }}>
              <div style={{ width: `${(val/max)*100}%`, height: "100%", background: colorFrom, borderRadius: 6, transition: "width 0.4s" }} />
            </div>
          </div>
        ))}
        {data.length === 0 && <p style={{ color: "#9CA3AF", fontSize: 13 }}>Sin datos</p>}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Estadísticas</h2>
          <p style={{ margin: "2px 0 0", fontSize: 13, color: "#6B7280" }}>{sols.length} estudios en {MESES[month-1]} {year}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <select style={{ ...cx.input, width: "auto" }} value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MESES.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </select>
          <select style={{ ...cx.input, width: "auto" }} value={year} onChange={e => setYear(Number(e.target.value))}>
            {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading ? <p style={{ textAlign: "center", color: "#9CA3AF", padding: 40 }}>Cargando...</p> : (
        <>
          {/* Resumen */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
            {[
              ["Total", sols.length, "#1E3A8A", "#EFF6FF", "#BFDBFE"],
              ["Realizados", sols.filter(s=>s.estado==="realizado").length, "#065F46", "#D1FAE5", "#6EE7B7"],
              ["Urgentes", sols.filter(s=>s.prioridad==="Urgente"||s.prioridad==="Inmediato").length, "#92400E","#FEF3C7","#FDE68A"],
              ["Sin adscrito", sols.filter(s=>!s.adscrito_id).length, "#991B1B","#FEE2E2","#FCA5A5"],
            ].map(([l,v,color,bg,border]) => (
              <div key={l} style={{ background: bg, borderRadius: 12, border: `1.5px solid ${border}`, padding: "12px 16px" }}>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color }}>{v}</p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color, opacity: 0.8, fontWeight: 600, textTransform: "uppercase" }}>{l}</p>
              </div>
            ))}
          </div>

          {/* Charts grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={cx.card}>
              <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#1E3A8A" }}>Por tipo de estudio</p>
              <BarChart data={byTipo} colorFrom="#1E3A8A" />
            </div>
            <div style={cx.card}>
              <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#065F46" }}>Por adscrito</p>
              <BarChart data={byAdscrito} colorFrom="#065F46" />
            </div>
            <div style={cx.card}>
              <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#7C2D12" }}>Por servicio solicitante</p>
              <BarChart data={byServicio} colorFrom="#C2410C" />
            </div>
            <div style={cx.card}>
              <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#4C1D95" }}>Por estado</p>
              <BarChart data={byEstado.map(([k,v]) => [ESTADOS_CFG[k]?.label || k, v])} colorFrom="#6D28D9" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Anuncios ─────────────────────────────────────────────────────────────────
function AnunciosView({ token, session }) {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnuncios();
    const interval = setInterval(loadAnuncios, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadAnuncios() {
    try {
      const data = await db.getAnuncios(token);
      setAnuncios(data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error loading anuncios:", err);
      setLoading(false);
    }
  }

  async function deleteAnuncio(id) {
    if (!confirm("¿Eliminar anuncio?")) return;
    try {
      await db.deleteAnuncio(id, token);
      setAnuncios(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Error deleting anuncio:", err);
    }
  }

  const cx = {
    container: { maxWidth: 1000, margin: "0 auto", padding: "20px" },
    card: { background: "#fff", borderRadius: 12, padding: "16px", marginBottom: 16, border: "1px solid #E5E7EB", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" },
  };

  if (loading) return <div style={cx.container}><p style={{ color: "#6B7280" }}>Cargando anuncios...</p></div>;

  return (
    <div style={cx.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1E3A8A" }}>📌 Anuncios</h2>
        <span style={{ fontSize: 12, color: "#6B7280" }}>{anuncios.length} anuncio{anuncios.length !== 1 ? "s" : ""}</span>
      </div>

      {anuncios.length === 0 ? (
        <div style={{ ...cx.card, textAlign: "center", color: "#9CA3AF" }}>
          <p>No hay anuncios por el momento</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {anuncios.map(anuncio => (
            <div key={anuncio.id} style={{ ...cx.card, borderLeft: "4px solid #3B82F6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700, color: "#1F2937" }}>{anuncio.titulo}</h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#6B7280" }}>
                    Por <span style={{ fontWeight: 600, color: "#374151" }}>{anuncio.usuario_nombre}</span> · {toMexicoTime(anuncio.created_at).toLocaleDateString("es-MX")}
                  </p>
                </div>
                {session?.perfil?.rol === "admin" && (
                  <button
                    onClick={() => deleteAnuncio(anuncio.id)}
                    style={{ padding: "4px 12px", fontSize: 12, borderRadius: 6, border: "1px solid #FEE2E2", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
                  >
                    ✕ Eliminar
                  </button>
                )}
              </div>
              {anuncio.descripcion && (
                <p style={{ margin: "0 0 12px", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{anuncio.descripcion}</p>
              )}
              {anuncio.imagen_url && (
                <img src={anuncio.imagen_url} alt="Anuncio" style={{ width: "100%", maxHeight: 300, borderRadius: 8, marginTop: 12, objectFit: "cover" }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Anuncios Upload ──────────────────────────────────────────────────────────
function AnunciosUpload({ token, perfil }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!titulo.trim()) {
      setMsg({ type: "error", text: "El título es requerido" });
      return;
    }
    if (!file) {
      setMsg({ type: "error", text: "Selecciona una imagen" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const filename = `${Date.now()}-${file.name}`;
      const r = await fetch(
        `${SUPABASE_URL}/storage/v1/object/anuncios/${filename}`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData }
      );

      if (!r.ok) throw new Error("Upload failed");

      const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/anuncios/${filename}`;

      const newAnuncio = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        imagen_url: imageUrl,
        usuario_id: perfil.id,
        usuario_nombre: perfil.nombre,
      };

      await db.createAnuncio(newAnuncio, token);

      setTitulo("");
      setDescripcion("");
      setFile(null);
      setMsg({ type: "success", text: "Anuncio publicado ✓" });
      setTimeout(() => setMsg(null), 3000);
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error("Error:", err);
      setMsg({ type: "error", text: "Error al publicar" });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <FG label="Título" required>
        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ej: Mantenimiento del equipo" style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
      </FG>

      <FG label="Descripción" optional>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Detalles adicionales..." rows={3} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%", resize: "none" }} />
      </FG>

      <FG label="Imagen" required>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
        {file && <p style={{ margin: "8px 0 0", fontSize: 12, color: "#10B981" }}>✓ {file.name}</p>}
      </FG>

      {msg && (
        <div style={{ padding: "10px 12px", borderRadius: 6, background: msg.type === "error" ? "#FEE2E2" : "#DCFCE7", color: msg.type === "error" ? "#DC2626" : "#16A34A", fontSize: 13, fontWeight: 500 }}>
          {msg.text}
        </div>
      )}

      <button
        type="submit"
        disabled={uploading}
        style={{ padding: "10px 16px", borderRadius: 6, border: "none", background: "#7C3AED", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", opacity: uploading ? 0.6 : 1 }}
      >
        {uploading ? "Publicando..." : "📌 Publicar anuncio"}
      </button>
    </form>
  );
}

// ─── Consulta Externa Form ────────────────────────────────────────────────────
function ConsultaExternaForm({ token, perfil }) {
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edad, setEdad] = useState("");
  const [tipoEstudio, setTipoEstudio] = useState("Mama");
  const [subTipo, setSubTipo] = useState("");
  const [hallazgos, setHallazgos] = useState("");
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nombrePaciente.trim()) {
      setMsg({ type: "error", text: "Nombre del paciente requerido" });
      return;
    }
    if (!edad || edad <= 0) {
      setMsg({ type: "error", text: "Edad requerida" });
      return;
    }

    setSaving(true);
    try {
      const newSolicitud = {
        nombre_paciente: toTitleCase(nombrePaciente.trim()),
        tipo_estudio: tipoEstudio,
        sub_tipo: subTipo ? toTitleCase(subTipo) : null,
        edad: parseInt(edad),
        hallazgos: hallazgos.trim() || null,
        servicio_solicitante: "Consulta Externa",
        prioridad: "Rutina",
        estado: "realizado",
        es_consulta_externa: true,
        adscrito_id: perfil?.id,
        nombre_medico: perfil?.nombre,
        creatinina: null,
        horario_programado: null,
        notas: "Consulta externa",
        sexo: null,
        motivo_clinico: null,
        nss_expediente: null,
        protocolo: null,
        ubicacion_paciente: null,
        servicio_otro: null,
      };

      await db.createSolicitud(newSolicitud, token);
      setMsg({ type: "success", text: "Consulta externa registrada ✓" });
      setNombrePaciente("");
      setEdad("");
      setSubTipo("");
      setHallazgos("");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error("Error:", err);
      setMsg({ type: "error", text: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <FG label="Paciente" required>
          <input type="text" value={nombrePaciente} onChange={e => setNombrePaciente(e.target.value)} placeholder="Nombre completo" style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
        </FG>
        <FG label="Edad" required>
          <input type="number" value={edad} onChange={e => setEdad(e.target.value)} placeholder="Años" min="0" max="120" style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
        </FG>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FG label="Tipo de estudio" required>
          <select value={tipoEstudio} onChange={e => setTipoEstudio(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }}>
            <option>Mama</option>
            <option>Obstétrico</option>
            <option>Ginecológico</option>
            <option>Tomografía</option>
            <option>Ultrasonido General</option>
          </select>
        </FG>
        <FG label="Sub-tipo" optional>
          <input type="text" value={subTipo} onChange={e => setSubTipo(e.target.value)} placeholder="Especificación" style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
        </FG>
      </div>

      <FG label="Hallazgos" optional>
        <textarea value={hallazgos} onChange={e => setHallazgos(e.target.value)} placeholder="Descripción de hallazgos" rows={3} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%", resize: "none" }} />
      </FG>

      {msg && (
        <div style={{ padding: "10px 12px", borderRadius: 6, background: msg.type === "error" ? "#FEE2E2" : "#DCFCE7", color: msg.type === "error" ? "#DC2626" : "#16A34A", fontSize: 13, fontWeight: 500 }}>
          {msg.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{ padding: "10px 16px", borderRadius: 6, border: "none", background: "#1E40AF", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Guardando..." : "➕ Registrar consulta"}
      </button>
    </form>
  );
}

// ─── Ajustes ──────────────────────────────────────────────────────────────────
function AjustesView({ session }) {
  const { token, perfil } = session;
  const [adscritos, setAdscritos] = useState([]);
  const [pass1, setPass1] = useState("");
  const [pass2, setPass2] = useState("");
  const [passMsg, setPassMsg] = useState(null);
  const [passBusy, setPassBusy] = useState(false);
  const [toggling, setToggling] = useState(null);
  const [msg, setMsg] = useState(null);
  const [perfiles, setPerfiles] = useState([]);

  useEffect(() => {
    db.getPerfiles(token).then(d => setPerfiles(Array.isArray(d) ? d : []));
  }, [token]);

  useEffect(() => {
    db.getAdscritos(token).then(d => setAdscritos(Array.isArray(d) ? d : []));
  }, [token]);

  async function changePass(e) {
    e.preventDefault();
    if (pass1 !== pass2) { setPassMsg({ ok: false, text: "Las contraseñas no coinciden." }); return; }
    if (pass1.length < 6) { setPassMsg({ ok: false, text: "Mínimo 6 caracteres." }); return; }
    setPassBusy(true);
    const r = await db.changePassword(pass1, token);
    if (r.id) { setPassMsg({ ok: true, text: "Contraseña actualizada correctamente." }); setPass1(""); setPass2(""); }
    else setPassMsg({ ok: false, text: "Error al cambiar. Intenta de nuevo." });
    setPassBusy(false);
  }

  async function toggleAdscrito(ads) {
    setToggling(ads.id);
    await db.updateAdscrito(ads.id, { activo: !ads.activo }, token);
    setAdscritos(prev => prev.map(a => a.id === ads.id ? { ...a, activo: !a.activo } : a));
    setToggling(null);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {msg && (
        <div style={{ padding: "12px 16px", borderRadius: 8, background: msg.type === "error" ? "#FEE2E2" : "#DCFCE7", color: msg.type === "error" ? "#DC2626" : "#16A34A", fontSize: 13, fontWeight: 500 }}>
          {msg.text}
        </div>
      )}

      {/* Cambio de contraseña */}
      <div style={cx.card}>
        <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#1E3A8A", textTransform: "uppercase", letterSpacing: "0.06em" }}>🔑 Cambiar contraseña</p>
        <form onSubmit={changePass} style={{ maxWidth: 360 }}>
          <FG label="Nueva contraseña">
            <input style={cx.input} type="password" value={pass1} onChange={e => setPass1(e.target.value)} placeholder="Mínimo 6 caracteres" required />
          </FG>
          <FG label="Confirmar contraseña" style={{ marginBottom: 16 }}>
            <input style={cx.input} type="password" value={pass2} onChange={e => setPass2(e.target.value)} placeholder="Repite la contraseña" required />
          </FG>
          {passMsg && <p style={{ fontSize: 13, marginBottom: 12, color: passMsg.ok ? "#065F46" : "#DC2626" }}>{passMsg.text}</p>}
          <button style={{ ...cx.btnPrimary, width: "auto", padding: "9px 24px" }} type="submit" disabled={passBusy}>
            {passBusy ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>

      {/* Activación mensual de adscritos */}
      <div style={cx.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#065F46", textTransform: "uppercase", letterSpacing: "0.06em" }}>👨‍⚕️ Adscritos activos este mes</p>
          <span style={{ fontSize: 12, color: "#6B7280" }}>{adscritos.filter(a=>a.activo).length} de {adscritos.length} activos</span>
        </div>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>Activa solo los adscritos que están rotando este mes. Los inactivos no aparecerán en la lista de asignación.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {adscritos.map(ads => (
            <div key={ads.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: ads.activo ? "#ECFDF5" : "#F9FAFB", border: `1px solid ${ads.activo ? "#A7F3D0" : "#E5E7EB"}` }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: ads.activo ? "#065F46" : "#6B7280" }}>{ads.nombre}</span>
              <button
                onClick={() => toggleAdscrito(ads)}
                disabled={toggling === ads.id}
                style={{ padding: "5px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: ads.activo ? "#065F46" : "#D1D5DB", color: ads.activo ? "#fff" : "#374151", opacity: toggling === ads.id ? 0.5 : 1 }}
              >
                {toggling === ads.id ? "..." : ads.activo ? "✓ Activo" : "Inactivo"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Asignación de turnos */}
      <div style={cx.card}>
        <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#4C1D95", textTransform: "uppercase", letterSpacing: "0.06em" }}>🕐 Asignar turnos</p>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>Configura el turno actual de cada adscrito. Esto determina en qué sección del censo aparecerá.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {adscritos.map(ads => (
            <div key={ads.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: 8, background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#374151" }}>{ads.nombre}</span>
              <select
                value={ads.turno_actual || "Matutino"}
                onChange={(e) => {
                  const nuevoTurno = e.target.value;
                  setToggling(ads.id);
                  db.updateAdscrito(ads.id, { turno_actual: nuevoTurno }, token)
                    .then(() => {
                      setAdscritos(prev => prev.map(a => a.id === ads.id ? { ...a, turno_actual: nuevoTurno } : a));
                      setToggling(null);
                    })
                    .catch(err => {
                      console.error("Error updating turno:", err);
                      setToggling(null);
                    });
                }}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 13, fontFamily: "inherit", background: "#fff", cursor: "pointer" }}
              >
                <option value="Matutino">🌅 Matutino (8am-3pm)</option>
                <option value="Vespertino">🌤️ Vespertino (2pm-8pm)</option>
                <option value="Nocturno">🌙 Nocturno (8pm-7am)</option>
                <option value="Dia jornada acumulada">📅 Dia jornada acumulada (7am-7pm)</option>
                <option value="Jornada acumulada">📅 Jornada acumulada (Sáb 7am-8pm + Dom 7am-Lun 7am)</option>
                <option value="Festivo dia">🏆 Festivo día (7am-7pm)</option>
                <option value="Festivo noche">🏆 Festivo noche (7pm-7am)</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Consulta Externa */}
      <div style={cx.card}>
        <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>➕ Crear Consulta Externa</p>
        <ConsultaExternaForm token={token} perfil={perfil} />
      </div>

      {/* Guardias hoy - visible para todos los residentes */}
      <div style={cx.card}>
        <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.06em" }}>🚨 Residentes de guardia hoy</p>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>Marca quiénes están de guardia. Se mostrarán automáticamente en el censo.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {perfiles.filter(p => ["r1", "r3", "r4", "admin"].includes(p.rol)).map(res => (
            <div key={res.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 8, background: res.en_guardia ? "#F3E8FF" : "#F9FAFB", border: `1px solid ${res.en_guardia ? "#E9D5FF" : "#E5E7EB"}` }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: res.en_guardia ? "#7C3AED" : "#374151" }}>{res.nombre}</span>
              <button
                onClick={() => {
                  setToggling(res.id);
                  db.updatePerfil(res.id, { en_guardia: !res.en_guardia }, token)
                    .then(() => {
                      setPerfiles(prev => prev.map(p => p.id === res.id ? { ...p, en_guardia: !p.en_guardia } : p));
                      setToggling(null);
                    })
                    .catch(err => {
                      console.error("Error:", err);
                      setToggling(null);
                    });
                }}
                disabled={toggling === res.id}
                style={{ padding: "5px 16px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit", background: res.en_guardia ? "#8B5CF6" : "#D1D5DB", color: res.en_guardia ? "#fff" : "#374151", opacity: toggling === res.id ? 0.5 : 1 }}
              >
                {toggling === res.id ? "..." : res.en_guardia ? "✓ Guardia" : "No"}
              </button>
            </div>
          ))}
        </div>
      </div>
      {perfil?.rol === "admin" && (
        <div style={cx.card}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.06em" }}>📌 Publicar anuncio</p>
          <AnunciosUpload token={token} perfil={perfil} />
        </div>
      )}

      {/* Limpieza de historial - solo para admin */}
      {perfil?.rol === "admin" && (
        <div style={cx.card}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.06em" }}>⚠️ Limpieza de historial</p>
          <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280" }}>Eliminar todas las solicitudes anteriores a hoy. Esta acción no se puede deshacer.</p>
          <button
            onClick={() => {
              if (!confirm("⚠️ ¿Eliminar TODAS las solicitudes anteriores a hoy?\n\nEsta acción NO se puede deshacer.")) return;
              setToggling("clean");
              db.cleanHistory(token)
                .then(() => {
                  setMsg({ type: "success", text: "Historial limpiado ✓" });
                  setToggling(null);
                  setTimeout(() => window.location.reload(), 1500);
                })
                .catch(err => {
                  console.error("Error:", err);
                  setMsg({ type: "error", text: "Error al limpiar historial" });
                  setToggling(null);
                });
            }}
            disabled={toggling === "clean"}
            style={{ padding: "10px 16px", borderRadius: 6, border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit", opacity: toggling === "clean" ? 0.6 : 1 }}
          >
            {toggling === "clean" ? "Limpiando..." : "🗑️ Limpiar historial"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Panel Residente ──────────────────────────────────────────────────────────
function PanelResidente({ session, onLogout }) {
  const { uid, token, perfil } = session;
  const isMobile               = useIsMobile();
  const [view,     setView]    = useState("solicitudes");
  const [sols,     setSols]    = useState([]);
  const [ads,      setAds]     = useState([]);
  const [selected, setSelected]= useState(null);
  const [fechaSolicitudes, setFechaSolicitudes] = useState(() => {
    const today = toMexicoTime(new Date());
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [loading,  setLoading] = useState(true);
  const [area,     setArea]    = useState(perfil?.area_rotacion || "Tomografía");
  const [filtro,   setFiltro]  = useState("todas");
  const [toast,    setToast]   = useState(null);
  const prevCount              = useRef(0);

  function playNotif() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      [[880,0],[1100,0.18],[880,0.36]].forEach(([freq,t]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.35, ctx.currentTime + t);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.16);
        osc.start(ctx.currentTime + t);
        osc.stop(ctx.currentTime + t + 0.18);
      });
    } catch {}
  }

  const load = useCallback(async () => {
    const [s, a] = await Promise.all([
      db.getSolicitudes(token),
      db.getAdscritos(token)
    ]);
    let newSols = Array.isArray(s) ? s : [];
    
    // Auto-actualizar solicitudes agendadas/reagendadas con fecha_recordatorio pasada
    const today = new Date().toISOString().split('T')[0];
    const toUpdate = newSols.filter(sol => 
      (sol.estado === "agendado" || sol.estado === "reagendado") && 
      sol.fecha_recordatorio && 
      sol.fecha_recordatorio <= today
    );
    
    if (toUpdate.length > 0) {
      await Promise.all(toUpdate.map(sol => 
        db.updateSolicitud(sol.id, { estado: "pendiente" }, token)
      ));
      // Recargar después de actualizar
      newSols = await db.getSolicitudes(token);
      newSols = Array.isArray(newSols) ? newSols : [];
    }
    
    const activeAds = Array.isArray(a) ? a.filter(ad => ad.activo) : [];
    if (prevCount.current > 0 && newSols.length > prevCount.current) {
      const n = newSols.length - prevCount.current;
      setToast(`${n} nueva${n > 1 ? "s" : ""} solicitud${n > 1 ? "es" : ""} recibida${n > 1 ? "s" : ""}`);
      playNotif();
    }
    prevCount.current = newSols.length;
    setSols(newSols);
    setAds(activeAds);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  async function changeArea(a) {
    setArea(a);
    if (perfil?.id) await db.savePerfil(perfil.id, { area_rotacion: a }, token);
  }

  const hoy      = new Date().toISOString().slice(0, 10);
  const { startISO: todayStart, endISO: todayEnd } = getJornadaRange(fechaSolicitudes);
  const todaySols = sols.filter(s => {
    if (!s.created_at) return false;
    const sTime = new Date(s.created_at);
    return sTime >= new Date(todayStart) && sTime < new Date(todayEnd);
  });
  
  // Filtrar todaySols por área seleccionada para stats
  const todaySolsFiltered = (() => {
    let f = todaySols;
    if (area && area !== "Todas") {
      const estudiosArea = AREA_ESTUDIOS[area] || [];
      f = f.filter(s => estudiosArea.includes(s.tipo_estudio));
    }
    return f;
  })();
  const pending  = sols.filter(s => s.estado === "pendiente").length;
  const filtered = (() => {
    let f = filtro === "todas" ? sols : sols.filter(s => s.estado === filtro);
    if (area && area !== "Todas") {
      const estudiosArea = AREA_ESTUDIOS[area] || [];
      f = f.filter(s => estudiosArea.includes(s.tipo_estudio));
    }
    // Filtrar por jornada de fecha seleccionada
    const { startISO, endISO } = getJornadaRange(fechaSolicitudes);
    f = f.filter(s => {
      if (!s.created_at) return false;
      const sTime = new Date(s.created_at);
      return sTime >= new Date(startISO) && sTime < new Date(endISO);
    });
    return f;
  })();

  const TABS = [
    { id: "solicitudes", label: "Solicitudes", badge: pending },
    { id: "censo",       label: "Censo" },
    { id: "estadisticas",label: "Estadísticas" },
    { id: "anuncios",    label: "📌 Anuncios" },
    { id: "ajustes",     label: "⚙️ Ajustes" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Header */}
      <div style={{ background: "#1E3A8A", padding: isMobile ? "10px 12px" : "10px 20px" }}>
        {isMobile ? (
          // Mobile: dos filas
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>🩻</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#fff" }}>Imagenología</p>
                  <p style={{ margin: 0, fontSize: 11, color: "#93C5FD" }}>{perfil?.nombre || "Residente"} · {perfil?.rol?.toUpperCase()}</p>
                </div>
              </div>
              <button onClick={onLogout} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #F87171", cursor: "pointer", fontSize: 12, background: "transparent", color: "#FCA5A5", fontFamily: "inherit" }}>Salir</button>
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setView(tab.id)} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid", cursor: "pointer", fontSize: 12, fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, background: view === tab.id ? "#fff" : "transparent", color: view === tab.id ? "#1E3A8A" : "#93C5FD", borderColor: view === tab.id ? "#fff" : "#3B82F6", fontWeight: view === tab.id ? 700 : 400 }}>
                  {tab.label}{tab.badge > 0 && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 20, padding: "1px 6px", fontSize: 10, marginLeft: 5 }}>{tab.badge}</span>}
                </button>
              ))}
              <button onClick={() => { const w = window.open("https://imagenologia.vercel.app/?page=qr", "_blank"); if (!w) window.location.href = "https://imagenologia.vercel.app/?page=qr"; }} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #34D399", cursor: "pointer", fontSize: 12, fontFamily: "inherit", whiteSpace: "nowrap", flexShrink: 0, background: "transparent", color: "#34D399", fontWeight: 500 }}>
                🔳 QR
              </button>
            </div>
          </>
        ) : (
          // Desktop: una sola fila
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🩻</span>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#fff" }}>Imagenología</p>
                  <p style={{ margin: 0, fontSize: 12, color: "#93C5FD" }}>{perfil?.nombre || "Residente"} · {perfil?.rol?.toUpperCase()}</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {TABS.map(tab => (
                  <button key={tab.id} onClick={() => setView(tab.id)} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid", cursor: "pointer", fontSize: 13, fontFamily: "inherit", background: view === tab.id ? "#fff" : "transparent", color: view === tab.id ? "#1E3A8A" : "#93C5FD", borderColor: view === tab.id ? "#fff" : "#3B82F6", fontWeight: view === tab.id ? 700 : 400 }}>
                    {tab.label}{tab.badge > 0 && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 20, padding: "1px 6px", fontSize: 10, marginLeft: 5 }}>{tab.badge}</span>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => { const w = window.open("https://imagenologia.vercel.app/?page=qr", "_blank"); if (!w) window.location.href = "https://imagenologia.vercel.app/?page=qr"; }} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #34D399", cursor: "pointer", fontSize: 12, fontFamily: "inherit", background: "transparent", color: "#34D399", fontWeight: 500 }}>🔳 QR</button>
              <button onClick={onLogout} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #F87171", cursor: "pointer", fontSize: 12, background: "transparent", color: "#FCA5A5", fontFamily: "inherit" }}>Salir</button>
            </div>
          </div>
        )}
      </div>

      <div style={{ maxWidth: 880, margin: "0 auto", padding: "20px 16px" }}>
        {view === "solicitudes" && (
          <>
            {/* Área */}
            <div style={{ ...cx.card, marginBottom: 14 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" }}>Mi área de rotación hoy</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => changeArea("Todas")} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid", cursor: "pointer", fontSize: 13, fontFamily: "inherit", background: area === "Todas" ? "#DBEAFE" : "transparent", color: area === "Todas" ? "#1E40AF" : "#6B7280", borderColor: area === "Todas" ? "#93C5FD" : "#E5E7EB", fontWeight: area === "Todas" ? 600 : 400 }}>Todas</button>
                {AREAS.map(a => (
                  <button key={a} onClick={() => changeArea(a)} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid", cursor: "pointer", fontSize: 13, fontFamily: "inherit", background: area === a ? "#DBEAFE" : "transparent", color: area === a ? "#1E40AF" : "#6B7280", borderColor: area === a ? "#93C5FD" : "#E5E7EB", fontWeight: area === a ? 600 : 400 }}>{a}</button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, marginBottom: 14 }}>
              {[["Hoy",todaySolsFiltered.length,"#111827"],["Pendientes",todaySolsFiltered.filter(s=>s.estado==="pendiente").length,"#92400E"],["Canceladas",todaySolsFiltered.filter(s=>s.estado==="cancelado").length,"#7C2D12"],["Realizados",todaySolsFiltered.filter(s=>s.estado==="realizado").length,"#065F46"]].map(([l,v,c]) => (
                <div key={l} style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: c }}>{v}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B7280" }}>{l}</p>
                </div>
              ))}
            </div>

            {/* Selector de fecha - Jornada 7am-7am */}
            <div style={{ ...cx.card, marginBottom: 14 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" }}>Jornada (7am-7am)</p>
              <input
                type="date"
                value={fechaSolicitudes}
                onChange={e => setFechaSolicitudes(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 14, fontFamily: "inherit", width: "100%", maxWidth: 200 }}
              />
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
              {[
                ["todas","Todas"],
                ["pendiente","Pendientes"],
                ["agendado","Agendadas"],
                ["en_proceso","En proceso"],
                ["reagendado","Re-agendadas"],
                ["postpuesto","Postpuestas"],
                ["realizado","Realizadas"],
                ["denegado","Denegadas"],
                ["expirado","Expiradas"],
                ["cancelado","Canceladas"],
              ].map(([v,l]) => (
                <button key={v} onClick={() => setFiltro(v)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid", cursor: "pointer", fontSize: 12, fontFamily: "inherit", background: filtro===v?"#1E3A8A":"transparent", color: filtro===v?"#fff":"#6B7280", borderColor: filtro===v?"#1E3A8A":"#E5E7EB" }}>{l}</button>
              ))}
            </div>

            {loading ? <p style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>Cargando solicitudes...</p>
            : filtered.length === 0 ? <p style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>No hay solicitudes{filtro !== "todas" ? " con este estado" : ""}.</p>
            : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtered.map(sol => {
                  const E   = ESTADOS_CFG[sol.estado] || ESTADOS_CFG.pendiente;
                  const P   = PRIORIDADES_CFG[sol.prioridad] || PRIORIDADES_CFG.Rutina;
                  const svc = sol.servicio_solicitante === "Otro" ? sol.servicio_otro : sol.servicio_solicitante;
                  return (
                    <div key={sol.id} onClick={() => setSelected(sol)} style={{ ...cx.card, cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{sol.tipo_estudio}{sol.sub_tipo ? ` · ${sol.sub_tipo}` : ""}{sol.protocolo ? ` — ${sol.protocolo}` : ""}</span>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                          <Badge label={sol.prioridad} bg={P.bg} color={P.color} />
                          <Badge label={E.label} bg={E.bg} color={E.color} />
                        </div>
                      </div>
                      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600 }}>{sol.nombre_paciente} · {sol.edad ? `${sol.edad} años` : "—"} · {sol.sexo || "—"}</p>
                      <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#6B7280", flexWrap: "wrap" }}>
                        <span>🏥 {svc}</span>
                        <span>👨‍⚕️ {sol.adscritos?.nombre || <span style={{ color: "#EF4444", fontWeight: 600 }}>Sin adscrito</span>}</span>
                        <span>📞 {sol.nombre_medico}</span>
                        <span>🕐 {toMexicoTime(sol.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
                        {sol.horario_programado && <span>📅 {sol.horario_programado}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
        {view === "censo"        && <CensoView solicitudes={sols} loading={loading} token={token} />}
        {view === "estadisticas" && <EstadisticasView token={token} />}
        {view === "anuncios"     && <AnunciosView token={token} session={session} />}
        {view === "ajustes"      && <AjustesView session={session} />}
      </div>

      {selected && <SolicitudModal sol={selected} adscritos={ads} token={token} onUpdate={load} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Panel Jefe ───────────────────────────────────────────────────────────────
function PanelJefe({ session, onLogout }) {
  const [sols,    setSols]   = useState([]);
  const [loading, setLoading]= useState(true);

  useEffect(() => {
    db.getSolicitudes(session.token).then(d => { setSols(Array.isArray(d) ? d : []); setLoading(false); });
    const t = setInterval(() => db.getSolicitudes(session.token).then(d => setSols(Array.isArray(d) ? d : [])), 30000);
    return () => clearInterval(t);
  }, [session.token]);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <div style={{ background: "#1E3A8A", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🩻</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#fff" }}>Imagenología — Censo</p>
            <p style={{ margin: 0, fontSize: 12, color: "#93C5FD" }}>{session.perfil?.nombre || "Jefe de Servicio"}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #F87171", cursor: "pointer", fontSize: 12, background: "transparent", color: "#FCA5A5", fontFamily: "inherit" }}>Salir</button>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "20px 16px" }}>
        <CensoView solicitudes={sols} loading={loading} />
      </div>
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session,  setSession]  = useState(null);
  const [checking, setChecking] = useState(false);
  const page = new URLSearchParams(window.location.search).get("page");

  // Restore session from localStorage on load
  useEffect(() => {
    try {
      const saved = localStorage.getItem("img_session");
      if (!saved) return;
      const s = JSON.parse(saved);
      setChecking(true);
      db.getPerfil(s.uid, s.token).then(perfil => {
        if (perfil) setSession({ ...s, perfil });
        else localStorage.removeItem("img_session");
        setChecking(false);
      }).catch(() => setChecking(false));
    } catch { setChecking(false); }
  }, []);

  function handleLogin(s) {
    localStorage.setItem("img_session", JSON.stringify(s));
    setSession(s);
  }
  function handleLogout() {
    localStorage.removeItem("img_session");
    setSession(null);
  }
  function handlePerfilDone(p) {
    const s = { ...session, perfil: p };
    localStorage.setItem("img_session", JSON.stringify(s));
    setSession(s);
  }

  if (page === "form") return <SolicitudForm />;
  if (page === "qr")   return <QRScreen />;

  if (checking) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F0F7FF" }}>
      <p style={{ color: "#6B7280", fontSize: 15 }}>Verificando sesión...</p>
    </div>
  );

  if (!session) return <LoginScreen onLogin={handleLogin} />;
  if (!session.perfil) return <SetupPerfil uid={session.uid} token={session.token} onDone={handlePerfilDone} />;
  if (session.perfil.rol === "jefe") return <PanelJefe session={session} onLogout={handleLogout} />;
  return <PanelResidente session={session} onLogout={handleLogout} />;
}
