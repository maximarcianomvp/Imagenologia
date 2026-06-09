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
  async saveGuardiasHistorial(fecha, residentes, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/guardias_historial`, {
      method: "POST",
      headers: { ...hdr(tok), Prefer: "return=representation" },
      body: JSON.stringify({ fecha, residentes }),
    });
    return r.json();
  },
  async getGuardiasHistorial(fecha, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/guardias_historial?fecha=eq.${fecha}`, {
      headers: hdr(tok),
    });
    const data = await r.json();
    return Array.isArray(data) ? data[0] : null;
  },
  async generateQRToken(residenteId, residenteNombre, tok) {
    const token = `${residenteId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tokens_qr`, {
      method: "POST",
      headers: { ...hdr(tok), Prefer: "return=representation" },
      body: JSON.stringify({ token, residente_id: residenteId, residente_nombre: residenteNombre, activo: true }),
    });
    return r.json();
  },
  async getQRTokensForResident(residenteId, tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/tokens_qr?residente_id=eq.${residenteId}&activo=eq.true`, {
      headers: hdr(tok),
    });
    return await r.json();
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
              {sol.tipo_estudio?.toUpperCase()}{sol.sub_tipo ? ` — ${sol.sub_tipo}` : ""}
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
          <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 15 }}>{sol.nombre_paciente?.toUpperCase()}</p>
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
function CensoView({ solicitudes, loading, token, onSelectSolicitud, adscritos, perfiles }) {
  const [fecha, setFecha] = useState(() => {
    const now = toMexicoTime(new Date());
    const hour = now.getHours();
    let shiftDate = new Date(now);
    if (hour < 7) {
      shiftDate.setDate(shiftDate.getDate() - 1);
    }
    return `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, "0")}-${String(shiftDate.getDate()).padStart(2, "0")}`;
  });
  const [perfs, setPerfs] = useState(perfiles || []);
  const [guardiasHistorial, setGuardiasHistorial] = useState(null);

  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      db.getPerfiles(token).then(d => setPerfs(Array.isArray(d) ? d : [])).catch(e => console.error("Error cargando perfiles:", e));
    }, 10000);
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    if (!token || !fecha) return;
    db.getGuardiasHistorial(fecha, token)
      .then(data => setGuardiasHistorial(data))
      .catch(e => console.error("Error cargando historial:", e));
  }, [fecha, token]);

  if (loading) return <div style={{ padding: "20px" }}>Cargando censo...</div>;

  const { startISO, endISO } = getJornadaRange(fecha);
  const list = (Array.isArray(solicitudes) ? solicitudes : []).filter(s => {
    if (!s.created_at) return false;
    const sTime = new Date(s.created_at);
    return sTime >= new Date(startISO) && sTime < new Date(endISO);
  });

  // Agrupar por turno → servicio → adscrito
  const groupedByTurnoServicio = {};
  let rowNum = 1;

  list.forEach(sol => {
    const adscritoObj = Array.isArray(adscritos) ? adscritos.find(a => a.id === sol.adscrito_id) : null;
    const turno = adscritoObj?.turno_actual || "Sin asignar";
    const doctor = adscritoObj?.nombre || "Sin adscrito";
    const servicio = sol.servicio_solicitante || sol.servicio_otro || "Otro";

    if (!groupedByTurnoServicio[turno]) groupedByTurnoServicio[turno] = {};
    if (!groupedByTurnoServicio[turno][servicio]) groupedByTurnoServicio[turno][servicio] = {};
    if (!groupedByTurnoServicio[turno][servicio][doctor]) groupedByTurnoServicio[turno][servicio][doctor] = [];
    
    sol.rowNum = rowNum++;
    groupedByTurnoServicio[turno][servicio][doctor].push(sol);
  });

  const guardias = guardiasHistorial?.residentes || (Array.isArray(perfs) ? perfs.filter(p => p.en_guardia) : []);
  const turnoOrder = ["Matutino", "Vespertino", "Nocturno", "Dia jornada acumulada", "Jornada acumulada", "Festivo dia", "Festivo noche"];
  const turnosPresentes = turnoOrder.filter(t => groupedByTurnoServicio[t]);

  return (
    <div style={{ padding: "20px", maxWidth: 1600, margin: "0 auto", background: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header Principal */}
      <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "3px solid #1E40AF", paddingBottom: "15px" }}>
        <h2 style={{ margin: "0 0 5px", color: "#1E40AF", fontSize: "24px", fontWeight: "bold" }}>IMAGENOLOGÍA</h2>
        <p style={{ margin: "5px 0", color: "#64748B", fontSize: "13px" }}>Hospital General de Tampico "Dr. Carlos Canseco"</p>
        <p style={{ margin: "5px 0", color: "#64748B", fontSize: "12px" }}>
          Jornada: {fecha} 7:00 AM → {new Date(new Date(fecha).getTime() + 86400000).toISOString().split('T')[0]} 7:00 AM
        </p>
      </div>

      {/* Selector de Fecha */}
      <div style={{ marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center", justifyContent: "center" }}>
        <label style={{ fontWeight: "600", fontSize: "13px", color: "#475569" }}>Selecciona fecha:</label>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #CBD5E1", fontSize: "13px", fontFamily: "inherit" }}
        />
      </div>

      {/* Guardias */}
      {guardias.length > 0 && (
        <div style={{ background: "linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)", padding: "16px 20px", borderRadius: "8px", marginBottom: "25px", border: "2px solid #FCD34D", boxShadow: "0 2px 4px rgba(251, 146, 60, 0.1)" }}>
          <p style={{ margin: "0 0 10px 0", fontWeight: "700", color: "#92400E", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            🛡️ GUARDIA: {guardias.map(g => g.nombre).join(", ")} {guardiasHistorial ? "📋 (Registrado)" : "🔴 (En vivo)"}
          </p>
          {!guardiasHistorial && (
            <button
              onClick={() => {
                const residentes = guardias.map(g => ({ id: g.id, nombre: g.nombre }));
                const msg = `¿Registrar que ${residentes.map(r => r.nombre).join(", ")} estuvo${residentes.length > 1 ? "n" : ""} de guardia el ${fecha}?`;
                if (confirm(msg)) {
                  db.saveGuardiasHistorial(fecha, residentes, token)
                    .then(() => {
                      alert("✓ Guardia registrada correctamente");
                      setGuardiasHistorial({ residentes });
                    })
                    .catch(err => alert("Error al registrar: " + err.message));
                }
              }}
              style={{
                padding: "8px 14px",
                background: "#F59E0B",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "11px"
              }}
            >
              💾 Registrar
            </button>
          )}
        </div>
      )}

      {/* Turnos */}
      {turnosPresentes.map((turno, turnoIdx) => (
        <div key={turno} style={{ marginBottom: "30px" }}>
          {/* Header Turno */}
          <div style={{ background: "#1E40AF", color: "white", padding: "12px 20px", borderRadius: "6px 6px 0 0", fontWeight: "bold", fontSize: "14px", marginBottom: "0px" }}>
            🕐 TURNO: {turno.toUpperCase()}
          </div>

          {/* Servicios dentro del turno */}
          {Object.entries(groupedByTurnoServicio[turno]).map(([servicio, doctoresObj], servIdx) => (
            <div key={servicio} style={{ border: "1px solid #CBD5E1", borderTop: servIdx === 0 ? "1px solid #CBD5E1" : "none", background: "#FFF" }}>
              {/* Header Servicio */}
              <div style={{ background: "#E0E7FF", padding: "10px 20px", fontWeight: "bold", fontSize: "12px", color: "#3730A3", borderBottom: "1px solid #CBD5E1" }}>
                🏥 {servicio}
              </div>

              {/* Adscritos dentro del servicio */}
              {Object.entries(doctoresObj).map(([doctor, estudios], docIdx) => (
                <div key={doctor}>
                  {/* Header Adscrito */}
                  <div style={{ background: "#F1F5F9", padding: "8px 20px", fontWeight: "600", fontSize: "12px", color: "#1E293B", borderBottom: "1px solid #E2E8F0", paddingLeft: "40px" }}>
                    👨‍⚕️ {doctor} ({estudios.length})
                  </div>

                  {/* Tabla de estudios */}
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
                    <thead style={{ display: docIdx === 0 && servIdx === 0 ? "table-header-group" : "none" }}>
                      <tr style={{ background: "#374151", color: "white" }}>
                        <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: "bold", width: "40px", borderRight: "1px solid #1F2937" }}>No</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Paciente</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: "bold", width: "50px", borderRight: "1px solid #1F2937" }}>Sexo</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: "bold", width: "50px", borderRight: "1px solid #1F2937" }}>Edad</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Servicio</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Diagnóstico</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Estudio</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Protocolo</th>
                        <th style={{ padding: "10px 12px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Estatus</th>
                        <th style={{ padding: "10px 12px", textAlign: "left", fontWeight: "bold" }}>Hallazgos</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudios.map((sol, idx) => (
                        <tr
                          key={sol.id}
                          onClick={() => onSelectSolicitud(sol)}
                          style={{
                            background: idx % 2 === 0 ? "#FAFBFC" : "#FFF",
                            cursor: "pointer",
                            borderBottom: "1px solid #E2E8F0",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#DBEAFE"}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#FAFBFC" : "#FFF"}
                        >
                          <td style={{ padding: "8px 12px", textAlign: "center", fontWeight: "600", color: "#475569", borderRight: "1px solid #E2E8F0" }}>{sol.rowNum}</td>
                          <td style={{ padding: "8px 12px", textAlign: "left", fontWeight: "600", color: "#1E40AF", borderRight: "1px solid #E2E8F0" }}>{sol.nombre_paciente?.toUpperCase()}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", color: "#4B5563", borderRight: "1px solid #E2E8F0" }}>{sol.sexo || "-"}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", color: "#4B5563", borderRight: "1px solid #E2E8F0" }}>{sol.edad || "-"}</td>
                          <td style={{ padding: "8px 12px", textAlign: "left", color: "#4B5563", borderRight: "1px solid #E2E8F0", fontSize: "10px" }}>{(sol.servicio_solicitante || sol.servicio_otro || "-").toUpperCase()}</td>
                          <td style={{ padding: "8px 12px", textAlign: "left", color: "#4B5563", borderRight: "1px solid #E2E8F0", fontSize: "10px" }}>{(sol.motivo_clinico || "-").toUpperCase()}</td>
                          <td style={{ padding: "8px 12px", textAlign: "left", color: "#4B5563", borderRight: "1px solid #E2E8F0", fontSize: "10px" }}>{sol.tipo_estudio?.toUpperCase()}</td>
                          <td style={{ padding: "8px 12px", textAlign: "left", color: "#4B5563", borderRight: "1px solid #E2E8F0" }}>{(sol.protocolo || "-").toUpperCase()}</td>
                          <td style={{ padding: "8px 12px", textAlign: "center", color: "#4B5563", borderRight: "1px solid #E2E8F0", fontSize: "9px" }}>
                            <span style={{ background: ESTADOS_CFG[sol.estado]?.bg || "#E5E7EB", color: ESTADOS_CFG[sol.estado]?.color || "#374151", padding: "2px 6px", borderRadius: 3, fontSize: "8px", fontWeight: 600 }}>
                              {ESTADOS_CFG[sol.estado]?.label || sol.estado}
                            </span>
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "left", color: "#4B5563", fontSize: "10px" }}>
                            {sol.hallazgos ? sol.hallazgos.substring(0, 35) + (sol.hallazgos.length > 35 ? "..." : "") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}

      {groupedByTurnoServicio["Sin asignar"] && Object.keys(groupedByTurnoServicio["Sin asignar"]).length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          <div style={{ background: "#DC2626", color: "white", padding: "12px 20px", borderRadius: "6px 6px 0 0", fontWeight: "bold", fontSize: "14px", marginBottom: "0px" }}>
            ⚠️ TURNO: SIN ASIGNAR (Pendiente de asignación)
          </div>
          {Object.entries(groupedByTurnoServicio["Sin asignar"]).map(([servicio, doctoresObj]) => (
            <div key={servicio}>
              <div style={{ background: "#FEE2E2", padding: "10px 20px", fontWeight: "bold", fontSize: "12px", color: "#991B1B", borderBottom: "1px solid #CBD5E1" }}>
                🏥 {servicio}
              </div>
              {Object.entries(doctoresObj).map(([doctor, estudios]) => (
                <div key={doctor}>
                  <div style={{ background: "#FEF2F2", padding: "8px 20px", fontWeight: "600", fontSize: "12px", color: "#7F1D1D", borderBottom: "1px solid #E2E8F0", paddingLeft: "40px" }}>
                    👤 {doctor} ({estudios.length})
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", tableLayout: "auto" }}>
                    <colgroup>
                      <col style={{ width: "5%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "7%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "10%" }} />
                      <col style={{ width: "8%" }} />
                      <col style={{ width: "8%" }} />
                    </colgroup>
                    <thead>
                      <tr style={{ background: "#374151", color: "white" }}>
                        <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>No</th>
                        <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Paciente</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Sexo</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Edad</th>
                        <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Servicio</th>
                        <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Diagnóstico</th>
                        <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Estudio</th>
                        <th style={{ padding: "10px 8px", textAlign: "left", fontWeight: "bold", borderRight: "1px solid #1F2937" }}>Protocolo</th>
                        <th style={{ padding: "10px 8px", textAlign: "center", fontWeight: "bold" }}>Estatus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estudios.map((sol, idx) => (
                        <tr
                          key={sol.id}
                          onClick={() => onSelectSolicitud(sol)}
                          style={{
                            background: idx % 2 === 0 ? "#FAFBFC" : "#FFF",
                            cursor: "pointer",
                            borderBottom: "1px solid #E2E8F0",
                            transition: "background 0.2s"
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = "#DBEAFE"}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? "#FAFBFC" : "#FFF"}
                        >
                          <td style={{ padding: "8px 8px", textAlign: "center", fontWeight: "600", color: "#475569", borderRight: "1px solid #E2E8F0" }}>{idx + 1}</td>
                          <td style={{ padding: "8px 8px", textAlign: "left", fontWeight: "600", color: "#1E40AF", borderRight: "1px solid #E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sol.nombre_paciente?.toUpperCase()}</td>
                          <td style={{ padding: "8px 8px", textAlign: "center", color: "#4B5563", borderRight: "1px solid #E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sol.sexo?.charAt(0).toUpperCase() || "-"}</td>
                          <td style={{ padding: "8px 8px", textAlign: "center", color: "#4B5563", borderRight: "1px solid #E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sol.edad || "-"}</td>
                          <td style={{ padding: "8px 8px", textAlign: "left", color: "#4B5563", borderRight: "1px solid #E2E8F0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(sol.servicio_solicitante || sol.servicio_otro || "-").toUpperCase()}</td>
                          <td style={{ padding: "8px 8px", textAlign: "left", color: "#4B5563", borderRight: "1px solid #E2E8F0", overflow: "hidden", textOverflow: "ellipsis" }}>{(sol.motivo_clinico || "-").toUpperCase()}</td>
                          <td style={{ padding: "8px 8px", textAlign: "left", color: "#4B5563", borderRight: "1px solid #E2E8F0", overflow: "hidden", textOverflow: "ellipsis" }}>{sol.tipo_estudio?.toUpperCase()}</td>
                          <td style={{ padding: "8px 8px", textAlign: "left", color: "#4B5563", borderRight: "1px solid #E2E8F0" }}>{(sol.protocolo || "-").toUpperCase()}</td>
                          <td style={{ padding: "8px 8px", textAlign: "center", color: "#4B5563" }}>
                            <span style={{ background: ESTADOS_CFG[sol.estado]?.bg || "#E5E7EB", color: ESTADOS_CFG[sol.estado]?.color || "#374151", padding: "2px 6px", borderRadius: 3, fontSize: "8px", fontWeight: 600 }}>
                              {ESTADOS_CFG[sol.estado]?.label || sol.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {turnosPresentes.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748B", fontSize: "14px" }}>
          No hay solicitudes para esta fecha
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

      {/* Formulario para admin */}
      {session?.perfil?.rol === "admin" && (
        <div style={{ ...cx.card, background: "linear-gradient(135deg, #F0F9FF 0%, #F8FAFC 100%)", marginBottom: 24, border: "2px solid #1E40AF" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: 16, fontWeight: 700, color: "#1E3A8A" }}>✏️ Publicar Anuncio</h3>
          <AnunciosUpload token={token} perfil={session.perfil} onSuccess={loadAnuncios} />
        </div>
      )}

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
function AnunciosUpload({ token, perfil, onSuccess }) {
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
      if (onSuccess) {
        setTimeout(onSuccess, 500);
      } else {
        setTimeout(() => window.location.reload(), 1500);
      }
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

// ─── Solicitud Emergencia Form ────────────────────────────────────────────────
function SolicitudEmergenciaForm({ token, perfil, adscritos, onSuccess }) {
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edad, setEdad] = useState("");
  const [tipoEstudio, setTipoEstudio] = useState("Ultrasonido");
  const [subTipo, setSubTipo] = useState("");
  const [servicio, setServicio] = useState("Medicina Interna");
  const [servicioOtro, setServicioOtro] = useState("");
  const [hallazgos, setHallazgos] = useState("");
  const [mipSolicitante, setMipSolicitante] = useState("");
  const [adscritoSeleccionado, setAdscritoSeleccionado] = useState("");
  const [fechaRegistro, setFechaRegistro] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });
  const [horaRegistro, setHoraRegistro] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  });
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
    if (!adscritoSeleccionado) {
      setMsg({ type: "error", text: "Debe seleccionar un adscrito" });
      return;
    }

    setSaving(true);
    try {
      const adscritoObj = adscritos.find(a => a.id === parseInt(adscritoSeleccionado));
      // Crear timestamp con la fecha y hora ingresadas
      const createdAtString = `${fechaRegistro}T${horaRegistro}:00`;
      const createdAt = new Date(createdAtString).toISOString();
      
      const newSolicitud = {
        nombre_paciente: toTitleCase(nombrePaciente.trim()),
        tipo_estudio: tipoEstudio,
        sub_tipo: subTipo ? toTitleCase(subTipo) : null,
        edad: parseInt(edad),
        hallazgos: hallazgos.trim() || null,
        servicio_solicitante: servicio,
        servicio_otro: servicio === "Otro" ? servicioOtro.trim() : null,
        prioridad: "Urgencia",
        estado: "realizado",
        es_emergencia: false,
        adscrito_id: parseInt(adscritoSeleccionado),
        nombre_medico: adscritoObj?.nombre || "—",
        mip_solicitante: mipSolicitante.trim() ? toTitleCase(mipSolicitante.trim()) : null,
        creatinina: null,
        horario_programado: null,
        notas: "Solicitud rápida",
        sexo: null,
        motivo_clinico: null,
        nss_expediente: null,
        protocolo: null,
        ubicacion_paciente: null,
        created_at: createdAt,
      };

      await db.createSolicitud(newSolicitud, token);
      setMsg({ type: "success", text: "Solicitud registrada ✓" });
      setNombrePaciente("");
      setEdad("");
      setSubTipo("");
      setServicio("Medicina Interna");
      setHallazgos("");
      setMipSolicitante("");
      setAdscritoSeleccionado("");
      const today = new Date();
      setFechaRegistro(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`);
      setHoraRegistro(`${String(today.getHours()).padStart(2, "0")}:${String(today.getMinutes()).padStart(2, "0")}`);
      if (onSuccess) {
        setTimeout(onSuccess, 500);
      } else {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      console.error("Error:", err);
      setMsg({ type: "error", text: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <FG label="Adscrito responsable" required>
        <select value={adscritoSeleccionado} onChange={e => setAdscritoSeleccionado(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }}>
          <option value="">— Seleccionar adscrito —</option>
          {Array.isArray(adscritos) && adscritos.map(a => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </FG>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <FG label="Fecha de registro" required>
          <input type="date" value={fechaRegistro} onChange={e => setFechaRegistro(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
        </FG>
        <FG label="Hora de registro" required>
          <input type="time" value={horaRegistro} onChange={e => setHoraRegistro(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
        </FG>
      </div>

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
            <option>Ultrasonido</option>
            <option>Tomografía</option>
            <option>Mama</option>
            <option>Obstétrico</option>
            <option>Ginecológico</option>
          </select>
        </FG>
        <FG label="Sub-tipo" optional>
          <input type="text" value={subTipo} onChange={e => setSubTipo(e.target.value)} placeholder="Especificación" style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
        </FG>
      </div>

      <FG label="Servicio solicitante" required>
        <select value={servicio} onChange={e => setServicio(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }}>
          {SERVICIOS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FG>

      {servicio === "Otro" && (
        <FG label="Especificar servicio" required>
          <input type="text" value={servicioOtro} onChange={e => setServicioOtro(e.target.value)} placeholder="Nombre del servicio" style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
        </FG>
      )}

      <FG label="Hallazgos" optional>
        <textarea value={hallazgos} onChange={e => setHallazgos(e.target.value)} placeholder="Descripción de hallazgos encontrados" rows={3} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%", resize: "none" }} />
      </FG>

      <FG label="MIP/Residente solicitante" optional>
        <input type="text" value={mipSolicitante} onChange={e => setMipSolicitante(e.target.value)} placeholder="Nombre del MIP o residente que solicita" style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
      </FG>

      {msg && (
        <div style={{ padding: "10px 12px", borderRadius: 6, background: msg.type === "error" ? "#FEE2E2" : "#DCFCE7", color: msg.type === "error" ? "#DC2626" : "#16A34A", fontSize: 13, fontWeight: 500 }}>
          {msg.text}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        style={{ padding: "10px 16px", borderRadius: 6, border: "none", background: "#DC2626", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}
      >
        {saving ? "Guardando..." : "🏥 Registrar hospitalizado"}
      </button>
    </form>
  );
}

// ─── Consulta Externa Form ────────────────────────────────────────────────────
function ConsultaExternaForm({ token, perfil, adscritos, onSuccess }) {
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edad, setEdad] = useState("");
  const [tipoEstudio, setTipoEstudio] = useState("Mama");
  const [subTipo, setSubTipo] = useState("");
  const [hallazgos, setHallazgos] = useState("");
  const [adscritoId, setAdscritoId] = useState(perfil?.id || "");
  const [servicio, setServicio] = useState("Ginecología y Obstetricia");
  const [servicioOtro, setServicioOtro] = useState("");
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
        servicio_solicitante: servicio,
        servicio_otro: servicio === "Otro" ? servicioOtro.trim() : null,
        prioridad: "Rutina",
        estado: "realizado",
        es_consulta_externa: true,
        adscrito_id: adscritoId,
        nombre_medico: perfil?.nombre,
        creatinina: null,
        horario_programado: null,
        notas: "Consulta externa",
        sexo: null,
        motivo_clinico: null,
        nss_expediente: null,
        protocolo: null,
        ubicacion_paciente: null,
      };

      await db.createSolicitud(newSolicitud, token);
      setMsg({ type: "success", text: "Consulta externa registrada ✓" });
      setNombrePaciente("");
      setEdad("");
      setSubTipo("");
      setHallazgos("");
      if (onSuccess) {
        setTimeout(onSuccess, 500);
      } else {
        setTimeout(() => window.location.reload(), 1500);
      }
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

      <FG label="Servicio solicitante" required>
        <select value={servicio} onChange={e => setServicio(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }}>
          {SERVICIOS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </FG>

      {servicio === "Otro" && (
        <FG label="Especificar servicio" required>
          <input type="text" value={servicioOtro} onChange={e => setServicioOtro(e.target.value)} placeholder="Nombre del servicio" style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }} />
        </FG>
      )}

      <FG label="Adscrito a cargo" optional>
        <select value={adscritoId} onChange={e => setAdscritoId(e.target.value)} style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #D1D5DB", fontSize: 14, fontFamily: "inherit", width: "100%" }}>
          <option value="">-- Selecciona adscrito --</option>
          {Array.isArray(adscritos) && adscritos.filter(a => a.activo).map(a => (
            <option key={a.id} value={a.id}>{a.nombre}</option>
          ))}
        </select>
      </FG>

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
  const [qrTokens, setQrTokens] = useState([]);
  const [generatingQR, setGeneratingQR] = useState(false);

  useEffect(() => {
    db.getPerfiles(token).then(d => setPerfiles(Array.isArray(d) ? d : []));
  }, [token]);

  useEffect(() => {
    db.getAdscritos(token).then(d => setAdscritos(Array.isArray(d) ? d : []));
  }, [token]);

  useEffect(() => {
    if (!token || !perfil?.id) return;
    db.getQRTokensForResident(perfil.id, token)
      .then(d => setQrTokens(Array.isArray(d) ? d : []))
      .catch(e => console.error("Error loading QR tokens:", e));
  }, [token, perfil]);

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

  async function generateNewQR() {
    setGeneratingQR(true);
    try {
      const newToken = await db.generateQRToken(perfil.id, perfil.nombre, token);
      if (newToken?.id) {
        setQrTokens(prev => [...prev, newToken]);
        setMsg({ type: "success", text: "✓ QR generado correctamente" });
      } else {
        setMsg({ type: "error", text: "Error al generar QR. Intenta de nuevo." });
      }
    } catch (err) {
      console.error("Error:", err);
      setMsg({ type: "error", text: "Error al generar QR. Intenta de nuevo." });
    }
    setGeneratingQR(false);
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

      {/* Generar QR Personal (solo para residentes) */}
      {["r1", "r3", "r4"].includes(perfil?.rol) && (
        <div style={cx.card}>
          <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.06em" }}>📱 QR Personal para solicitudes</p>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#6B7280" }}>Genera un código QR único que puedas compartir para recibir solicitudes simultáneamente en diferentes servicios.</p>
          
          <button
            onClick={generateNewQR}
            disabled={generatingQR}
            style={{
              padding: "10px 20px",
              background: "#7C3AED",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "13px",
              marginBottom: "20px",
              opacity: generatingQR ? 0.6 : 1
            }}
          >
            {generatingQR ? "Generando..." : "🔄 Generar nuevo QR"}
          </button>

          {qrTokens.length > 0 && (
            <div style={{ marginTop: "20px" }}>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Mis códigos QR activos ({qrTokens.length}):</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {qrTokens.map(qr => {
                  const baseUrl = "https://imagenologia.vercel.app";
                  const qrUrl = `${baseUrl}/form?qr=${qr.token}`;
                  return (
                    <div key={qr.id} style={{ padding: "12px", borderRadius: "8px", background: "#EDE9FE", border: "1px solid #C4B5FD", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: "11px", color: "#5B21B6", fontFamily: "monospace", wordBreak: "break-all", flex: 1 }}>
                        {qrUrl}
                      </div>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(qrUrl);
                          alert("✓ Enlace copiado al portapapeles");
                        }}
                        style={{
                          padding: "6px 12px",
                          background: "#7C3AED",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600",
                          marginLeft: "10px",
                          whiteSpace: "nowrap"
                        }}
                      >
                        📋 Copiar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
  const [perfs,    setPerfs]   = useState([]);
  const [selected, setSelected]= useState(null);
  const [fechaSolicitudes, setFechaSolicitudes] = useState(() => {
    const now = toMexicoTime(new Date());
    const hour = now.getHours();
    
    // Si es antes de las 7am, mostrar jornada del día anterior
    // Si es 7am o después, mostrar jornada del día actual
    let shiftDate = new Date(now);
    if (hour < 7) {
      shiftDate.setDate(shiftDate.getDate() - 1);
    }
    
    return `${shiftDate.getFullYear()}-${String(shiftDate.getMonth() + 1).padStart(2, "0")}-${String(shiftDate.getDate()).padStart(2, "0")}`;
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
    const [s, a, p] = await Promise.all([
      db.getSolicitudes(token),
      db.getAdscritos(token),
      db.getPerfiles(token)
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
    setPerfs(Array.isArray(p) ? p : []);
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
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{sol.tipo_estudio?.toUpperCase()}{sol.sub_tipo ? ` · ${sol.sub_tipo}` : ""}{sol.protocolo ? ` — ${sol.protocolo}` : ""}</span>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                          <Badge label={sol.prioridad} bg={P.bg} color={P.color} />
                          <Badge label={E.label} bg={E.bg} color={E.color} />
                        </div>
                      </div>
                      <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600 }}>{sol.nombre_paciente?.toUpperCase()} · {sol.edad ? `${sol.edad} años` : "—"} · {sol.sexo || "—"}</p>
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
            
            {/* Solicitud de Emergencia */}
            <div style={{ ...cx.card, marginTop: 20 }}>
              <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.06em" }}>🏥 Registrar Paciente Hospitalizado</p>
              <SolicitudEmergenciaForm token={token} perfil={perfil} adscritos={ads} onSuccess={load} />
            </div>

            {/* Consulta Externa */}
            <div style={{ ...cx.card, marginTop: 20 }}>
              <p style={{ margin: "0 0 16px", fontSize: 13, fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.06em" }}>👩‍⚕️ Crear Consulta Externa</p>
              <ConsultaExternaForm token={token} perfil={perfil} adscritos={ads} onSuccess={load} />
            </div>
          </>
        )}
        {view === "censo"        && <CensoView solicitudes={sols} loading={loading} token={token} onSelectSolicitud={setSelected} adscritos={ads} perfiles={perfs} />}
        {view === "estadisticas" && <EstadisticasView token={token} />}
        {view === "anuncios"     && <AnunciosView token={token} session={session} />}
        {view === "ajustes"      && <AjustesView session={session} />}
      </div>

      {selected && <SolicitudModal sol={selected} adscritos={ads} token={token} onUpdate={load} onClose={() => setSelected(null)} />}
    </div>
  );
}

// ─── Panel Supervisor ─────────────────────────────────────────────────────────
function PanelSupervisor({ session, onLogout }) {
  const { uid, token, perfil } = session;
  const [sols, setSols] = useState([]);
  const [ads, setAds] = useState([]);
  const [perfs, setPerfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("censo");

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, p] = await Promise.all([
          db.getSolicitudes(token),
          db.getAdscritos(token),
          db.getPerfiles(token)
        ]);
        setSols(Array.isArray(s) ? s : []);
        setAds(Array.isArray(a) ? a.filter(x => x.activo) : []);
        setPerfs(Array.isArray(p) ? p : []);
      } catch (err) {
        console.error("Error loading:", err);
      }
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const tabs = [
    { id: "censo", label: "📊 Censo" },
    { id: "anuncios", label: "📌 Anuncios" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>
      <div style={{ background: "#1E3A8A", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🩻</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#fff" }}>Imagenología — Supervisor</p>
            <p style={{ margin: 0, fontSize: 12, color: "#93C5FD" }}>{perfil?.nombre || "Supervisor"}</p>
          </div>
        </div>
        <button onClick={onLogout} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #F87171", cursor: "pointer", fontSize: 12, background: "transparent", color: "#FCA5A5", fontFamily: "inherit", fontWeight: 600 }}>Salir</button>
      </div>

      {/* Tabs */}
      <div style={{ background: "#fff", borderBottom: "2px solid #E5E7EB", display: "flex", gap: 0, padding: "0 20px" }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              padding: "14px 20px",
              background: view === tab.id ? "#1E40AF" : "transparent",
              color: view === tab.id ? "#fff" : "#6B7280",
              border: "none",
              cursor: "pointer",
              fontWeight: view === tab.id ? "600" : "500",
              fontSize: "14px",
              borderBottom: view === tab.id ? "3px solid #1E40AF" : "none",
              fontFamily: "inherit"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "20px" }}>
        {view === "censo" && <CensoView solicitudes={sols} loading={loading} token={token} onSelectSolicitud={() => {}} adscritos={ads} perfiles={perfs} />}
        {view === "anuncios" && <AnunciosView token={token} session={session} />}
      </div>
    </div>
  );
}

// ─── Panel Jefe ───────────────────────────────────────────────────────────────
function PanelJefe({ session, onLogout }) {
  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", padding: "20px" }}>
      <h1>🩻 Panel Jefe</h1>
      <p>Sesión de: {session.perfil?.nombre || "Desconocido"}</p>
      <button onClick={onLogout} style={{ padding: "10px 20px", background: "#EF4444", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Salir</button>
      <hr />
      <p>📊 Censo - En construcción</p>
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

  console.log("App render - session:", session, "checking:", checking, "page:", page);

  if (page === "form") return <SolicitudForm />;
  if (page === "qr")   return <QRScreen />;

  if (checking) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F0F7FF" }}>
      <p style={{ color: "#6B7280", fontSize: 15 }}>Verificando sesión...</p>
    </div>
  );

  if (!session) return <LoginScreen onLogin={handleLogin} />;
  if (!session.perfil) return <SetupPerfil uid={session.uid} token={session.token} onDone={handlePerfilDone} />;
  
  console.log("User rol:", session.perfil?.rol);
  
  if (session.perfil.rol === "supervisor") {
    console.log("Rendering PanelSupervisor");
    return <PanelSupervisor session={session} onLogout={handleLogout} />;
  }

  if (session.perfil.rol === "jefe") {
    console.log("Rendering PanelJefe");
    return <PanelJefe session={session} onLogout={handleLogout} />;
  }
  
  console.log("Rendering PanelResidente");
  return <PanelResidente session={session} onLogout={handleLogout} />;
}
