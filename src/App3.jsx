import { useState, useEffect, useCallback } from "react";

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
  async getAdscritos(tok) {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/adscritos?activo=eq.true&order=nombre`, { headers: hdr(tok) });
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
};

// ─── Constantes ───────────────────────────────────────────────────────────────
const AREAS = ["Ultrasonido", "Rayos X", "Tomografía", "Resonancia", "Intervencionismo", "General"];

const ESTUDIOS_SUB = {
  "Tomografía (TC)": ["Simple", "Contrastada", "Simple + Contrastada"],
  Ultrasonido: ["General", "Obstétrico", "Ginecológico"],
  Mama: ["Ultrasonido mamario", "Mastografía", "Ambas"],
};

const ESTADOS_CFG = {
  pendiente:  { label: "Pendiente",  bg: "#FEF3C7", color: "#92400E" },
  en_proceso: { label: "En proceso", bg: "#DBEAFE", color: "#1E40AF" },
  realizado:  { label: "Realizado",  bg: "#D1FAE5", color: "#065F46" },
  cancelado:  { label: "Cancelado",  bg: "#FEE2E2", color: "#991B1B" },
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
  const [t, setT]       = useState(new Date());
  const [token, setToken] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i); }, []);

  async function generateToken() {
    setRefreshing(true);
    const tok = await db.createToken();
    setToken(tok?.token || null);
    setRefreshing(false);
  }

  useEffect(() => { generateToken(); }, []);

  // Poll every 3 seconds — if token was used, generate a new one
  useEffect(() => {
    if (!token) return;
    const i = setInterval(async () => {
      const used = await db.checkTokenUsed(token);
      if (used) generateToken();
    }, 3000);
    return () => clearInterval(i);
  }, [token]);

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
      <div style={{ background: "#fff", padding: 20, borderRadius: 20, boxShadow: "0 8px 48px rgba(30,58,138,0.18)", border: "3px solid #BFDBFE", position: "relative" }}>
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
    motivo_clinico: "", nombre_medico: "", telefono: "", ubicacion_paciente: "",
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
      await Promise.all([db.useToken(tokenParam), db.createSolicitud(form)]);
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
        <p style={{ color: "#6B7280", fontSize: 14, margin: "0 0 28px" }}>El servicio de imagenología recibió tu solicitud. Te contactarán en breve para coordinar el traslado de tu paciente.</p>
        <button style={{ ...cx.btnPrimary, width: "auto", padding: "10px 28px" }} onClick={() => { setForm(empty); setDone(false); }}>Nueva solicitud</button>
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
  const [busy, setBusy]        = useState(false);

  async function save() {
    setBusy(true);
    await db.updateSolicitud(sol.id, { nss_expediente: exp, adscrito_id: adscrito || null, estado, horario_programado: horario, notas }, token);
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
                <option value="en_proceso">En proceso</option>
                <option value="realizado">Realizado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </FG>
          </div>
          <FG label="Horario programado" optional>
            <input style={cx.input} value={horario} onChange={e => setHorario(e.target.value)} placeholder="Ej. 11:30 am · Sala 2" />
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

// ─── CensoView (compartida entre Residente y Jefe) ────────────────────────────
function CensoView({ solicitudes, loading }) {
  const hoy  = new Date().toISOString().slice(0, 10);
  const list = solicitudes.filter(s => s.created_at?.startsWith(hoy));
  const cnt  = { total: list.length, pendiente: 0, en_proceso: 0, realizado: 0 };
  list.forEach(s => { if (cnt[s.estado] !== undefined) cnt[s.estado]++; });

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 17, fontWeight: 700 }}>
        Censo del día &mdash; {new Date().toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
        {[["Total", cnt.total, "#111827"], ["Pendientes", cnt.pendiente, "#92400E"], ["En proceso", cnt.en_proceso, "#1E40AF"], ["Realizados", cnt.realizado, "#065F46"]].map(([l, v, c]) => (
          <div key={l} style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", padding: "12px 16px" }}>
            <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: c }}>{v}</p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B7280" }}>{l}</p>
          </div>
        ))}
      </div>

      {loading ? <p style={{ textAlign: "center", color: "#9CA3AF", padding: 32 }}>Cargando...</p> : (
        <div style={{ ...cx.card, padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["#","Paciente","Estudio","Servicio","Adscrito","Horario","Estado"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#6B7280", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", borderBottom: "1px solid #E5E7EB" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#9CA3AF" }}>Sin estudios registrados hoy.</td></tr>
              ) : list.map((sol, i) => {
                const E   = ESTADOS_CFG[sol.estado] || ESTADOS_CFG.pendiente;
                const svc = sol.servicio_solicitante === "Otro" ? sol.servicio_otro : sol.servicio_solicitante;
                return (
                  <tr key={sol.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                    <td style={{ padding: "9px 12px", color: "#9CA3AF" }}>{String(i + 1).padStart(3, "0")}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 600 }}>{sol.nombre_paciente}</td>
                    <td style={{ padding: "9px 12px" }}>{sol.tipo_estudio}{sol.sub_tipo ? ` · ${sol.sub_tipo}` : ""}</td>
                    <td style={{ padding: "9px 12px", color: "#374151" }}>{svc}</td>
                    <td style={{ padding: "9px 12px", color: "#374151" }}>{sol.adscritos?.nombre || <span style={{ color: "#D1D5DB" }}>—</span>}</td>
                    <td style={{ padding: "9px 12px", color: "#374151" }}>{sol.horario_programado || <span style={{ color: "#D1D5DB" }}>—</span>}</td>
                    <td style={{ padding: "9px 12px" }}><Badge label={E.label} bg={E.bg} color={E.color} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Panel Residente ──────────────────────────────────────────────────────────
function PanelResidente({ session, onLogout }) {
  const { uid, token, perfil } = session;
  const [view,     setView]    = useState("solicitudes");
  const [sols,     setSols]    = useState([]);
  const [ads,      setAds]     = useState([]);
  const [selected, setSelected]= useState(null);
  const [loading,  setLoading] = useState(true);
  const [area,     setArea]    = useState(perfil?.area_rotacion || "General");
  const [filtro,   setFiltro]  = useState("todas");

  const load = useCallback(async () => {
    const [s, a] = await Promise.all([db.getSolicitudes(token), db.getAdscritos(token)]);
    setSols(Array.isArray(s) ? s : []);
    setAds(Array.isArray(a) ? a : []);
    setLoading(false);
  }, [token]);

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, [load]);

  async function changeArea(a) {
    setArea(a);
    if (perfil?.id) await db.savePerfil(perfil.id, { area_rotacion: a }, token);
  }

  const hoy      = new Date().toISOString().slice(0, 10);
  const todaySols= sols.filter(s => s.created_at?.startsWith(hoy));
  const pending  = sols.filter(s => s.estado === "pendiente").length;
  const filtered = filtro === "todas" ? sols : sols.filter(s => s.estado === filtro);

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC" }}>

      {/* Header */}
      <div style={{ background: "#1E3A8A", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>🩻</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#fff" }}>Imagenología</p>
            <p style={{ margin: 0, fontSize: 12, color: "#93C5FD" }}>{perfil?.nombre || "Residente"} · {perfil?.rol?.toUpperCase()}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {["solicitudes", "censo"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid", cursor: "pointer", fontSize: 13, fontFamily: "inherit", background: view === v ? "#fff" : "transparent", color: view === v ? "#1E3A8A" : "#93C5FD", borderColor: view === v ? "#fff" : "#3B82F6", fontWeight: view === v ? 600 : 400, textTransform: "capitalize" }}>
              {v}{v === "solicitudes" && pending > 0 && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 10, marginLeft: 6 }}>{pending}</span>}
            </button>
          ))}
          <button onClick={onLogout} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #F87171", cursor: "pointer", fontSize: 12, background: "transparent", color: "#FCA5A5", fontFamily: "inherit" }}>Salir</button>
        </div>
      </div>

      <div style={{ maxWidth: 820, margin: "0 auto", padding: "20px 16px" }}>

        {view === "solicitudes" && (
          <>
            {/* Área */}
            <div style={{ ...cx.card, marginBottom: 14 }}>
              <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#9CA3AF", letterSpacing: "0.08em", textTransform: "uppercase" }}>Mi área de rotación hoy</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {AREAS.map(a => (
                  <button key={a} onClick={() => changeArea(a)} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid", cursor: "pointer", fontSize: 13, fontFamily: "inherit", background: area === a ? "#DBEAFE" : "transparent", color: area === a ? "#1E40AF" : "#6B7280", borderColor: area === a ? "#93C5FD" : "#E5E7EB", fontWeight: area === a ? 600 : 400 }}>{a}</button>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 14 }}>
              {[["Hoy", todaySols.length, "#111827"], ["Pendientes", todaySols.filter(s=>s.estado==="pendiente").length, "#92400E"], ["En proceso", todaySols.filter(s=>s.estado==="en_proceso").length, "#1E40AF"], ["Realizados", todaySols.filter(s=>s.estado==="realizado").length, "#065F46"]].map(([l,v,c]) => (
                <div key={l} style={{ background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", padding: "10px 14px" }}>
                  <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: c }}>{v}</p>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#6B7280" }}>{l}</p>
                </div>
              ))}
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[["todas","Todas"],["pendiente","Pendientes"],["en_proceso","En proceso"],["realizado","Realizadas"],["cancelado","Canceladas"]].map(([v,l]) => (
                <button key={v} onClick={() => setFiltro(v)} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid", cursor: "pointer", fontSize: 12, fontFamily: "inherit", background: filtro === v ? "#1E3A8A" : "transparent", color: filtro === v ? "#fff" : "#6B7280", borderColor: filtro === v ? "#1E3A8A" : "#E5E7EB" }}>{l}</button>
              ))}
            </div>

            {/* Lista */}
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
                        <span style={{ fontWeight: 700, fontSize: 14 }}>
                          {sol.tipo_estudio}{sol.sub_tipo ? ` · ${sol.sub_tipo}` : ""}{sol.protocolo ? ` — ${sol.protocolo}` : ""}
                        </span>
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
                        <span>🕐 {new Date(sol.created_at).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</span>
                        {sol.horario_programado && <span>📅 {sol.horario_programado}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {view === "censo" && <CensoView solicitudes={sols} loading={loading} />}
      </div>

      {selected && (
        <SolicitudModal sol={selected} adscritos={ads} token={token} onUpdate={load} onClose={() => setSelected(null)} />
      )}
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
  const [session, setSession] = useState(null);
  const page = new URLSearchParams(window.location.search).get("page");

  if (page === "form") return <SolicitudForm />;
  if (page === "qr")   return <QRScreen />;

  if (!session) return <LoginScreen onLogin={setSession} />;
  if (!session.perfil) return <SetupPerfil uid={session.uid} token={session.token} onDone={p => setSession(s => ({ ...s, perfil: p }))} />;
  if (session.perfil.rol === "jefe") return <PanelJefe session={session} onLogout={() => setSession(null)} />;
  return <PanelResidente session={session} onLogout={() => setSession(null)} />;
}
