import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://luiuglzekpdgeattjukm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aXVnbHpla3BkZ2VhdHRqdWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTAwNzgsImV4cCI6MjA4ODU2NjA3OH0.qZ3JjIoxaFMYJMEThU7jEL4uGowTPJ9G-qHHceXBtqU"
);

// Senhas especiais
const SENHA_INFLUENCER = "INFLUX@equipe2026";
const SENHA_ADMIN = "ADM@influx#2026";
const EMAIL_ADMIN = "c987123255120@gmail.com";

const C = {
  bg: "#05060a",
  surface: "#0b0d14",
  card: "#0f1219",
  border: "#161b28",
  accent: "#00d4ff",
  accentDim: "#00d4ff18",
  gold: "#f5c542",
  goldDim: "#f5c54218",
  green: "#00e87a",
  greenDim: "#00e87a18",
  purple: "#9b6dff",
  purpleDim: "#9b6dff18",
  red: "#ff3d5a",
  redDim: "#ff3d5a18",
  orange: "#ff7043",
  text: "#dde3f0",
  sub: "#8892a4",
  muted: "#4a5568",
};

const fmt = (n) => new Intl.NumberFormat("pt-BR").format(n ?? 0);
const initials = (name = "") => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const Pill = ({ label, color }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
  }}>{label}</span>
);

const Avatar = ({ name, size = 36, color = C.accent }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: color + "22", border: `1.5px solid ${color}55`,
    display: "flex", alignItems: "center", justifyContent: "center",
    color, fontWeight: 800, fontSize: size * 0.3, flexShrink: 0,
    fontFamily: "monospace",
  }}>{initials(name)}</div>
);

const Loader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      border: `2px solid ${C.border}`, borderTopColor: C.accent,
      animation: "spin 0.8s linear infinite",
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const StatCard = ({ icon, label, value, color = C.accent, sub, trend }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: "16px 18px", flex: 1, minWidth: 120,
    position: "relative", overflow: "hidden",
  }}>
    <div style={{
      position: "absolute", top: 0, right: 0, width: 60, height: 60,
      background: `radial-gradient(circle at top right, ${color}15, transparent 70%)`,
    }} />
    <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
    <div style={{ color, fontSize: 24, fontWeight: 900, fontFamily: "'Courier New', monospace", lineHeight: 1 }}>{value}</div>
    <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ color: trend === "up" ? C.green : C.sub, fontSize: 10, marginTop: 3, fontWeight: 600 }}>{sub}</div>}
  </div>
);

const PRIZES = [
  { label: "R$ 3.000", color: C.gold, weight: 1 },
  { label: "Cupom 10%", color: C.purple, weight: 8 },
  { label: "R$ 2.000", color: C.red, weight: 2 },
  { label: "Cupom 20%", color: C.accent, weight: 7 },
  { label: "R$ 1.000", color: C.green, weight: 3 },
  { label: "Cupom 5%", color: C.orange, weight: 9 },
  { label: "R$ 500", color: "#ec4899", weight: 4 },
  { label: "Tente +", color: C.muted, weight: 6 },
];

function RouletteWheel({ credits, onSpin }) {
  const canvasRef = useRef(null);
  const angleRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState(null);
  const arc = (2 * Math.PI) / PRIZES.length;

  const draw = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 12;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const grd = ctx.createRadialGradient(cx, cy, r - 4, cx, cy, r + 8);
    grd.addColorStop(0, C.accent + "44");
    grd.addColorStop(1, "transparent");
    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, 2 * Math.PI);
    ctx.fillStyle = grd;
    ctx.fill();
    PRIZES.forEach((seg, i) => {
      const start = angle + i * arc, end = start + arc;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      ctx.fillStyle = seg.color + "18";
      ctx.fill();
      ctx.strokeStyle = seg.color + "66";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.font = "bold 10px 'Courier New'";
      ctx.fillStyle = seg.color;
      ctx.shadowColor = seg.color;
      ctx.shadowBlur = 6;
      ctx.fillText(seg.label, r - 8, 4);
      ctx.restore();
    });
    const cGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
    cGrd.addColorStop(0, C.accent + "33");
    cGrd.addColorStop(1, C.card);
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fillStyle = cGrd;
    ctx.fill();
    ctx.strokeStyle = C.accent;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "bold 8px monospace";
    ctx.fillStyle = C.accent;
    ctx.textAlign = "center";
    ctx.shadowBlur = 0;
    ctx.fillText("INFLUX", cx, cy + 3);
    ctx.beginPath();
    ctx.moveTo(cx + r + 4, cy);
    ctx.lineTo(cx + r + 18, cy - 8);
    ctx.lineTo(cx + r + 18, cy + 8);
    ctx.closePath();
    ctx.fillStyle = C.accent;
    ctx.shadowColor = C.accent;
    ctx.shadowBlur = 10;
    ctx.fill();
  }, []);

  useEffect(() => { draw(0); }, [draw]);

  const spin = () => {
    if (spinning || credits < 1) return;
    setResult(null);
    setSpinning(true);
    onSpin();
    const total = 10 * Math.PI + Math.random() * 4 * Math.PI;
    const dur = 4500, t0 = performance.now(), a0 = angleRef.current;
    const go = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      angleRef.current = a0 + total * e;
      draw(angleRef.current);
      if (p < 1) requestAnimationFrame(go);
      else {
        setSpinning(false);
        const norm = ((angleRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const idx = Math.floor(((2 * Math.PI - norm) / arc) % PRIZES.length);
        setResult(PRIZES[((idx % PRIZES.length) + PRIZES.length) % PRIZES.length]);
      }
    };
    requestAnimationFrame(go);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ position: "relative" }}>
        <canvas ref={canvasRef} width={280} height={280} />
      </div>
      {result && (
        <div style={{
          background: result.color + "18", border: `1px solid ${result.color}66`,
          borderRadius: 14, padding: "14px 28px", textAlign: "center",
        }}>
          <div style={{ color: result.color, fontWeight: 800, fontSize: 20 }}>🎉 {result.label}</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>Parabens! Resultado registrado.</div>
        </div>
      )}
      <button onClick={spin} disabled={spinning || credits < 1} style={{
        background: credits >= 1 && !spinning ? `linear-gradient(135deg, ${C.accent}, ${C.purple})` : C.border,
        color: credits >= 1 && !spinning ? "#000" : C.muted,
        border: "none", borderRadius: 12, padding: "14px 36px",
        fontWeight: 800, fontSize: 13, cursor: credits >= 1 ? "pointer" : "not-allowed",
        letterSpacing: 1.5, transition: "all 0.2s",
        boxShadow: credits >= 1 && !spinning ? `0 0 24px ${C.accent}44` : "none",
      }}>
        {spinning ? "GIRANDO..." : credits >= 1 ? `GIRAR (${credits} credito${credits > 1 ? "s" : ""})` : "SEM CREDITOS"}
      </button>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── TELA DE LOGIN/CADASTRO ───────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setLoading(true);
    setError("");
    try {
      if (mode === "cadastro") {
        if (!nome.trim()) { setError("Digite seu nome."); setLoading(false); return; }
        const { data, error: err } = await supabase.auth.signUp({
          email, password: senha,
          options: { data: { nome } }
        });
        if (err) { setError(err.message); setLoading(false); return; }
        // Inserir na tabela INFLUXO
        await supabase.from("INFLUXO").insert({
          nome, email,
          entradas_hoje: 0, entradas_semana: 0, entradas_mes: 0,
          streak: 0, multiplicador: 1, creditos_roleta: 0, ativo: true,
        });
        onLogin(data.user, nome);
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (err) { setError("Email ou senha incorretos."); setLoading(false); return; }
        onLogin(data.user, data.user.user_metadata?.nome || email.split("@")[0]);
      }
    } catch (e) {
      setError("Erro ao conectar. Tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'Space Mono', monospace",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } input::placeholder { color: #4a5568; } input:focus { outline: none; border-color: #00d4ff !important; }`}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            fontSize: 42, fontWeight: 900, letterSpacing: 8,
            background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            fontFamily: "'Space Mono', monospace",
          }}>INFLUX</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 6, letterSpacing: 2 }}>PLATAFORMA DE AFILIADOS</div>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, boxShadow: `0 0 60px ${C.accent}0a` }}>
          <div style={{ display: "flex", marginBottom: 24, background: C.surface, borderRadius: 10, padding: 3 }}>
            {["login", "cadastro"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1,
                background: mode === m ? `linear-gradient(135deg, ${C.accent}22, ${C.purple}22)` : "transparent",
                border: mode === m ? `1px solid ${C.accent}44` : "1px solid transparent",
                borderRadius: 8, padding: "8px 0", color: mode === m ? C.accent : C.muted,
                fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: 1,
                fontFamily: "monospace", transition: "all 0.2s",
              }}>{m.toUpperCase()}</button>
            ))}
          </div>

          {mode === "cadastro" && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: C.sub, fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>NOME COMPLETO</div>
              <input type="text" value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo"
                style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace" }} />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>E-MAIL</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace" }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>SENHA</div>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••"
              onKeyDown={e => e.key === "Enter" && handle()}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace" }} />
          </div>

          {error && (
            <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 12, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button onClick={handle} disabled={loading} style={{
            width: "100%", background: loading ? C.border : `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
            color: loading ? C.muted : "#000", border: "none", borderRadius: 12,
            padding: "14px", fontWeight: 800, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 2, fontFamily: "monospace", transition: "all 0.2s",
            boxShadow: loading ? "none" : `0 0 20px ${C.accent}33`,
          }}>
            {loading ? "AGUARDE..." : mode === "login" ? "ENTRAR" : "CRIAR CONTA"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MODAL SENHA ESPECIAL ─────────────────────────────────────────────────────
function SenhaModal({ tipo, onSuccess, onClose }) {
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");

  const verificar = () => {
    if (tipo === "influencer" && senha === SENHA_INFLUENCER) onSuccess();
    else if (tipo === "admin" && senha === SENHA_ADMIN) onSuccess();
    else setError("Senha incorreta!");
  };

  const color = tipo === "admin" ? C.purple : C.gold;
  const titulo = tipo === "admin" ? "ACESSO ADMIN" : "ACESSO INFLUENCIADOR";

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000000aa",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 999, padding: 20,
    }}>
      <div style={{ background: C.card, border: `1px solid ${color}44`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 340 }}>
        <div style={{ color, fontWeight: 900, fontSize: 14, letterSpacing: 2, marginBottom: 6 }}>{titulo}</div>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 20 }}>Digite a senha especial para acessar esta area.</div>
        <input
          type="password" value={senha} onChange={e => setSenha(e.target.value)}
          placeholder="Senha especial..."
          onKeyDown={e => e.key === "Enter" && verificar()}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace", marginBottom: 12 }}
        />
        {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.border, border: "none", borderRadius: 10, padding: "12px", color: C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>CANCELAR</button>
          <button onClick={verificar} style={{ flex: 2, background: `linear-gradient(135deg, ${color}, ${color}99)`, border: "none", borderRadius: 10, padding: "12px", color: "#000", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>ENTRAR</button>
        </div>
      </div>
    </div>
  );
}

// ─── AREA DO LEAD ─────────────────────────────────────────────────────────────
function LeadArea({ user, nome, onLogout }) {
  const [tab, setTab] = useState("home");
  const [lead, setLead] = useState(null);
  const [ranking, setRanking] = useState([]);
  const [rankingMensal, setRankingMensal] = useState([]);
  const [ticket, setTicket] = useState("");
  const [ticketMsg, setTicketMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinCredits, setSpinCredits] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: leadData } = await supabase.from("INFLUXO").select("*").eq("email", user.email).single();
    if (leadData) { setLead(leadData); setSpinCredits(leadData.creditos_roleta || 0); }
    const { data: rankData } = await supabase.from("Ranking_Diario").select("*").order("entradas", { ascending: false }).limit(10);
    if (rankData) setRanking(rankData);
    const { data: rankMensal } = await supabase.from("Ranking_Mensal").select("*").order("entradas_mes", { ascending: false }).limit(10);
    if (rankMensal) setRankingMensal(rankMensal);
    setLoading(false);
  };

  const submitTicket = async () => {
    if (!ticket.trim()) return;
    setTicketMsg(null);
    const { data: existing } = await supabase.from("Ingressos").select("id").eq("ticket_codigo", ticket.trim()).single();
    if (existing) { setTicketMsg({ type: "error", text: "Ticket ja utilizado!" }); return; }
    const { error } = await supabase.from("Ingressos").insert({ lead_id: lead?.id, ticket_codigo: ticket.trim(), status: "validado" });
    if (error) { setTicketMsg({ type: "error", text: "Erro ao validar ticket." }); return; }
    await supabase.from("INFLUXO").update({
      entradas_hoje: (lead?.entradas_hoje || 0) + 1,
      entradas_semana: (lead?.entradas_semana || 0) + 1,
      entradas_mes: (lead?.entradas_mes || 0) + 1,
    }).eq("email", user.email);
    setTicketMsg({ type: "success", text: "Ticket validado! +1 entrada registrada." });
    setTicket("");
    loadData();
  };

  const tabs = [
    { id: "home", label: "Inicio" },
    { id: "ticket", label: "Ticket" },
    { id: "roulette", label: "Roleta" },
    { id: "ranking", label: "Diario" },
    { id: "mensal", label: "Mensal" },
    { id: "prizes", label: "Premios" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'Space Mono', monospace" }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.accent}12, ${C.purple}08)`,
        borderBottom: `1px solid ${C.border}`, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>INFLUX</div>
          <div style={{ color: C.muted, fontSize: 10, marginTop: 1 }}>{nome}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {lead?.streak >= 7 && <Pill label={`${lead.streak}d`} color={C.gold} />}
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 8px", color: C.muted, fontSize: 10, cursor: "pointer" }}>sair</button>
        </div>
      </div>

      <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none",
            borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
            color: tab === t.id ? C.accent : C.muted,
            padding: "10px 12px", fontWeight: 700, fontSize: 10,
            cursor: "pointer", whiteSpace: "nowrap", letterSpacing: 0.5, fontFamily: "monospace",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {loading ? <Loader /> : (
          <>
            {tab === "home" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <StatCard icon="📍" label="Hoje" value={lead?.entradas_hoje || 0} color={C.accent} />
                  <StatCard icon="🔥" label="Streak" value={`${lead?.streak || 0}d`} color={C.gold} />
                  <StatCard icon="x" label="Multi" value={`${lead?.multiplicador || 1}x`} color={C.green} />
                </div>
                <div style={{ background: `linear-gradient(135deg, ${C.accent}12, ${C.purple}08)`, border: `1px solid ${C.accent}33`, borderRadius: 16, padding: 18 }}>
                  <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>SORTEIO DA SEMANA</div>
                  <div style={{ color: C.sub, fontSize: 11, marginBottom: 14 }}>Proxima Segunda-feira. Cadastre seu ticket para participar.</div>
                  <a href="https://cifradobem.com" target="_blank" rel="noreferrer" style={{
                    display: "block", background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
                    color: "#000", fontWeight: 800, textAlign: "center", borderRadius: 12,
                    padding: "13px", textDecoration: "none", fontSize: 12, letterSpacing: 2,
                  }}>ACESSAR CIFRA DO BEM</a>
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>METAS DO DIA</div>
                  {[
                    { label: "Minimo diario (7x)", done: (lead?.entradas_hoje || 0) >= 7 },
                    { label: "Credito de roleta (7x/dia x 7d)", done: (lead?.streak || 0) >= 7 },
                    { label: "Multiplicador ativo (12x+)", done: (lead?.entradas_hoje || 0) >= 12 },
                  ].map((m, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: 6,
                        background: m.done ? C.green + "22" : C.border,
                        border: `1.5px solid ${m.done ? C.green : C.muted}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, flexShrink: 0, color: C.green,
                      }}>{m.done ? "v" : ""}</div>
                      <span style={{ color: m.done ? C.text : C.sub, fontSize: 12 }}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "ticket" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
                  <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>VALIDAR TICKET</div>
                  <div style={{ color: C.sub, fontSize: 11, marginBottom: 16, lineHeight: 1.6 }}>
                    Apos cada cadastro na Cifra do Bem, voce recebe um ticket unico por e-mail. Cole o codigo abaixo.
                  </div>
                  <input
                    type="text" value={ticket}
                    onChange={e => setTicket(e.target.value)}
                    placeholder="Cole o codigo do ticket aqui..."
                    onKeyDown={e => e.key === "Enter" && submitTicket()}
                    style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 14px", color: C.text, fontSize: 13, fontFamily: "monospace", marginBottom: 12 }}
                  />
                  <button onClick={submitTicket} style={{
                    width: "100%", background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
                    color: "#000", border: "none", borderRadius: 12, padding: "13px",
                    fontWeight: 800, fontSize: 12, cursor: "pointer", letterSpacing: 2,
                  }}>VALIDAR ENTRADA</button>
                  {ticketMsg && (
                    <div style={{
                      marginTop: 12,
                      background: ticketMsg.type === "success" ? C.greenDim : C.redDim,
                      border: `1px solid ${ticketMsg.type === "success" ? C.green : C.red}44`,
                      borderRadius: 10, padding: "12px 14px",
                      color: ticketMsg.type === "success" ? C.green : C.red,
                      fontSize: 12, fontWeight: 600,
                    }}>{ticketMsg.text}</div>
                  )}
                </div>
              </div>
            )}

            {tab === "roulette" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, textAlign: "center" }}>
                  <div style={{ color: C.muted, fontSize: 10 }}>SEUS CREDITOS</div>
                  <div style={{ color: C.accent, fontSize: 36, fontWeight: 900, fontFamily: "monospace" }}>{spinCredits}</div>
                  <div style={{ color: C.muted, fontSize: 10 }}>7x/dia x 7 dias = 1 credito</div>
                </div>
                <RouletteWheel credits={spinCredits} onSpin={async () => {
                  setSpinCredits(c => Math.max(0, c - 1));
                  await supabase.from("INFLUXO").update({ creditos_roleta: Math.max(0, (lead?.creditos_roleta || 0) - 1) }).eq("email", user.email);
                }} />
              </div>
            )}

            {tab === "ranking" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: C.goldDim, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: "10px 14px", textAlign: "center", color: C.gold, fontSize: 11, fontWeight: 700 }}>
                  Top 10 do dia ganham R$20 cada - Seg a Sex
                </div>
                {ranking.map((r, i) => (
                  <div key={r.id} style={{
                    background: i < 3 ? `${[C.gold, "#c0c0c0", "#cd7f32"][i]}10` : C.card,
                    border: `1px solid ${i < 3 ? [C.gold, "#c0c0c0", "#cd7f32"][i] + "33" : C.border}`,
                    borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ color: i < 3 ? [C.gold, "#c0c0c0", "#cd7f32"][i] : C.muted, fontWeight: 900, fontSize: 14, width: 24, textAlign: "center" }}>{i + 1}</div>
                    <Avatar name={r.nome} size={34} color={i < 3 ? [C.gold, "#c0c0c0", "#cd7f32"][i] : C.accent} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{r.nome}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 16 }}>{r.entradas}x</div>
                      {i < 10 && <div style={{ color: C.green, fontSize: 10, fontWeight: 700 }}>R$20</div>}
                    </div>
                  </div>
                ))}
                {ranking.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32, fontSize: 12 }}>Nenhum dado ainda hoje</div>}
              </div>
            )}

            {tab === "mensal" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {rankingMensal.map((r, i) => (
                  <div key={r.id} style={{
                    background: i < 3 ? `${[C.gold, "#c0c0c0", "#cd7f32"][i]}10` : C.card,
                    border: `1px solid ${i < 3 ? [C.gold, "#c0c0c0", "#cd7f32"][i] + "33" : C.border}`,
                    borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ color: i < 3 ? [C.gold, "#c0c0c0", "#cd7f32"][i] : C.muted, fontWeight: 900, width: 24 }}>{i + 1}</div>
                    <Avatar name={r.nome} size={34} color={i < 3 ? [C.gold, "#c0c0c0", "#cd7f32"][i] : C.purple} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{r.nome}</div>
                      <div style={{ color: C.muted, fontSize: 10 }}>x{r.multiplicador || 1}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace" }}>{r.entradas_mes}</div>
                      <div style={{ color: i < 3 ? C.green : C.muted, fontSize: 9 }}>{i < 3 ? "TOP 3" : "entradas"}</div>
                    </div>
                  </div>
                ))}
                {rankingMensal.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32, fontSize: 12 }}>Nenhum dado este mes</div>}
              </div>
            )}

            {tab === "prizes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "🎰", title: "Roleta Semanal", desc: "7x/dia por 7 dias = 1 credito. Premios de ate R$3.000", color: C.purple, value: "ate R$3.000" },
                  { icon: "📅", title: "Ranking Diario", desc: "Top 10 cadastros/dia ganham R$20 cada (Seg-Sex)", color: C.gold, value: "R$20/dia" },
                  { icon: "⚡", title: "Streak Semanal", desc: "Top 10 com mais cadastros em 7 dias ganham R$50", color: C.accent, value: "R$50/semana" },
                  { icon: "🏆", title: "Multiplicador Mensal", desc: "Top 3 do mes com 12x+/dia dividem premio especial", color: C.green, value: "Top 3" },
                  { icon: "💸", title: "Pix Semanal", desc: "Disponivel via plataforma Cifra do Bem toda segunda", color: C.orange, value: "Semanal" },
                ].map((p, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${p.color}22`, borderRadius: 16, padding: 16, display: "flex", gap: 14 }}>
                    <div style={{ fontSize: 28 }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <div style={{ color: p.color, fontWeight: 700, fontSize: 13 }}>{p.title}</div>
                        <Pill label={p.value} color={p.color} />
                      </div>
                      <div style={{ color: C.sub, fontSize: 11, lineHeight: 1.5 }}>{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── AREA DO INFLUENCIADOR ────────────────────────────────────────────────────
function InfluencerArea({ user, nome, onLogout }) {
  const [infData, setInfData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("Influenciadores").select("*").eq("instagram", user.email).single();
      setInfData(data);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'Space Mono', monospace" }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.gold}12, ${C.orange}08)`,
        borderBottom: `1px solid ${C.border}`, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg, ${C.gold}, ${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>INFLUX PRO</div>
          <div style={{ color: C.muted, fontSize: 10 }}>Area do Influenciador</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill label="INFLUENCER" color={C.gold} />
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 8px", color: C.muted, fontSize: 10, cursor: "pointer" }}>sair</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {loading ? <Loader /> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.card, border: `1px solid ${C.gold}33`, borderRadius: 16, padding: 18 }}>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Ola, {nome}!</div>
              <div style={{ color: C.sub, fontSize: 11 }}>Bem-vindo a sua area exclusiva de influenciador.</div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <StatCard icon="👥" label="Leads gerados" value={fmt(infData?.leads_gerados || 0)} color={C.accent} />
              <StatCard icon="👁" label="Visualizacoes" value={fmt(infData?.visualizacoes || 0)} color={C.purple} />
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.green}33`, borderRadius: 16, padding: 18 }}>
              <div style={{ color: C.green, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>COMISSAO (35%)</div>
              <div style={{ color: C.green, fontSize: 32, fontWeight: 900, fontFamily: "monospace" }}>
                R${fmt(Math.floor((infData?.visualizacoes || 0) / 1000 * 100 * 0.35))}
              </div>
              <div style={{ color: C.muted, fontSize: 10, marginTop: 4 }}>R$100 por 1.000 visualizacoes x 35%</div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.accent, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>SEU LINK DE AFILIADO</div>
              <div style={{ background: C.surface, borderRadius: 10, padding: "12px 14px", color: C.accent, fontSize: 11, fontFamily: "monospace", wordBreak: "break-all" }}>
                influx-coral.vercel.app?ref={user.email?.split("@")[0]}
              </div>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>COMO FUNCIONA</div>
              {[
                "Compartilhe seu link com seus seguidores",
                "Cada visualizacao conta para sua comissao",
                "Voce ganha 35% de R$100 por 1.000 views",
                "Pagamento via Pix todo mes",
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: C.goldDim, border: `1px solid ${C.gold}44`, display: "flex", alignItems: "center", justifyContent: "center", color: C.gold, fontSize: 9, fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                  <span style={{ color: C.sub, fontSize: 11, lineHeight: 1.5 }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAINEL ADMIN ─────────────────────────────────────────────────────────────
function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState("overview");
  const [leads, setLeads] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, hoje: 0, semana: 0 });
  
  // Controle da Roleta
  const [prizes, setPrizes] = useState(PRIZES);
  const [roletaAtiva, setRotletaAtiva] = useState(true);
  const [creditosMin, setCreditosMin] = useState(1);
  const [editando, setEditando] = useState(null);

  useEffect(() => { loadAdmin(); }, []);

  const loadAdmin = async () => {
    setLoading(true);
    const [l, inf, pag] = await Promise.all([
      supabase.from("INFLUXO").select("*").order("entradas_hoje", { ascending: false }).limit(20),
      supabase.from("Influenciadores").select("*"),
      supabase.from("Pagamentos").select("*").eq("status", "pendente"),
    ]);
    if (l.data) {
      setLeads(l.data);
      setStats({ total: l.data.length, hoje: l.data.reduce((s, x) => s + (x.entradas_hoje || 0), 0), semana: l.data.reduce((s, x) => s + (x.entradas_semana || 0), 0) });
    }
    if (inf.data) setInfluencers(inf.data);
    if (pag.data) setPagamentos(pag.data);
    setLoading(false);
  };

  const pagarPix = async (p) => {
    await supabase.from("Pagamentos").update({ status: "pago" }).eq("id", p.id);
    loadAdmin();
  };

  const adicionarCredito = async (leadId) => {
    const lead = leads.find(l => l.id === leadId);
    await supabase.from("INFLUXO").update({ creditos_roleta: (lead?.creditos_roleta || 0) + 1 }).eq("id", leadId);
    loadAdmin();
  };

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "leads", label: "Leads" },
    { id: "roleta", label: "Roleta" },
    { id: "influencers", label: "Influenc." },
    { id: "payouts", label: "Pagamentos" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "'Space Mono', monospace" }}>
      <div style={{
        background: `linear-gradient(135deg, ${C.purple}12, ${C.red}08)`,
        borderBottom: `1px solid ${C.border}`, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg, ${C.purple}, ${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>INFLUX ADMIN</div>
          <div style={{ color: C.muted, fontSize: 10 }}>Painel de Controle</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill label="LIVE" color={C.green} />
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 8px", color: C.muted, fontSize: 10, cursor: "pointer" }}>sair</button>
        </div>
      </div>

      <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none",
            borderBottom: tab === t.id ? `2px solid ${C.purple}` : "2px solid transparent",
            color: tab === t.id ? C.purple : C.muted, padding: "10px 12px",
            fontWeight: 700, fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "monospace",
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {loading ? <Loader /> : (
          <>
            {tab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <StatCard icon="👥" label="Total leads" value={fmt(stats.total)} color={C.accent} />
                  <StatCard icon="⚡" label="Entradas hoje" value={fmt(stats.hoje)} color={C.purple} />
                  <StatCard icon="📈" label="Esta semana" value={fmt(stats.semana)} color={C.green} />
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <StatCard icon="🌟" label="Influenciadores" value={influencers.length} color={C.gold} />
                  <StatCard icon="💸" label="Pendentes" value={pagamentos.length} color={C.red} sub="pagamentos" />
                  <StatCard icon="💰" label="Receita est." value={`R$${fmt(Math.floor(stats.semana / 10))}`} color={C.green} />
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 12, marginBottom: 14 }}>CUSTO MENSAL</div>
                  {[
                    { label: "Roleta Semanal", value: "R$ 10.000", color: C.purple, pct: 62.5 },
                    { label: "Ranking Diario", value: "R$ 4.000", color: C.gold, pct: 25 },
                    { label: "Streak Semanal", value: "R$ 2.000", color: C.accent, pct: 12.5 },
                  ].map((item, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}>
                        <span style={{ color: C.sub }}>{item.label}</span>
                        <span style={{ color: item.color, fontWeight: 700 }}>{item.value}</span>
                      </div>
                      <div style={{ height: 4, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${item.pct}%`, background: item.color, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>
                    <span style={{ color: C.text }}>TOTAL</span>
                    <span style={{ color: C.red }}>R$ 16.000/mes</span>
                  </div>
                </div>
              </div>
            )}

            {tab === "leads" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ color: C.muted, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>TOP LEADS POR ATIVIDADE</div>
                {leads.map((lead, i) => (
                  <div key={lead.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ color: C.muted, fontWeight: 700, width: 20, fontSize: 11 }}>{i + 1}</div>
                    <Avatar name={lead.nome || lead.email} size={34} color={C.purple} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{lead.nome || lead.email?.split("@")[0]}</div>
                      <div style={{ color: C.muted, fontSize: 10 }}>streak {lead.streak || 0}d · creditos: {lead.creditos_roleta || 0}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 15 }}>{lead.entradas_hoje || 0}x</div>
                        <div style={{ color: C.muted, fontSize: 9 }}>hoje</div>
                      </div>
                      <button onClick={() => adicionarCredito(lead.id)} style={{
                        background: C.accentDim, border: `1px solid ${C.accent}44`,
                        borderRadius: 8, padding: "4px 8px", color: C.accent,
                        fontWeight: 700, fontSize: 9, cursor: "pointer", fontFamily: "monospace",
                      }}>+CR</button>
                    </div>
                  </div>
                ))}
                {leads.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum lead ainda</div>}
              </div>
            )}

            {tab === "roleta" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: C.card, border: `1px solid ${C.purple}33`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.purple, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>CONTROLE DA ROLETA</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ color: C.text, fontSize: 12 }}>Roleta ativa</span>
                    <button onClick={() => setRotletaAtiva(!roletaAtiva)} style={{
                      background: roletaAtiva ? C.green + "22" : C.redDim,
                      border: `1px solid ${roletaAtiva ? C.green : C.red}44`,
                      borderRadius: 20, padding: "6px 16px",
                      color: roletaAtiva ? C.green : C.red,
                      fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "monospace",
                    }}>{roletaAtiva ? "ATIVA" : "PAUSADA"}</button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: C.text, fontSize: 12 }}>Creditos minimos</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => setCreditosMin(Math.max(1, creditosMin - 1))} style={{ background: C.border, border: "none", borderRadius: 6, width: 28, height: 28, color: C.text, cursor: "pointer", fontSize: 16 }}>-</button>
                      <span style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", width: 20, textAlign: "center" }}>{creditosMin}</span>
                      <button onClick={() => setCreditosMin(creditosMin + 1)} style={{ background: C.border, border: "none", borderRadius: 6, width: 28, height: 28, color: C.text, cursor: "pointer", fontSize: 16 }}>+</button>
                    </div>
                  </div>
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>PREMIOS DA ROLETA</div>
                  {prizes.map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "8px 12px", background: C.surface, borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                        <span style={{ color: p.color, fontSize: 12, fontWeight: 700 }}>{p.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Pill label={p.weight <= 3 ? "RARO" : p.weight <= 6 ? "MEDIO" : "COMUM"} color={p.weight <= 3 ? C.red : p.weight <= 6 ? C.gold : C.muted} />
                        <button onClick={() => setEditando(i)} style={{ background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 6, padding: "3px 8px", color: C.accent, fontSize: 9, cursor: "pointer", fontFamily: "monospace" }}>EDITAR</button>
                      </div>
                    </div>
                  ))}
                </div>

                {editando !== null && (
                  <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 16, padding: 16 }}>
                    <div style={{ color: C.accent, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>EDITANDO: {prizes[editando].label}</div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: C.sub, fontSize: 10, marginBottom: 6 }}>NOME DO PREMIO</div>
                      <input
                        value={prizes[editando].label}
                        onChange={e => {
                          const newPrizes = [...prizes];
                          newPrizes[editando] = { ...newPrizes[editando], label: e.target.value };
                          setPrizes(newPrizes);
                        }}
                        style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "monospace" }}
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: C.sub, fontSize: 10, marginBottom: 6 }}>RARIDADE (1=raro, 9=comum)</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={() => {
                          const newPrizes = [...prizes];
                          newPrizes[editando] = { ...newPrizes[editando], weight: Math.max(1, prizes[editando].weight - 1) };
                          setPrizes(newPrizes);
                        }} style={{ background: C.border, border: "none", borderRadius: 6, width: 32, height: 32, color: C.text, cursor: "pointer", fontSize: 18 }}>-</button>
                        <span style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 20, width: 30, textAlign: "center" }}>{prizes[editando].weight}</span>
                        <button onClick={() => {
                          const newPrizes = [...prizes];
                          newPrizes[editando] = { ...newPrizes[editando], weight: Math.min(9, prizes[editando].weight + 1) };
                          setPrizes(newPrizes);
                        }} style={{ background: C.border, border: "none", borderRadius: 6, width: 32, height: 32, color: C.text, cursor: "pointer", fontSize: 18 }}>+</button>
                      </div>
                    </div>
                    <button onClick={() => setEditando(null)} style={{
                      width: "100%", background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`,
                      color: "#000", border: "none", borderRadius: 10, padding: "12px",
                      fontWeight: 800, fontSize: 12, cursor: "pointer", letterSpacing: 1,
                    }}>SALVAR ALTERACAO</button>
                  </div>
                )}
              </div>
            )}

            {tab === "influencers" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {influencers.map((inf, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={inf.nome} size={36} color={C.purple} />
                        <div>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>@{inf.instagram || inf.nome}</div>
                          <div style={{ color: C.muted, fontSize: 10 }}>ativo</div>
                        </div>
                      </div>
                      <Pill label={inf.status || "ativo"} color={C.green} />
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[
                        { label: "leads", value: fmt(inf.leads_gerados || 0), color: C.accent },
                        { label: "views", value: fmt(inf.visualizacoes || 0), color: C.purple },
                        { label: "comissao 35%", value: `R$${fmt(Math.floor((inf.visualizacoes || 0) / 1000 * 100 * 0.35))}`, color: C.green },
                      ].map((s, j) => (
                        <div key={j}>
                          <div style={{ color: s.color, fontWeight: 900, fontFamily: "monospace", fontSize: 14 }}>{s.value}</div>
                          <div style={{ color: C.muted, fontSize: 9 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {influencers.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum influenciador</div>}
              </div>
            )}

            {tab === "payouts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pagamentos.map((p, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={p.nome} size={34} color={C.green} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{p.nome}</div>
                      <div style={{ color: C.muted, fontSize: 10 }}>{p.tipo}</div>
                    </div>
                    <div style={{ color: C.green, fontWeight: 900, fontFamily: "monospace", marginRight: 8 }}>R${p.valor}</div>
                    <button onClick={() => pagarPix(p)} style={{ background: C.greenDim, border: `1px solid ${C.green}44`, borderRadius: 8, padding: "6px 12px", color: C.green, fontWeight: 700, fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>PAGAR</button>
                  </div>
                ))}
                {pagamentos.length === 0 && (
                  <div style={{ background: C.greenDim, border: `1px solid ${C.green}22`, borderRadius: 14, padding: 24, textAlign: "center" }}>
                    <div style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>Tudo em dia!</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Nenhum pagamento pendente</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState(null);
  const [nome, setNome] = useState("");
  const [area, setArea] = useState("lead"); // lead | influencer | admin
  const [modalSenha, setModalSenha] = useState(null); // null | "influencer" | "admin"
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) {
        setNome(data.session.user.user_metadata?.nome || data.session.user.email?.split("@")[0]);
      }
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) setNome(s.user.user_metadata?.nome || s.user.email?.split("@")[0]);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setArea("lead");
  };

  const handleLogin = (user, nomeUser) => {
    setNome(nomeUser);
  };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader />
    </div>
  );

  if (!session) return <AuthScreen onLogin={handleLogin} />;

  const isAdmin = session.user.email === EMAIL_ADMIN;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; } ::-webkit-scrollbar { width: 3px; } ::-webkit-scrollbar-thumb { background: #1e2535; border-radius: 4px; }`}</style>

      {modalSenha && (
        <SenhaModal
          tipo={modalSenha}
          onSuccess={() => { setArea(modalSenha); setModalSenha(null); }}
          onClose={() => setModalSenha(null)}
        />
      )}

      <div style={{ width: "100%", maxWidth: 430 }}>
        {/* Navegacao */}
        <div style={{ display: "flex", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 4, marginBottom: 12, gap: 4 }}>
          <button onClick={() => setArea("lead")} style={{
            flex: 1, background: area === "lead" ? `linear-gradient(135deg, ${C.accent}, ${C.purple})` : "transparent",
            color: area === "lead" ? "#000" : C.muted, border: "none", borderRadius: 10, padding: "10px 0",
            fontWeight: 800, fontSize: 10, cursor: "pointer", letterSpacing: 1, fontFamily: "monospace",
          }}>LEAD</button>

          <button onClick={() => area !== "influencer" ? setModalSenha("influencer") : setArea("lead")} style={{
            flex: 1, background: area === "influencer" ? `linear-gradient(135deg, ${C.gold}, ${C.orange})` : "transparent",
            color: area === "influencer" ? "#000" : C.muted, border: "none", borderRadius: 10, padding: "10px 0",
            fontWeight: 800, fontSize: 10, cursor: "pointer", letterSpacing: 1, fontFamily: "monospace",
          }}>INFLUENCER</button>

          {isAdmin && (
            <button onClick={() => area !== "admin" ? setModalSenha("admin") : setArea("lead")} style={{
              flex: 1, background: area === "admin" ? `linear-gradient(135deg, ${C.purple}, ${C.red})` : "transparent",
              color: area === "admin" ? "#fff" : C.muted, border: "none", borderRadius: 10, padding: "10px 0",
              fontWeight: 800, fontSize: 10, cursor: "pointer", letterSpacing: 1, fontFamily: "monospace",
            }}>ADMIN</button>
          )}
        </div>

        {/* Frame */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 26, overflow: "hidden", height: 640, boxShadow: `0 0 80px ${area === "admin" ? C.purple : area === "influencer" ? C.gold : C.accent}14` }}>
          {area === "lead" && <LeadArea user={session.user} nome={nome} onLogout={logout} />}
          {area === "influencer" && <InfluencerArea user={session.user} nome={nome} onLogout={logout} />}
          {area === "admin" && isAdmin && <AdminPanel onLogout={logout} />}
        </div>

        <div style={{ textAlign: "center", color: C.muted, fontSize: 9, marginTop: 12, letterSpacing: 2 }}>
          INFLUX · SUPABASE · MAKE · CIFRA DO BEM
        </div>
      </div>
    </div>
  );
}

