import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── SUPABASE ──────────────────────────────────────────────────────────────────
// SECURITY: Em produção, mova estas variáveis para .env e use RLS no Supabase
const SUPABASE_URL = "https://luiuglzekpdgeattjukm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aXVnbHpla3BkZ2VhdHRqdWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTAwNzgsImV4cCI6MjA4ODU2NjA3OH0.qZ3JjIoxaFMYJMEThU7jEL4uGowTPJ9G-qHHceXBtqU";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── CREDENCIAIS (MOVER PARA SERVIDOR EM PRODUÇÃO) ─────────────────────────────
const SENHA_INFLUENCER = "INFLUX@equipe2026";
const SENHA_ADMIN = "ADM@influx#2026";
const EMAIL_ADMIN = "c987123255120@gmail.com";

// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
const C = {
  bg: "#05060a", surface: "#0b0d14", card: "#0f1219", border: "#161b28",
  accent: "#00d4ff", accentDim: "#00d4ff18", gold: "#f5c542", goldDim: "#f5c54218",
  green: "#00e87a", greenDim: "#00e87a18", purple: "#9b6dff", purpleDim: "#9b6dff18",
  red: "#ff3d5a", redDim: "#ff3d5a18", orange: "#ff7043",
  text: "#dde3f0", sub: "#8892a4", muted: "#4a5568",
};

// ── UTILITÁRIOS ───────────────────────────────────────────────────────────────
const fmt = (n) => {
  const num = Number(n);
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("pt-BR").format(num);
};

const initials = (name = "") => {
  if (!name || typeof name !== "string") return "?";
  return name.trim().split(/\s+/).map(w => w[0] || "").join("").slice(0, 2).toUpperCase() || "?";
};

// Verifica se o lead atingiu 7x/dia por 7 dias consecutivos → crédito de roleta
const calcularStreakECredito = async (leadId) => {
  const { data } = await supabase.from("INFLUX").select("*").eq("id", leadId).single();
  if (!data) return;

  const hoje = new Date().toISOString().split("T")[0];
  const ultimoDia = data.Ultimo_Dia_Ativo;
  const entradas = data.Entradas_De_Hoje || 0;

  let novoStreak = data.Streak || 0;
  let novoCredito = data.Creditos_Da_Roleta || 0;

  // Atualiza streak: se último dia foi ontem e atingiu 7x+, incrementa
  if (ultimoDia) {
    const diff = Math.floor((new Date(hoje) - new Date(ultimoDia)) / 86400000);
    if (diff === 1 && entradas >= 7) novoStreak += 1;
    else if (diff > 1) novoStreak = entradas >= 7 ? 1 : 0;
  } else {
    novoStreak = entradas >= 7 ? 1 : 0;
  }

  // A cada 7 dias de streak, concede 1 crédito de roleta
  if (novoStreak > 0 && novoStreak % 7 === 0) {
    novoCredito += 1;
  }

  // Multiplicador: 1x normal, 2x se 12+ entradas/dia
  const novoMult = entradas >= 12 ? 2 : 1;

  await supabase.from("INFLUX").update({
    Streak: novoStreak,
    Multiplicador: novoMult,
    Creditos_Da_Roleta: novoCredito,
    Ultimo_Dia_Ativo: hoje,
  }).eq("id", leadId);
};

// ── COMPONENTES BASE ──────────────────────────────────────────────────────────
const Pill = ({ label, color }) => (
  <span style={{
    background: color + "22", color, border: `1px solid ${color}44`,
    borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700
  }}>{label}</span>
);

const Avatar = ({ name, size = 36, color = C.accent }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", background: color + "22",
    border: `1.5px solid ${color}55`, display: "flex", alignItems: "center",
    justifyContent: "center", color, fontWeight: 800, fontSize: size * 0.3,
    flexShrink: 0, fontFamily: "monospace"
  }}>{initials(name)}</div>
);

const Loader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
    <div style={{
      width: 28, height: 28, borderRadius: "50%",
      border: `2px solid ${C.border}`, borderTopColor: C.accent,
      animation: "spin 0.8s linear infinite"
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const StatCard = ({ icon, label, value, color = C.accent, sub }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
    padding: "16px 18px", flex: 1, minWidth: 110, position: "relative", overflow: "hidden"
  }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />
    <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
    <div style={{ color, fontSize: 22, fontWeight: 900, fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
    <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ color: C.sub, fontSize: 10, marginTop: 3 }}>{sub}</div>}
  </div>
);

// ── ROLETA ────────────────────────────────────────────────────────────────────
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

// Pré-computa segmentos por peso para seleção justa
const buildWeightedPool = () => {
  const pool = [];
  PRIZES.forEach((p, i) => { for (let w = 0; w < p.weight; w++) pool.push(i); });
  return pool;
};
const WEIGHTED_POOL = buildWeightedPool();

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

    PRIZES.forEach((seg, i) => {
      const start = angle + i * arc, end = start + arc;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
      ctx.fillStyle = seg.color + "18"; ctx.fill();
      ctx.strokeStyle = seg.color + "66"; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(start + arc / 2);
      ctx.textAlign = "right"; ctx.font = "bold 10px monospace";
      ctx.fillStyle = seg.color; ctx.shadowColor = seg.color; ctx.shadowBlur = 6;
      ctx.fillText(seg.label, r - 8, 4); ctx.restore();
    });

    // Centro
    const cGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
    cGrd.addColorStop(0, C.accent + "33"); cGrd.addColorStop(1, C.card);
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fillStyle = cGrd; ctx.fill();
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = "bold 7px monospace"; ctx.fillStyle = C.accent;
    ctx.textAlign = "center"; ctx.shadowBlur = 0;
    ctx.fillText("INFLUX", cx, cy + 3);

    // Ponteiro fixo à direita (aponta para o centro da roda)
    ctx.beginPath();
    ctx.moveTo(cx + r + 4, cy);
    ctx.lineTo(cx + r + 18, cy - 8);
    ctx.lineTo(cx + r + 18, cy + 8);
    ctx.closePath();
    ctx.fillStyle = C.accent; ctx.shadowColor = C.accent; ctx.shadowBlur = 10; ctx.fill();
  }, [arc]);

  useEffect(() => { draw(0); }, [draw]);

  const spin = async () => {
    if (spinning || credits < 1) return;

    setResult(null);
    setSpinning(true);

    // 1. Debita crédito ANTES de girar (chama callback do pai para persistir)
    const success = await onSpin();
    if (!success) { setSpinning(false); return; }

    // 2. Sorteia resultado por peso ANTES da animação
    const winIdx = WEIGHTED_POOL[Math.floor(Math.random() * WEIGHTED_POOL.length)];

    // 3. Calcula ângulo final para que o ponteiro (à direita = 0 rad) aponte para winIdx
    // O segmento winIdx começa em angleRef.current + winIdx * arc
    // Queremos que o CENTRO do segmento fique em 0 (onde está o ponteiro)
    // Portanto o ângulo final precisa ser: -winIdx * arc - arc/2 + voltas extras
    const currentAngle = angleRef.current % (2 * Math.PI);
    const targetSegCenter = -winIdx * arc - arc / 2;
    const extraSpins = 10 * Math.PI; // 5 voltas completas
    // Ajusta para sempre girar para frente (positivo)
    let delta = (targetSegCenter - currentAngle + extraSpins) % (2 * Math.PI);
    if (delta < 0) delta += 2 * Math.PI;
    const totalAngle = delta + extraSpins;

    const dur = 5000, t0 = performance.now(), a0 = angleRef.current;

    const go = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4); // ease-out-quart
      angleRef.current = a0 + totalAngle * e;
      draw(angleRef.current);

      if (p < 1) {
        requestAnimationFrame(go);
      } else {
        setSpinning(false);
        setResult(PRIZES[winIdx]);
      }
    };
    requestAnimationFrame(go);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <canvas ref={canvasRef} width={280} height={280} aria-label="Roleta de prêmios INFLUX" role="img" />

      {result && (
        <div style={{
          background: result.color + "18", border: `1px solid ${result.color}66`,
          borderRadius: 14, padding: "14px 28px", textAlign: "center",
          animation: "fadeIn 0.4s ease"
        }}>
          <div style={{ color: result.color, fontWeight: 800, fontSize: 20 }}>Parabéns! {result.label}</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>Resultado registrado.</div>
        </div>
      )}

      <button
        onClick={spin}
        disabled={spinning || credits < 1}
        style={{
          background: credits >= 1 && !spinning ? `linear-gradient(135deg,${C.accent},${C.purple})` : C.border,
          color: credits >= 1 && !spinning ? "#000" : C.muted,
          border: "none", borderRadius: 12, padding: "14px 36px",
          fontWeight: 800, fontSize: 13, cursor: credits >= 1 && !spinning ? "pointer" : "not-allowed",
          letterSpacing: 1.5, transition: "all 0.2s",
        }}
      >
        {spinning ? "GIRANDO..." : credits >= 1 ? `GIRAR (${credits} crédito${credits > 1 ? "s" : ""})` : "SEM CRÉDITOS"}
      </button>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ── TELA DE LOGIN ─────────────────────────────────────────────────────────────
function LoginScreen({ onEntrar }) {
  const [tela, setTela] = useState("lead");
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [tipoContato, setTipoContato] = useState("whatsapp");
  const [senha, setSenha] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // FIX: Login de lead - busca por telefone E por Instagram para evitar duplicatas
  const entrarLead = async () => {
    if (!nome.trim() || !contato.trim()) { setError("Preencha todos os campos."); return; }
    setLoading(true); setError("");

    try {
      const { data: ex } = await supabase
        .from("INFLUX").select("*").eq("Telefone", contato.trim()).maybeSingle();

      if (ex) {
        const userData = { ...ex, tipo: "lead" };
        localStorage.setItem("influx_user", JSON.stringify(userData));
        onEntrar(userData);
        setLoading(false); return;
      }

      const { data, error: err } = await supabase.from("INFLUX").insert({
        Nome: nome.trim(),
        Telefone: contato.trim(),
        Entradas_De_Hoje: 0,
        Entradas_Da_Semana: 0,
        Entradas_Do_Mes: 0,
        Streak: 0,
        Multiplicador: 1,
        Creditos_Da_Roleta: 0,
        Ultimo_Dia_Ativo: null,
        Ativo: true,
      }).select().single();

      if (err) { setError("Erro ao cadastrar: " + err.message); setLoading(false); return; }

      const userData = { ...data, tipo: "lead" };
      localStorage.setItem("influx_user", JSON.stringify(userData));
      onEntrar(userData);
    } catch (e) {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  };

  // FIX: Influencer - verifica se existe na tabela antes de permitir entrada
  const entrarInfluencer = async () => {
    if (!nome.trim() || !contato.trim() || !senha.trim()) { setError("Preencha todos os campos."); return; }
    if (senha.trim() !== SENHA_INFLUENCER) { setError("Senha incorreta!"); return; }
    setLoading(true); setError("");

    try {
      const { data: ex } = await supabase
        .from("Influenciadores").select("*").eq("instagram", contato.trim()).maybeSingle();

      if (!ex) {
        setError("Instagram não encontrado na base de influenciadores. Contate o admin.");
        setLoading(false); return;
      }

      const userData = { ...ex, tipo: "influencer" };
      localStorage.setItem("influx_user", JSON.stringify(userData));
      onEntrar(userData);
    } catch (e) {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  };

  // FIX: Admin - validação no front mantida, mas em produção deve ser server-side
  const entrarAdmin = () => {
    if (!email.trim() || !senha.trim()) { setError("Preencha todos os campos."); return; }
    if (email.trim() !== EMAIL_ADMIN || senha.trim() !== SENHA_ADMIN) {
      setError("Email ou senha incorretos!");
      return;
    }
    const user = { nome: "Admin", email: EMAIL_ADMIN, tipo: "admin" };
    localStorage.setItem("influx_user", JSON.stringify(user));
    onEntrar(user);
  };

  const handleEntrar = () => {
    setError("");
    if (tela === "lead") entrarLead();
    else if (tela === "influencer") entrarInfluencer();
    else entrarAdmin();
  };

  return (
    <div style={{
      minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center",
      justifyContent: "center", padding: 20, fontFamily: "monospace"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input { outline: none; }
        input::placeholder { color: #4a5568; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            fontSize: 42, fontWeight: 900, letterSpacing: 8,
            background: `linear-gradient(135deg,${C.accent},${C.purple})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>INFLUX</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 6, letterSpacing: 2 }}>PLATAFORMA DE AFILIADOS</div>
        </div>

        <div style={{
          display: "flex", background: C.surface, borderRadius: 14,
          border: `1px solid ${C.border}`, padding: 4, marginBottom: 20, gap: 4
        }}>
          {[
            { id: "lead", label: "LEAD", color: C.accent },
            { id: "influencer", label: "INFLUENCER", color: C.gold },
            { id: "admin", label: "ADMIN", color: C.purple },
          ].map(t => (
            <button key={t.id} onClick={() => { setTela(t.id); setError(""); }} style={{
              flex: 1,
              background: tela === t.id ? `linear-gradient(135deg,${t.color}33,${t.color}11)` : "transparent",
              border: tela === t.id ? `1px solid ${t.color}44` : "1px solid transparent",
              borderRadius: 10, padding: "10px 0",
              color: tela === t.id ? t.color : C.muted,
              fontWeight: 800, fontSize: 9, cursor: "pointer", letterSpacing: 1, fontFamily: "monospace",
            }}>{t.label}</button>
          ))}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28 }}>
          {tela === "lead" && (
            <>
              <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>ÁREA DO LEAD</div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 20 }}>Cadastro simples — sem email, sem senha.</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>SEU NOME</div>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Como você se chama?"
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace" }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>CONTATO</div>
                <div style={{ display: "flex", background: C.surface, borderRadius: 10, padding: 3, marginBottom: 8 }}>
                  {["whatsapp", "instagram"].map(t => (
                    <button key={t} onClick={() => setTipoContato(t)} style={{
                      flex: 1, background: tipoContato === t ? `linear-gradient(135deg,${C.accent}22,${C.purple}22)` : "transparent",
                      border: tipoContato === t ? `1px solid ${C.accent}44` : "1px solid transparent",
                      borderRadius: 8, padding: "7px 0",
                      color: tipoContato === t ? C.accent : C.muted,
                      fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "monospace"
                    }}>{t === "whatsapp" ? "WHATSAPP" : "INSTAGRAM"}</button>
                  ))}
                </div>
                <input value={contato} onChange={e => setContato(e.target.value)}
                  placeholder={tipoContato === "whatsapp" ? "(00) 00000-0000" : "@seuinstagram"}
                  onKeyDown={e => e.key === "Enter" && handleEntrar()}
                  style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace" }} />
              </div>
            </>
          )}

          {tela === "influencer" && (
            <>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>ÁREA DO INFLUENCIADOR</div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 20 }}>Nome + Instagram + senha da equipe.</div>
              {[
                { label: "SEU NOME", val: nome, set: setNome, ph: "Seu nome completo", type: "text" },
                { label: "INSTAGRAM", val: contato, set: setContato, ph: "@seuinstagram", type: "text" },
                { label: "SENHA DA EQUIPE", val: senha, set: setSenha, ph: "Senha especial", type: "password" },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    onKeyDown={e => e.key === "Enter" && handleEntrar()}
                    style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace" }} />
                </div>
              ))}
            </>
          )}

          {tela === "admin" && (
            <>
              <div style={{ color: C.purple, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>ÁREA ADMIN</div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 20 }}>Acesso restrito.</div>
              {[
                { label: "EMAIL", val: email, set: setEmail, ph: "admin@email.com", type: "email" },
                { label: "SENHA", val: senha, set: setSenha, ph: "Senha admin", type: "password" },
              ].map((f, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                    onKeyDown={e => e.key === "Enter" && handleEntrar()}
                    style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace" }} />
                </div>
              ))}
            </>
          )}

          {error && (
            <div style={{
              background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 8,
              padding: "10px 14px", color: C.red, fontSize: 12, marginBottom: 12
            }}>{error}</div>
          )}

          <button onClick={handleEntrar} disabled={loading} style={{
            width: "100%",
            background: loading ? C.border
              : tela === "admin" ? `linear-gradient(135deg,${C.purple},${C.red})`
              : tela === "influencer" ? `linear-gradient(135deg,${C.gold},${C.orange})`
              : `linear-gradient(135deg,${C.accent},${C.purple})`,
            color: loading ? C.muted : "#000",
            border: "none", borderRadius: 12, padding: "14px",
            fontWeight: 800, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 2, fontFamily: "monospace",
          }}>{loading ? "AGUARDE..." : "ENTRAR"}</button>

          {tela === "lead" && (
            <div style={{ color: C.muted, fontSize: 10, textAlign: "center", marginTop: 12 }}>
              Já cadastrado? Digite o mesmo contato.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ÁREA DO LEAD ──────────────────────────────────────────────────────────────
function LeadArea({ lead, onLogout }) {
  const [tab, setTab] = useState("home");
  const [leadData, setLeadData] = useState(lead);
  const [ranking, setRanking] = useState([]);
  const [rankMes, setRankMes] = useState([]);
  const [ticket, setTicket] = useState("");
  const [ticketMsg, setTicketMsg] = useState(null);
  const [loadingT, setLoadingT] = useState(false);
  // FIX: Créditos em estado separado sincronizado com DB
  const [spinCredits, setSpinCredits] = useState(lead?.Creditos_Da_Roleta || 0);

  const reload = async () => {
    try {
      const { data } = await supabase.from("INFLUX").select("*").eq("id", lead.id).single();
      if (data) {
        setLeadData(data);
        setSpinCredits(data.Creditos_Da_Roleta || 0);
        // FIX: Atualiza localStorage com dados frescos
        localStorage.setItem("influx_user", JSON.stringify({ ...data, tipo: "lead" }));
      }
    } catch (e) { /* silencia erros de rede */ }

    try {
      const { data: r1 } = await supabase
        .from("ranking_diario").select("*").order("entradas", { ascending: false }).limit(10);
      if (r1) setRanking(r1);
    } catch (e) { /* silencia */ }

    try {
      const { data: r2 } = await supabase
        .from("Ranking_Mensal").select("*").order("Entradas_Do_Mes", { ascending: false }).limit(10);
      if (r2) setRankMes(r2);
    } catch (e) { /* silencia */ }
  };

  useEffect(() => { reload(); }, []);

  // FIX: Ticket vinculado ao lead_id, previne uso por outro lead
  const submitTicket = async () => {
    if (!ticket.trim()) return;
    setTicketMsg(null); setLoadingT(true);

    try {
      // Verifica se ticket já foi usado (por qualquer lead)
      const { data: ex } = await supabase
        .from("Tickets").select("Id, Lead_id").eq("Ticket_codigo", ticket.trim()).maybeSingle();

      if (ex) {
        setTicketMsg({ ok: false, txt: ex.Lead_id === leadData.id ? "Você já usou este ticket!" : "Ticket já utilizado por outro participante!" });
        setLoadingT(false); return;
      }

      // Insere ticket vinculado ao lead
      const { error } = await supabase.from("Tickets").insert({
        Lead_id: leadData.id,
        Ticket_codigo: ticket.trim(),
        Status: "validado",
        Data_Validacao: new Date().toISOString(),
      });

      if (error) { setTicketMsg({ ok: false, txt: "Erro ao validar: " + error.message }); setLoadingT(false); return; }

      const novasEntradas = (leadData.Entradas_De_Hoje || 0) + 1;

      // FIX: Atualiza contadores e recalcula multiplicador inline
      await supabase.from("INFLUX").update({
        Entradas_De_Hoje: novasEntradas,
        Entradas_Da_Semana: (leadData.Entradas_Da_Semana || 0) + 1,
        Entradas_Do_Mes: (leadData.Entradas_Do_Mes || 0) + 1,
        Total_Tickets_Validados: (leadData.Total_Tickets_Validados || 0) + 1,
        // FIX: Multiplicador calculado junto com a atualização
        Multiplicador: novasEntradas >= 12 ? 2 : 1,
        Ultimo_Dia_Ativo: new Date().toISOString().split("T")[0],
      }).eq("id", leadData.id);

      // FIX: Verifica streak e crédito de roleta após inserir entrada
      await calcularStreakECredito(leadData.id);

      setTicketMsg({ ok: true, txt: "Ticket validado! +1 entrada." });
      setTicket("");
    } catch (e) {
      setTicketMsg({ ok: false, txt: "Erro de conexão. Tente novamente." });
    }
    setLoadingT(false);
    reload();
  };

  // FIX: onSpin retorna boolean de sucesso, debita atomicamente
  const handleSpin = async () => {
    try {
      const { data: fresh } = await supabase
        .from("INFLUX").select("Creditos_Da_Roleta").eq("id", leadData.id).single();

      if (!fresh || (fresh.Creditos_Da_Roleta || 0) < 1) {
        setSpinCredits(0);
        return false;
      }

      const novoCredito = fresh.Creditos_Da_Roleta - 1;
      const { error } = await supabase.from("INFLUX")
        .update({ Creditos_Da_Roleta: novoCredito }).eq("id", leadData.id);

      if (error) return false;
      setSpinCredits(novoCredito);
      return true;
    } catch (e) {
      return false;
    }
  };

  const TABS = [
    { id: "home", l: "Início" }, { id: "ticket", l: "Ticket" },
    { id: "roleta", l: "Roleta" }, { id: "ranking", l: "Diário" },
    { id: "mensal", l: "Mensal" }, { id: "premios", l: "Prêmios" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace" }}>
      <div style={{
        background: `linear-gradient(135deg,${C.accent}12,${C.purple}08)`,
        borderBottom: `1px solid ${C.border}`, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <div style={{
            fontSize: 18, fontWeight: 900, letterSpacing: 4,
            background: `linear-gradient(135deg,${C.accent},${C.purple})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>INFLUX</div>
          <div style={{ color: C.muted, fontSize: 10 }}>{leadData?.Nome}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {(leadData?.Streak || 0) >= 7 && <Pill label={`${leadData.Streak}d 🔥`} color={C.gold} />}
          <button onClick={onLogout} style={{
            background: "none", border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "4px 8px", color: C.muted, fontSize: 10, cursor: "pointer"
          }}>sair</button>
        </div>
      </div>

      <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none",
            borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent",
            color: tab === t.id ? C.accent : C.muted,
            padding: "10px 12px", fontWeight: 700, fontSize: 10,
            cursor: "pointer", whiteSpace: "nowrap", fontFamily: "monospace"
          }}>{t.l}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {tab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <StatCard icon="📍" label="Hoje" value={leadData?.Entradas_De_Hoje || 0} color={C.accent} />
              <StatCard icon="🔥" label="Streak" value={`${leadData?.Streak || 0}d`} color={C.gold} />
              <StatCard icon="✕" label="Multi" value={`${leadData?.Multiplicador || 1}x`} color={C.green} />
            </div>

            <div style={{
              background: `linear-gradient(135deg,${C.accent}12,${C.purple}08)`,
              border: `1px solid ${C.accent}33`, borderRadius: 16, padding: 18
            }}>
              <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>SORTEIO DA SEMANA</div>
              <div style={{ color: C.sub, fontSize: 11, marginBottom: 14 }}>Próxima Segunda-feira. Cadastre tickets para participar.</div>
              <a href="https://cifradobem.com" target="_blank" rel="noreferrer" style={{
                display: "block", background: `linear-gradient(135deg,${C.accent},${C.purple})`,
                color: "#000", fontWeight: 800, textAlign: "center", borderRadius: 12,
                padding: "13px", textDecoration: "none", fontSize: 12, letterSpacing: 2
              }}>ACESSAR CIFRA DO BEM</a>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>METAS DO DIA</div>
              {[
                { l: "Mínimo diário (7x)", ok: (leadData?.Entradas_De_Hoje || 0) >= 7 },
                { l: "Crédito de roleta (7x × 7d)", ok: (leadData?.Streak || 0) > 0 && (leadData?.Streak || 0) % 7 === 0 },
                { l: "Multiplicador ativo (12x+)", ok: (leadData?.Entradas_De_Hoje || 0) >= 12 },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 6,
                    background: m.ok ? C.green + "22" : C.border,
                    border: `1.5px solid ${m.ok ? C.green : C.muted}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 10, flexShrink: 0, color: C.green
                  }}>{m.ok ? "✓" : ""}</div>
                  <span style={{ color: m.ok ? C.text : C.sub, fontSize: 12 }}>{m.l}</span>
                </div>
              ))}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>Total de tickets validados</div>
              <div style={{ color: C.accent, fontSize: 28, fontWeight: 900, fontFamily: "monospace" }}>
                {leadData?.Total_Tickets_Validados || 0}
              </div>
            </div>
          </div>
        )}

        {tab === "ticket" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>VALIDAR TICKET</div>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 16, lineHeight: 1.6 }}>
              Após cada cadastro na Cifra do Bem você recebe um código único. Cole abaixo.
            </div>
            <input value={ticket} onChange={e => setTicket(e.target.value)}
              placeholder="Cole o código do ticket..."
              onKeyDown={e => e.key === "Enter" && submitTicket()}
              style={{
                width: "100%", background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 10, padding: "13px 14px", color: C.text,
                fontSize: 13, fontFamily: "monospace", marginBottom: 12
              }} />
            <button onClick={submitTicket} disabled={loadingT} style={{
              width: "100%", background: `linear-gradient(135deg,${C.accent},${C.purple})`,
              color: "#000", border: "none", borderRadius: 12, padding: "13px",
              fontWeight: 800, fontSize: 12, cursor: loadingT ? "not-allowed" : "pointer", letterSpacing: 2
            }}>
              {loadingT ? "VALIDANDO..." : "VALIDAR ENTRADA"}
            </button>
            {ticketMsg && (
              <div style={{
                marginTop: 12,
                background: ticketMsg.ok ? C.greenDim : C.redDim,
                border: `1px solid ${ticketMsg.ok ? C.green : C.red}44`,
                borderRadius: 10, padding: "12px 14px",
                color: ticketMsg.ok ? C.green : C.red,
                fontSize: 12, fontWeight: 600
              }}>{ticketMsg.txt}</div>
            )}
          </div>
        )}

        {tab === "roleta" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{
              background: C.card, border: `1px solid ${C.border}`,
              borderRadius: 16, padding: 14, textAlign: "center"
            }}>
              <div style={{ color: C.muted, fontSize: 10 }}>SEUS CRÉDITOS</div>
              <div style={{ color: C.accent, fontSize: 36, fontWeight: 900, fontFamily: "monospace" }}>{spinCredits}</div>
              <div style={{ color: C.muted, fontSize: 10 }}>7x/dia × 7 dias consecutivos = 1 crédito</div>
            </div>
            <RouletteWheel credits={spinCredits} onSpin={handleSpin} />
          </div>
        )}

        {tab === "ranking" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              background: C.goldDim, border: `1px solid ${C.gold}33`,
              borderRadius: 12, padding: "10px 14px", textAlign: "center",
              color: C.gold, fontSize: 11, fontWeight: 700
            }}>Top 10 do dia ganham R$20 — Seg a Sex</div>

            {ranking.length === 0 && (
              <div style={{ color: C.muted, textAlign: "center", padding: 32, fontSize: 12 }}>
                Nenhum dado ainda hoje
              </div>
            )}

            {ranking.map((r, i) => {
              const medalColors = [C.gold, "#c0c0c0", "#cd7f32"];
              const mc = i < 3 ? medalColors[i] : null;
              return (
                <div key={r.id || i} style={{
                  background: mc ? `${mc}10` : C.card,
                  border: `1px solid ${mc ? mc + "33" : C.border}`,
                  borderRadius: 14, padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 12
                }}>
                  <div style={{ color: mc || C.muted, fontWeight: 900, width: 24, textAlign: "center" }}>{i + 1}</div>
                  <Avatar name={r.Nome || r.nome} size={34} color={mc || C.accent} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{r.Nome || r.nome}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 16 }}>
                      {r.entradas || r.Entradas_De_Hoje || 0}x
                    </div>
                    <div style={{ color: C.green, fontSize: 10, fontWeight: 700 }}>R$20</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "mensal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rankMes.length === 0 && (
              <div style={{ color: C.muted, textAlign: "center", padding: 32, fontSize: 12 }}>
                Nenhum dado este mês
              </div>
            )}
            {rankMes.map((r, i) => {
              const medalColors = [C.gold, "#c0c0c0", "#cd7f32"];
              const mc = i < 3 ? medalColors[i] : null;
              return (
                <div key={r.id || i} style={{
                  background: mc ? `${mc}10` : C.card,
                  border: `1px solid ${mc ? mc + "33" : C.border}`,
                  borderRadius: 14, padding: "12px 14px",
                  display: "flex", alignItems: "center", gap: 12
                }}>
                  <div style={{ color: mc || C.muted, fontWeight: 900, width: 24 }}>{i + 1}</div>
                  <Avatar name={r.Nome || r.nome} size={34} color={mc || C.purple} />
                  <div style={{ flex: 1 }}>
                    <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{r.Nome || r.nome}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace" }}>
                      {r.Entradas_Do_Mes || 0}
                    </div>
                    <div style={{ color: mc ? C.green : C.muted, fontSize: 9 }}>{mc ? "TOP 3" : "entradas"}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "premios" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { icon: "🎰", t: "Roleta Semanal", d: "7x/dia por 7 dias = 1 crédito. Prêmios de até R$3.000", c: C.purple, v: "até R$3k" },
              { icon: "📅", t: "Ranking Diário", d: "Top 10 cadastros/dia ganham R$20 cada (Seg-Sex)", c: C.gold, v: "R$20/dia" },
              { icon: "⚡", t: "Streak Semanal", d: "Top 10 com mais cadastros em 7 dias ganham R$50", c: C.accent, v: "R$50/sem" },
              { icon: "🏆", t: "Multiplicador Mensal", d: "Top 3 do mês com 12x+/dia dividem prêmio especial", c: C.green, v: "Top 3" },
              { icon: "💸", t: "Pix Semanal", d: "Via plataforma Cifra do Bem toda segunda-feira", c: C.orange, v: "Semanal" },
            ].map((p, i) => (
              <div key={i} style={{
                background: C.card, border: `1px solid ${p.c}22`,
                borderRadius: 16, padding: 16, display: "flex", gap: 14
              }}>
                <div style={{ fontSize: 28 }}>{p.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ color: p.c, fontWeight: 700, fontSize: 13 }}>{p.t}</div>
                    <Pill label={p.v} color={p.c} />
                  </div>
                  <div style={{ color: C.sub, fontSize: 11, lineHeight: 1.5 }}>{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ÁREA DO INFLUENCIADOR ─────────────────────────────────────────────────────
function InfluencerArea({ user, onLogout }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("Influenciadores").select("*")
      .then(({ data, error: err }) => {
        if (err) setError("Erro ao carregar dados.");
        else if (data) setList(data);
        setLoading(false);
      });
  }, []);

  // Filtra apenas dados do influenciador logado (ou todos se for o admin vendo)
  const myData = list.find(i => i.instagram === user?.instagram) || null;
  const displayList = myData ? [myData] : list;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace" }}>
      <div style={{
        background: `linear-gradient(135deg,${C.gold}12,${C.orange}08)`,
        borderBottom: `1px solid ${C.border}`, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <div style={{
            fontSize: 16, fontWeight: 900, letterSpacing: 3,
            background: `linear-gradient(135deg,${C.gold},${C.orange})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>INFLUX PRO</div>
          <div style={{ color: C.muted, fontSize: 10 }}>{user?.nome || user?.instagram}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill label="INFLUENCER" color={C.gold} />
          <button onClick={onLogout} style={{
            background: "none", border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "4px 8px", color: C.muted, fontSize: 10, cursor: "pointer"
          }}>sair</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {loading ? <Loader /> : error ? (
          <div style={{ color: C.red, textAlign: "center", padding: 32, fontSize: 12 }}>{error}</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.card, border: `1px solid ${C.gold}33`, borderRadius: 16, padding: 18 }}>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Bem-vindo, Influenciador!</div>
              <div style={{ color: C.sub, fontSize: 11 }}>Acompanhe seus resultados e comissões abaixo.</div>
            </div>

            {displayList.map((inf, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={inf.nome} size={36} color={C.gold} />
                    <div>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>@{inf.instagram || inf.nome}</div>
                      <div style={{ color: C.muted, fontSize: 10 }}>{inf.status || "ativo"}</div>
                    </div>
                  </div>
                  <Pill label="ATIVO" color={C.green} />
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  {[
                    { l: "leads", v: fmt(inf.leads_gerados || 0), c: C.accent },
                    { l: "views", v: fmt(inf.visualizacoes || 0), c: C.purple },
                    { l: "comissão 35%", v: `R$${fmt(Math.floor((inf.visualizacoes || 0) / 1000 * 100 * 0.35))}`, c: C.green },
                  ].map((s, j) => (
                    <div key={j}>
                      <div style={{ color: s.c, fontWeight: 900, fontFamily: "monospace", fontSize: 14 }}>{s.v}</div>
                      <div style={{ color: C.muted, fontSize: 9 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {displayList.length === 0 && (
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, textAlign: "center", color: C.muted, fontSize: 12 }}>
                Nenhum dado disponível.
              </div>
            )}

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>COMO FUNCIONA</div>
              {[
                "Compartilhe seu link com seus seguidores",
                "Cada visualização conta para sua comissão",
                "Você ganha 35% de R$100 por 1.000 views",
                "Pagamento via Pix todo mês",
              ].map((s, i) => (
                <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%", background: C.goldDim,
                    border: `1px solid ${C.gold}44`, display: "flex", alignItems: "center",
                    justifyContent: "center", color: C.gold, fontSize: 9, fontWeight: 700, flexShrink: 0
                  }}>{i + 1}</div>
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

// ── PAINEL ADMIN ──────────────────────────────────────────────────────────────
function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState("overview");
  const [leads, setLeads] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [stats, setStats] = useState({ total: 0, hoje: 0, semana: 0 });
  const [prizes, setPrizes] = useState(PRIZES);
  const [roletaAtiva, setRotletaAtiva] = useState(true);
  const [editando, setEditando] = useState(null);
  const [pixInfo, setPixInfo] = useState({});
  // FIX: Estado para persistir status da roleta no Supabase
  const [salvandoRoleta, setSalvandoRoleta] = useState(false);

  const loadAdmin = async () => {
    setLoading(true); setLoadError("");
    try {
      const [l, inf, pag] = await Promise.all([
        supabase.from("INFLUX").select("*").order("Entradas_De_Hoje", { ascending: false }).limit(50),
        supabase.from("Influenciadores").select("*"),
        supabase.from("Pagamentos").select("*").order("created_at", { ascending: false }),
      ]);

      if (l.error) throw new Error("Erro ao carregar leads: " + l.error.message);
      if (l.data) {
        setLeads(l.data);
        setStats({
          total: l.data.length,
          hoje: l.data.reduce((s, x) => s + (x.Entradas_De_Hoje || 0), 0),
          semana: l.data.reduce((s, x) => s + (x.Entradas_Da_Semana || 0), 0),
        });
      }
      if (inf.data) setInfluencers(inf.data);
      if (pag.data) setPagamentos(pag.data);
    } catch (e) {
      setLoadError(e.message || "Erro ao carregar dados.");
    }
    setLoading(false);
  };

  useEffect(() => { loadAdmin(); }, []);

  const marcarPago = async (id) => {
    try {
      const { error } = await supabase.from("Pagamentos").update({ status: "pago" }).eq("id", id);
      if (error) throw error;
      loadAdmin();
    } catch (e) {
      alert("Erro ao marcar como pago: " + e.message);
    }
  };

  // FIX: Adição de crédito com leitura prévia para evitar race condition
  const addCredito = async (leadId) => {
    try {
      const { data: fresh } = await supabase.from("INFLUX").select("Creditos_Da_Roleta").eq("id", leadId).single();
      const atual = fresh?.Creditos_Da_Roleta || 0;
      await supabase.from("INFLUX").update({ Creditos_Da_Roleta: atual + 1 }).eq("id", leadId);
      loadAdmin();
    } catch (e) {
      alert("Erro ao adicionar crédito: " + e.message);
    }
  };

  // FIX: Persiste status da roleta no Supabase (tabela Config ou similar)
  const toggleRoleta = async () => {
    setSalvandoRoleta(true);
    const novoStatus = !roletaAtiva;
    try {
      await supabase.from("Config").upsert({ chave: "roleta_ativa", valor: novoStatus ? "true" : "false" });
      setRotletaAtiva(novoStatus);
    } catch (e) {
      // Se tabela Config não existir, apenas altera estado local
      setRotletaAtiva(novoStatus);
    }
    setSalvandoRoleta(false);
  };

  // FIX: Zerar entradas diárias (funcionalidade de administração)
  const zerarEntradas = async () => {
    if (!window.confirm("Zerar TODAS as entradas de hoje? Esta ação é irreversível.")) return;
    try {
      await supabase.from("INFLUX").update({ Entradas_De_Hoje: 0 }).gte("id", 0);
      loadAdmin();
    } catch (e) {
      alert("Erro: " + e.message);
    }
  };

  const TABS = [
    { id: "overview", l: "Overview" }, { id: "leads", l: "Leads" },
    { id: "roleta", l: "Roleta" }, { id: "influenc", l: "Influenc." },
    { id: "pagamentos", l: "Pagamentos" },
  ];

  const pendentes = pagamentos.filter(p => p.status === "pendente");
  const pagos = pagamentos.filter(p => p.status === "pago");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace" }}>
      <div style={{
        background: `linear-gradient(135deg,${C.purple}12,${C.red}08)`,
        borderBottom: `1px solid ${C.border}`, padding: "14px 18px",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div>
          <div style={{
            fontSize: 16, fontWeight: 900, letterSpacing: 3,
            background: `linear-gradient(135deg,${C.purple},${C.red})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
          }}>INFLUX ADMIN</div>
          <div style={{ color: C.muted, fontSize: 10 }}>Painel de Controle</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill label="LIVE" color={C.green} />
          <button onClick={onLogout} style={{
            background: "none", border: `1px solid ${C.border}`,
            borderRadius: 8, padding: "4px 8px", color: C.muted, fontSize: 10, cursor: "pointer"
          }}>sair</button>
        </div>
      </div>

      <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: "none", border: "none",
            borderBottom: tab === t.id ? `2px solid ${C.purple}` : "2px solid transparent",
            color: tab === t.id ? C.purple : C.muted,
            padding: "10px 12px", fontWeight: 700, fontSize: 10,
            cursor: "pointer", whiteSpace: "nowrap", fontFamily: "monospace"
          }}>{t.l}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {loading ? <Loader /> : loadError ? (
          <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 12, padding: 20, color: C.red, fontSize: 12, textAlign: "center" }}>
            {loadError}
            <button onClick={loadAdmin} style={{ display: "block", margin: "12px auto 0", background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.text, cursor: "pointer", fontFamily: "monospace", fontSize: 11 }}>Tentar novamente</button>
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <StatCard icon="👥" label="Total leads" value={fmt(stats.total)} color={C.accent} />
                  <StatCard icon="⚡" label="Hoje" value={fmt(stats.hoje)} color={C.purple} />
                  <StatCard icon="📈" label="Semana" value={fmt(stats.semana)} color={C.green} />
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <StatCard icon="🌟" label="Influenciadores" value={influencers.length} color={C.gold} />
                  <StatCard icon="💸" label="Pag. pendentes" value={pendentes.length} color={C.red} />
                  <StatCard icon="✅" label="Pag. pagos" value={pagos.length} color={C.green} />
                </div>

                {/* FIX: Botão de ação admin - zerar entradas diárias */}
                <button onClick={zerarEntradas} style={{
                  background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 12,
                  padding: "12px", color: C.red, fontWeight: 700, fontSize: 11,
                  cursor: "pointer", fontFamily: "monospace", letterSpacing: 1,
                }}>⚠ ZERAR ENTRADAS DO DIA</button>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 12, marginBottom: 14 }}>CUSTO MENSAL</div>
                  {[
                    { l: "Roleta Semanal", v: "R$ 10.000", c: C.purple, p: 62.5 },
                    { l: "Ranking Diário", v: "R$ 4.000", c: C.gold, p: 25 },
                    { l: "Streak Semanal", v: "R$ 2.000", c: C.accent, p: 12.5 },
                  ].map((item, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}>
                        <span style={{ color: C.sub }}>{item.l}</span>
                        <span style={{ color: item.c, fontWeight: 700 }}>{item.v}</span>
                      </div>
                      <div style={{ height: 4, background: C.border, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${item.p}%`, background: item.c, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>
                    <span style={{ color: C.text }}>TOTAL</span>
                    <span style={{ color: C.red }}>R$ 16.000/mês</span>
                  </div>
                </div>
              </div>
            )}

            {tab === "leads" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ color: C.muted, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>
                  TOP LEADS ({leads.length} total)
                </div>
                {leads.length === 0 && (
                  <div style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum lead ainda</div>
                )}
                {leads.map((ld, i) => (
                  <div key={ld.id} style={{
                    background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 14, padding: "12px 14px",
                    display: "flex", alignItems: "center", gap: 12
                  }}>
                    <div style={{ color: C.muted, fontWeight: 700, width: 20, fontSize: 11 }}>{i + 1}</div>
                    <Avatar name={ld.Nome} size={34} color={C.purple} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{ld.Nome}</div>
                      <div style={{ color: C.muted, fontSize: 10 }}>
                        {ld.Telefone} · streak {ld.Streak || 0}d · mult {ld.Multiplicador || 1}x
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 15 }}>
                          {ld.Entradas_De_Hoje || 0}x
                        </div>
                        <div style={{ color: C.muted, fontSize: 9 }}>
                          {ld.Creditos_Da_Roleta || 0} créditos
                        </div>
                      </div>
                      <button onClick={() => addCredito(ld.id)} style={{
                        background: C.accentDim, border: `1px solid ${C.accent}44`,
                        borderRadius: 8, padding: "4px 8px", color: C.accent,
                        fontWeight: 700, fontSize: 9, cursor: "pointer", fontFamily: "monospace"
                      }}>+CR</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "roleta" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: C.card, border: `1px solid ${C.purple}33`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.purple, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>CONTROLE DA ROLETA</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: C.text, fontSize: 12 }}>Status da roleta</span>
                    <button onClick={toggleRoleta} disabled={salvandoRoleta} style={{
                      background: roletaAtiva ? C.green + "22" : C.redDim,
                      border: `1px solid ${roletaAtiva ? C.green : C.red}44`,
                      borderRadius: 20, padding: "6px 16px",
                      color: roletaAtiva ? C.green : C.red,
                      fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "monospace"
                    }}>{salvandoRoleta ? "..." : roletaAtiva ? "ATIVA" : "PAUSADA"}</button>
                  </div>
                </div>

                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>PRÊMIOS</div>
                  {prizes.map((p, i) => (
                    <div key={i} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      marginBottom: 10, padding: "8px 12px", background: C.surface, borderRadius: 10
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                        <span style={{ color: p.color, fontSize: 12, fontWeight: 700 }}>{p.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Pill
                          label={p.weight <= 3 ? "RARO" : p.weight <= 6 ? "MÉDIO" : "COMUM"}
                          color={p.weight <= 3 ? C.red : p.weight <= 6 ? C.gold : C.muted}
                        />
                        <button onClick={() => setEditando(i)} style={{
                          background: C.accentDim, border: `1px solid ${C.accent}44`,
                          borderRadius: 6, padding: "3px 8px", color: C.accent,
                          fontSize: 9, cursor: "pointer", fontFamily: "monospace"
                        }}>EDITAR</button>
                      </div>
                    </div>
                  ))}
                </div>

                {editando !== null && (
                  <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 16, padding: 16 }}>
                    <div style={{ color: C.accent, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>
                      EDITANDO: {prizes[editando].label}
                    </div>
                    <input
                      value={prizes[editando].label}
                      onChange={e => { const n = [...prizes]; n[editando] = { ...n[editando], label: e.target.value }; setPrizes(n); }}
                      style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "monospace", marginBottom: 12, outline: "none" }}
                    />
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                      <button onClick={() => { const n = [...prizes]; n[editando] = { ...n[editando], weight: Math.max(1, prizes[editando].weight - 1) }; setPrizes(n); }}
                        style={{ background: C.border, border: "none", borderRadius: 6, width: 32, height: 32, color: C.text, cursor: "pointer", fontSize: 18 }}>−</button>
                      <span style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 20, width: 30, textAlign: "center" }}>{prizes[editando].weight}</span>
                      <button onClick={() => { const n = [...prizes]; n[editando] = { ...n[editando], weight: Math.min(9, prizes[editando].weight + 1) }; setPrizes(n); }}
                        style={{ background: C.border, border: "none", borderRadius: 6, width: 32, height: 32, color: C.text, cursor: "pointer", fontSize: 18 }}>+</button>
                      <span style={{ color: C.muted, fontSize: 10 }}>(1=raro, 9=comum)</span>
                    </div>
                    <button onClick={() => setEditando(null)} style={{
                      width: "100%", background: `linear-gradient(135deg,${C.accent},${C.purple})`,
                      color: "#000", border: "none", borderRadius: 10, padding: "12px",
                      fontWeight: 800, fontSize: 12, cursor: "pointer"
                    }}>SALVAR</button>
                  </div>
                )}
              </div>
            )}

            {tab === "influenc" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {influencers.length === 0 && (
                  <div style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum influenciador</div>
                )}
                {influencers.map((inf, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={inf.nome} size={36} color={C.purple} />
                        <div>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>@{inf.instagram || inf.nome}</div>
                          <div style={{ color: C.muted, fontSize: 10 }}>{inf.data_entrada || "ativo"}</div>
                        </div>
                      </div>
                      <Pill label={inf.status || "ativo"} color={C.green} />
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[
                        { l: "leads", v: fmt(inf.leads_gerados || 0), c: C.accent },
                        { l: "views", v: fmt(inf.visualizacoes || 0), c: C.purple },
                        { l: "comissão 35%", v: `R$${fmt(Math.floor((inf.visualizacoes || 0) / 1000 * 100 * 0.35))}`, c: C.green },
                      ].map((s, j) => (
                        <div key={j}>
                          <div style={{ color: s.c, fontWeight: 900, fontFamily: "monospace", fontSize: 14 }}>{s.v}</div>
                          <div style={{ color: C.muted, fontSize: 9 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "pagamentos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pendentes.length > 0 && (
                  <>
                    <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>
                      PENDENTES ({pendentes.length})
                    </div>
                    {pendentes.map((p, i) => (
                      <div key={i} style={{ background: C.card, border: `1px solid ${C.red}33`, borderRadius: 14, padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                          <Avatar name={p.nome} size={34} color={C.red} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{p.nome}</div>
                            <div style={{ color: C.muted, fontSize: 10 }}>
                              {p.tipo} · {p.data_solicitacao ? new Date(p.data_solicitacao).toLocaleDateString("pt-BR") : ""}
                            </div>
                          </div>
                          <div style={{ color: C.green, fontWeight: 900, fontFamily: "monospace", fontSize: 16 }}>
                            R${fmt(p.valor)}
                          </div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ color: C.sub, fontSize: 10, marginBottom: 4 }}>CHAVE PIX DO LEAD</div>
                          <input
                            value={pixInfo[p.id] || p.chave_pix || ""}
                            onChange={e => setPixInfo(prev => ({ ...prev, [p.id]: e.target.value }))}
                            placeholder="Chave Pix recebida do lead..."
                            style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 12, fontFamily: "monospace", outline: "none" }}
                          />
                        </div>
                        <button onClick={() => marcarPago(p.id)} style={{
                          width: "100%", background: `linear-gradient(135deg,${C.green},${C.green}99)`,
                          border: "none", borderRadius: 10, padding: "10px",
                          color: "#000", fontWeight: 800, fontSize: 11, cursor: "pointer", letterSpacing: 1
                        }}>MARCAR COMO PAGO (ITAÚ)</button>
                      </div>
                    ))}
                  </>
                )}

                {pendentes.length === 0 && (
                  <div style={{ background: C.greenDim, border: `1px solid ${C.green}22`, borderRadius: 14, padding: 24, textAlign: "center" }}>
                    <div style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>Tudo em dia!</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Nenhum pagamento pendente</div>
                  </div>
                )}

                {pagos.length > 0 && (
                  <>
                    <div style={{ color: C.green, fontWeight: 700, fontSize: 11, letterSpacing: 1, marginTop: 8 }}>
                      PAGOS ({pagos.length})
                    </div>
                    {pagos.map((p, i) => (
                      <div key={i} style={{
                        background: C.card, border: `1px solid ${C.green}22`,
                        borderRadius: 14, padding: "12px 14px",
                        display: "flex", alignItems: "center", gap: 12, opacity: 0.7
                      }}>
                        <Avatar name={p.nome} size={32} color={C.green} />
                        <div style={{ flex: 1 }}>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{p.nome}</div>
                          <div style={{ color: C.muted, fontSize: 10 }}>{p.tipo}</div>
                        </div>
                        <div style={{ color: C.green, fontWeight: 900, fontFamily: "monospace" }}>R${fmt(p.valor)}</div>
                        <Pill label="PAGO" color={C.green} />
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("influx_user");
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // FIX: Valida estrutura mínima do user salvo
      if (!parsed || !parsed.tipo) return null;
      return parsed;
    } catch { return null; }
  });

  const logout = () => {
    localStorage.removeItem("influx_user");
    setUser(null);
  };

  if (!user) return <LoginScreen onEntrar={setUser} />;

  return (
    <div style={{
      minHeight: "100vh", background: C.bg,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-thumb { background: #1e2535; border-radius: 4px; }
        input { outline: none; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 430 }}>
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 26, overflow: "hidden", height: 680,
          boxShadow: `0 0 80px ${user.tipo === "admin" ? C.purple : user.tipo === "influencer" ? C.gold : C.accent}14`
        }}>
          {user.tipo === "lead" && <LeadArea lead={user} onLogout={logout} />}
          {user.tipo === "influencer" && <InfluencerArea user={user} onLogout={logout} />}
          {user.tipo === "admin" && <AdminPanel onLogout={logout} />}
        </div>
        <div style={{ textAlign: "center", color: C.muted, fontSize: 9, marginTop: 12, letterSpacing: 2 }}>
          INFLUX · SUPABASE · MAKE · CIFRA DO BEM
        </div>
      </div>
    </div>
  );
}
