import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://luiuglzekpdgeattjukm.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx1aXVnbHpla3BkZ2VhdHRqdWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTAwNzgsImV4cCI6MjA4ODU2NjA3OH0.qZ3JjIoxaFMYJMEThU7jEL4uGowTPJ9G-qHHceXBtqU"
);

const SENHA_INFLUENCER = "INFLUX@equipe2026";
const SENHA_ADMIN = "ADM@influx#2026";

const C = {
  bg: "#05060a", surface: "#0b0d14", card: "#0f1219", border: "#161b28",
  accent: "#00d4ff", accentDim: "#00d4ff18", gold: "#f5c542", goldDim: "#f5c54218",
  green: "#00e87a", greenDim: "#00e87a18", purple: "#9b6dff", purpleDim: "#9b6dff18",
  red: "#ff3d5a", redDim: "#ff3d5a18", orange: "#ff7043",
  text: "#dde3f0", sub: "#8892a4", muted: "#4a5568",
};

const fmt = (n) => new Intl.NumberFormat("pt-BR").format(n ?? 0);
const initials = (name = "") => name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

const Pill = ({ label, color }) => (
  <span style={{ background: color + "22", color, border: `1px solid ${color}44`, borderRadius: 20, padding: "3px 10px", fontSize: 10, fontWeight: 700 }}>{label}</span>
);

const Avatar = ({ name, size = 36, color = C.accent }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: color + "22", border: `1.5px solid ${color}55`, display: "flex", alignItems: "center", justifyContent: "center", color, fontWeight: 800, fontSize: size * 0.3, flexShrink: 0, fontFamily: "monospace" }}>{initials(name)}</div>
);

const Loader = () => (
  <div style={{ display: "flex", justifyContent: "center", padding: 32 }}>
    <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${C.border}`, borderTopColor: C.accent, animation: "spin 0.8s linear infinite" }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const StatCard = ({ icon, label, value, color = C.accent, sub }) => (
  <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px", flex: 1, minWidth: 110, position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />
    <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
    <div style={{ color, fontSize: 22, fontWeight: 900, fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
    <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>{label}</div>
    {sub && <div style={{ color: C.sub, fontSize: 10, marginTop: 3 }}>{sub}</div>}
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
    const canvas = canvasRef.current; if (!canvas) return;
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
    const cGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 24);
    cGrd.addColorStop(0, C.accent + "33"); cGrd.addColorStop(1, C.card);
    ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 2 * Math.PI);
    ctx.fillStyle = cGrd; ctx.fill(); ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = "bold 7px monospace"; ctx.fillStyle = C.accent; ctx.textAlign = "center"; ctx.shadowBlur = 0;
    ctx.fillText("INFLUX", cx, cy + 3);
    ctx.beginPath(); ctx.moveTo(cx + r + 4, cy); ctx.lineTo(cx + r + 18, cy - 8); ctx.lineTo(cx + r + 18, cy + 8); ctx.closePath();
    ctx.fillStyle = C.accent; ctx.shadowColor = C.accent; ctx.shadowBlur = 10; ctx.fill();
  }, []);

  useEffect(() => { draw(0); }, [draw]);

  const spin = () => {
    if (spinning || credits < 1) return;
    setResult(null); setSpinning(true); onSpin();
    const total = 10 * Math.PI + Math.random() * 4 * Math.PI;
    const dur = 4500, t0 = performance.now(), a0 = angleRef.current;
    const go = (now) => {
      const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4);
      angleRef.current = a0 + total * e; draw(angleRef.current);
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
      <canvas ref={canvasRef} width={280} height={280} />
      {result && (
        <div style={{ background: result.color + "18", border: `1px solid ${result.color}66`, borderRadius: 14, padding: "14px 28px", textAlign: "center" }}>
          <div style={{ color: result.color, fontWeight: 800, fontSize: 20 }}>Parabens! {result.label}</div>
          <div style={{ color: C.sub, fontSize: 12, marginTop: 4 }}>Resultado registrado.</div>
        </div>
      )}
      <button onClick={spin} disabled={spinning || credits < 1} style={{
        background: credits >= 1 && !spinning ? `linear-gradient(135deg,${C.accent},${C.purple})` : C.border,
        color: credits >= 1 && !spinning ? "#000" : C.muted, border: "none", borderRadius: 12,
        padding: "14px 36px", fontWeight: 800, fontSize: 13, cursor: credits >= 1 ? "pointer" : "not-allowed",
        letterSpacing: 1.5, transition: "all 0.2s",
      }}>
        {spinning ? "GIRANDO..." : credits >= 1 ? `GIRAR (${credits} credito${credits > 1 ? "s" : ""})` : "SEM CREDITOS"}
      </button>
    </div>
  );
}

// ── TELA LEAD: so nome + whatsapp/instagram ──────────────────────────────────
function LeadCadastro({ onEntrar }) {
  const [nome, setNome] = useState("");
  const [contato, setContato] = useState("");
  const [tipo, setTipo] = useState("whatsapp");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!nome.trim() || !contato.trim()) { setError("Preencha todos os campos."); return; }
    setLoading(true); setError("");
    const { data: ex } = await supabase.from("INFLUX").select("id,Nome").eq("Telefone", contato.trim()).single();
    if (ex) { onEntrar(ex); setLoading(false); return; }
    const { data, error: err } = await supabase.from("INFLUX").insert({
      Nome: nome.trim(), Telefone: contato.trim(),
      Entradas_De_Hoje: 0, Entradas_Da_Semana: 0, Entradas_Do_Mes: 0,
      Streak: 0, Multiplicador: 1, Creditos_Da_Roleta: 0, Ativo: true,
    }).select().single();
    if (err) { setError("Erro ao cadastrar. Tente novamente."); setLoading(false); return; }
    onEntrar(data); setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}input{outline:none}input::placeholder{color:#4a5568}`}</style>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 8, background: `linear-gradient(135deg,${C.accent},${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>INFLUX</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 6, letterSpacing: 2 }}>PLATAFORMA DE AFILIADOS</div>
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28, boxShadow: `0 0 60px ${C.accent}0a` }}>
          <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>ACESSE SUA AREA</div>
          <div style={{ color: C.muted, fontSize: 11, marginBottom: 24 }}>Cadastro simples — sem email, sem senha.</div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>SEU NOME</div>
            <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Como voce se chama?"
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace" }} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 6, letterSpacing: 1 }}>CONTATO</div>
            <div style={{ display: "flex", background: C.surface, borderRadius: 10, padding: 3, marginBottom: 8 }}>
              {["whatsapp", "instagram"].map(t => (
                <button key={t} onClick={() => setTipo(t)} style={{
                  flex: 1, background: tipo === t ? `linear-gradient(135deg,${C.accent}22,${C.purple}22)` : "transparent",
                  border: tipo === t ? `1px solid ${C.accent}44` : "1px solid transparent",
                  borderRadius: 8, padding: "7px 0", color: tipo === t ? C.accent : C.muted,
                  fontWeight: 700, fontSize: 11, cursor: "pointer", letterSpacing: 1, fontFamily: "monospace",
                }}>{t === "whatsapp" ? "WHATSAPP" : "INSTAGRAM"}</button>
              ))}
            </div>
            <input value={contato} onChange={e => setContato(e.target.value)}
              placeholder={tipo === "whatsapp" ? "(00) 00000-0000" : "@seuinstagram"}
              onKeyDown={e => e.key === "Enter" && handle()}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace" }} />
          </div>

          {error && <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 12, marginTop: 8 }}>{error}</div>}

          <button onClick={handle} disabled={loading} style={{
            width: "100%", marginTop: 16,
            background: loading ? C.border : `linear-gradient(135deg,${C.accent},${C.purple})`,
            color: loading ? C.muted : "#000", border: "none", borderRadius: 12, padding: "14px",
            fontWeight: 800, fontSize: 14, cursor: loading ? "not-allowed" : "pointer",
            letterSpacing: 2, fontFamily: "monospace", boxShadow: loading ? "none" : `0 0 20px ${C.accent}33`,
          }}>{loading ? "AGUARDE..." : "ENTRAR"}</button>

          <div style={{ color: C.muted, fontSize: 10, textAlign: "center", marginTop: 14 }}>
            Ja cadastrado? Digite o mesmo contato para entrar.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MODAL SENHA ESPECIAL ─────────────────────────────────────────────────────
function SenhaModal({ tipo, onSuccess, onClose }) {
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const color = tipo === "admin" ? C.purple : C.gold;
  const verificar = () => {
    if (tipo === "influencer" && senha === SENHA_INFLUENCER) onSuccess();
    else if (tipo === "admin" && senha === SENHA_ADMIN) onSuccess();
    else setError("Senha incorreta!");
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000aa", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 20 }}>
      <div style={{ background: C.card, border: `1px solid ${color}44`, borderRadius: 20, padding: 28, width: "100%", maxWidth: 340 }}>
        <div style={{ color, fontWeight: 900, fontSize: 14, letterSpacing: 2, marginBottom: 6 }}>
          {tipo === "admin" ? "ACESSO ADMIN" : "ACESSO INFLUENCIADOR"}
        </div>
        <div style={{ color: C.muted, fontSize: 11, marginBottom: 20 }}>Digite a senha especial.</div>
        <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
          placeholder="Senha especial..." onKeyDown={e => e.key === "Enter" && verificar()}
          style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace", marginBottom: 12, outline: "none" }} />
        {error && <div style={{ color: C.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: C.border, border: "none", borderRadius: 10, padding: "12px", color: C.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>CANCELAR</button>
          <button onClick={verificar} style={{ flex: 2, background: `linear-gradient(135deg,${color},${color}aa)`, border: "none", borderRadius: 10, padding: "12px", color: "#000", fontWeight: 800, fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>ENTRAR</button>
        </div>
      </div>
    </div>
  );
}

// ── AREA DO LEAD ─────────────────────────────────────────────────────────────
function LeadArea({ lead, onLogout }) {
  const [tab, setTab] = useState("home");
  const [leadData, setLeadData] = useState(lead);
  const [ranking, setRanking] = useState([]);
  const [rankMes, setRankMes] = useState([]);
  const [ticket, setTicket] = useState("");
  const [ticketMsg, setTicketMsg] = useState(null);
  const [loadingT, setLoadingT] = useState(false);
  const [spinCredits, setSpinCredits] = useState(lead?.Creditos_Da_Roleta || 0);

  const reload = async () => {
    const { data } = await supabase.from("INFLUX").select("*").eq("id", lead.id).single();
    if (data) { setLeadData(data); setSpinCredits(data.creditos_roleta || 0); }
    const { data: r1 } = await supabase.from("Ranking_Diario").select("*").order("entradas", { ascending: false }).limit(10);
    if (r1) setRanking(r1);
    const { data: r2 } = await supabase.from("Ranking_Mensal").select("*").order("entradas_mes", { ascending: false }).limit(10);
    if (r2) setRankMes(r2);
  };
  useEffect(() => { reload(); }, []);

  const submitTicket = async () => {
    if (!ticket.trim()) return;
    setTicketMsg(null); setLoadingT(true);
    const { data: ex } = await supabase.from("Ingressos").select("id").eq("ticket_codigo", ticket.trim()).single();
    if (ex) { setTicketMsg({ ok: false, txt: "Ticket ja utilizado!" }); setLoadingT(false); return; }
    const { error } = await supabase.from("Ingressos").insert({ lead_id: leadData.id, ticket_codigo: ticket.trim(), status: "validado" });
    if (error) { setTicketMsg({ ok: false, txt: "Erro ao validar." }); setLoadingT(false); return; }
    await supabase.from("INFLUX").update({ Entradas_De_Hoje: (leadData.Entradas_De_Hoje || 0) + 1, Entradas_Da_Semana: (leadData.Entradas_Da_Semana || 0) + 1, Entradas_Do_Mes: (leadData.Entradas_Do_Mes || 0) + 1 }).eq("id", leadData.id);
    setTicketMsg({ ok: true, txt: "Ticket validado! +1 entrada." }); setTicket(""); setLoadingT(false); reload();
  };

  const TABS = [{ id: "home", l: "Inicio" }, { id: "ticket", l: "Ticket" }, { id: "roleta", l: "Roleta" }, { id: "ranking", l: "Diario" }, { id: "mensal", l: "Mensal" }, { id: "premios", l: "Premios" }];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace" }}>
      <div style={{ background: `linear-gradient(135deg,${C.accent}12,${C.purple}08)`, borderBottom: `1px solid ${C.border}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: `linear-gradient(135deg,${C.accent},${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>INFLUX</div>
          <div style={{ color: C.muted, fontSize: 10 }}>{leadData?.Nome}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {(leadData?.Streak || 0) >= 7 && <Pill label={`${leadData.streak}d`} color={C.gold} />}
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 8px", color: C.muted, fontSize: 10, cursor: "pointer" }}>sair</button>
        </div>
      </div>

      <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent", color: tab === t.id ? C.accent : C.muted, padding: "10px 12px", fontWeight: 700, fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "monospace" }}>{t.l}</button>)}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {tab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <StatCard icon="📍" label="Hoje" value={leadData?.Entradas_De_Hoje || 0} color={C.accent} />
              <StatCard icon="🔥" label="Streak" value={`${leadData?.Streak || 0}d`} color={C.gold} />
              <StatCard icon="x" label="Multi" value={`${leadData?.Multiplicador || 1}x`} color={C.green} />
            </div>
            <div style={{ background: `linear-gradient(135deg,${C.accent}12,${C.purple}08)`, border: `1px solid ${C.accent}33`, borderRadius: 16, padding: 18 }}>
              <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>SORTEIO DA SEMANA</div>
              <div style={{ color: C.sub, fontSize: 11, marginBottom: 14 }}>Proxima Segunda-feira. Cadastre tickets para participar.</div>
              <a href="https://cifradobem.com" target="_blank" rel="noreferrer" style={{ display: "block", background: `linear-gradient(135deg,${C.accent},${C.purple})`, color: "#000", fontWeight: 800, textAlign: "center", borderRadius: 12, padding: "13px", textDecoration: "none", fontSize: 12, letterSpacing: 2 }}>ACESSAR CIFRA DO BEM</a>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>METAS DO DIA</div>
              {[{ l: "Minimo diario (7x)", ok: (leadData?.Entradas_De_Hoje || 0) >= 7 }, { l: "Credito de roleta (7x x 7d)", ok: (leadData?.Streak || 0) >= 7 }, { l: "Multiplicador ativo (12x+)", ok: (leadData?.Entradas_De_Hoje || 0) >= 12 }].map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: m.ok ? C.green + "22" : C.border, border: `1.5px solid ${m.ok ? C.green : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, color: C.green }}>{m.ok ? "✓" : ""}</div>
                  <span style={{ color: m.ok ? C.text : C.sub, fontSize: 12 }}>{m.l}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "ticket" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>VALIDAR TICKET</div>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 16, lineHeight: 1.6 }}>Apos cada cadastro na Cifra do Bem voce recebe um codigo unico. Cole abaixo.</div>
            <input value={ticket} onChange={e => setTicket(e.target.value)} placeholder="Cole o codigo do ticket..."
              onKeyDown={e => e.key === "Enter" && submitTicket()}
              style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 14px", color: C.text, fontSize: 13, fontFamily: "monospace", marginBottom: 12, outline: "none" }} />
            <button onClick={submitTicket} disabled={loadingT} style={{ width: "100%", background: `linear-gradient(135deg,${C.accent},${C.purple})`, color: "#000", border: "none", borderRadius: 12, padding: "13px", fontWeight: 800, fontSize: 12, cursor: "pointer", letterSpacing: 2 }}>
              {loadingT ? "VALIDANDO..." : "VALIDAR ENTRADA"}
            </button>
            {ticketMsg && <div style={{ marginTop: 12, background: ticketMsg.ok ? C.greenDim : C.redDim, border: `1px solid ${ticketMsg.ok ? C.green : C.red}44`, borderRadius: 10, padding: "12px 14px", color: ticketMsg.ok ? C.green : C.red, fontSize: 12, fontWeight: 600 }}>{ticketMsg.txt}</div>}
          </div>
        )}

        {tab === "roleta" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, textAlign: "center" }}>
              <div style={{ color: C.muted, fontSize: 10 }}>SEUS CREDITOS</div>
              <div style={{ color: C.accent, fontSize: 36, fontWeight: 900, fontFamily: "monospace" }}>{spinCredits}</div>
              <div style={{ color: C.muted, fontSize: 10 }}>7x/dia x 7 dias = 1 credito</div>
            </div>
            <RouletteWheel credits={spinCredits} onSpin={async () => {
              const nc = Math.max(0, (leadData?.Creditos_Da_Roleta || 0) - 1);
              setSpinCredits(nc);
              await supabase.from("INFLUX").update({ Creditos_Da_Roleta: nc }).eq("id", leadData.id);
            }} />
          </div>
        )}

        {tab === "ranking" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: C.goldDim, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: "10px 14px", textAlign: "center", color: C.gold, fontSize: 11, fontWeight: 700 }}>Top 10 do dia ganham R$20 — Seg a Sex</div>
            {ranking.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32, fontSize: 12 }}>Nenhum dado ainda hoje</div>}
            {ranking.map((r, i) => (
              <div key={r.id || i} style={{ background: i < 3 ? `${[C.gold,"#c0c0c0","#cd7f32"][i]}10` : C.card, border: `1px solid ${i < 3 ? [C.gold,"#c0c0c0","#cd7f32"][i]+"33" : C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ color: i < 3 ? [C.gold,"#c0c0c0","#cd7f32"][i] : C.muted, fontWeight: 900, width: 24, textAlign: "center" }}>{i+1}</div>
                <Avatar name={r.nome} size={34} color={i < 3 ? [C.gold,"#c0c0c0","#cd7f32"][i] : C.accent} />
                <div style={{ flex: 1 }}><div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{r.nome}</div></div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 16 }}>{r.entradas}x</div>
                  <div style={{ color: C.green, fontSize: 10, fontWeight: 700 }}>R$20</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "mensal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rankMes.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32, fontSize: 12 }}>Nenhum dado este mes</div>}
            {rankMes.map((r, i) => (
              <div key={r.id || i} style={{ background: i < 3 ? `${[C.gold,"#c0c0c0","#cd7f32"][i]}10` : C.card, border: `1px solid ${i < 3 ? [C.gold,"#c0c0c0","#cd7f32"][i]+"33" : C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ color: i < 3 ? [C.gold,"#c0c0c0","#cd7f32"][i] : C.muted, fontWeight: 900, width: 24 }}>{i+1}</div>
                <Avatar name={r.nome} size={34} color={i < 3 ? [C.gold,"#c0c0c0","#cd7f32"][i] : C.purple} />
                <div style={{ flex: 1 }}><div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{r.nome}</div><div style={{ color: C.muted, fontSize: 10 }}>x{r.multiplicador || 1}</div></div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace" }}>{r.entradas_mes}</div>
                  <div style={{ color: i < 3 ? C.green : C.muted, fontSize: 9 }}>{i < 3 ? "TOP 3" : "entradas"}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "premios" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[{ icon:"🎰", t:"Roleta Semanal", d:"7x/dia por 7 dias = 1 credito. Premios de ate R$3.000", c:C.purple, v:"ate R$3k" },
              { icon:"📅", t:"Ranking Diario", d:"Top 10 cadastros/dia ganham R$20 cada (Seg-Sex)", c:C.gold, v:"R$20/dia" },
              { icon:"⚡", t:"Streak Semanal", d:"Top 10 com mais cadastros em 7 dias ganham R$50", c:C.accent, v:"R$50/sem" },
              { icon:"🏆", t:"Multiplicador Mensal", d:"Top 3 do mes com 12x+/dia dividem premio especial", c:C.green, v:"Top 3" },
              { icon:"💸", t:"Pix Semanal", d:"Via plataforma Cifra do Bem toda segunda-feira", c:C.orange, v:"Semanal" },
            ].map((p, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${p.c}22`, borderRadius: 16, padding: 16, display: "flex", gap: 14 }}>
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

// ── AREA DO INFLUENCIADOR ────────────────────────────────────────────────────
function InfluencerArea({ onLogout }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { supabase.from("Influenciadores").select("*").then(({ data }) => { if (data) setList(data); setLoading(false); }); }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace" }}>
      <div style={{ background: `linear-gradient(135deg,${C.gold}12,${C.orange}08)`, borderBottom: `1px solid ${C.border}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg,${C.gold},${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>INFLUX PRO</div>
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
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Bem-vindo, Influenciador!</div>
              <div style={{ color: C.sub, fontSize: 11 }}>Acompanhe seus resultados e comissoes abaixo.</div>
            </div>
            {list.map((inf, i) => (
              <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={inf.nome} size={36} color={C.gold} />
                    <div><div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>@{inf.instagram || inf.nome}</div><div style={{ color: C.muted, fontSize: 10 }}>{inf.status || "ativo"}</div></div>
                  </div>
                  <Pill label="ATIVO" color={C.green} />
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                  {[{ l: "leads", v: fmt(inf.leads_gerados || 0), c: C.accent }, { l: "views", v: fmt(inf.visualizacoes || 0), c: C.purple }, { l: "comissao 35%", v: `R$${fmt(Math.floor((inf.visualizacoes||0)/1000*100*0.35))}`, c: C.green }].map((s, j) => (
                    <div key={j}><div style={{ color: s.c, fontWeight: 900, fontFamily: "monospace", fontSize: 14 }}>{s.v}</div><div style={{ color: C.muted, fontSize: 9 }}>{s.l}</div></div>
                  ))}
                </div>
              </div>
            ))}
            {list.length === 0 && <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, textAlign: "center", color: C.muted, fontSize: 12 }}>Nenhum influenciador cadastrado ainda.</div>}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>COMO FUNCIONA</div>
              {["Compartilhe seu link com seus seguidores", "Cada visualizacao conta para sua comissao", "Voce ganha 35% de R$100 por 1.000 views", "Pagamento via Pix todo mes"].map((s, i) => (
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

// ── PAINEL ADMIN ─────────────────────────────────────────────────────────────
function AdminPanel({ onLogout }) {
  const [tab, setTab] = useState("overview");
  const [leads, setLeads] = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, hoje: 0, semana: 0 });
  const [prizes, setPrizes] = useState(PRIZES);
  const [roletaAtiva, setRotletaAtiva] = useState(true);
  const [creditosMin, setCreditosMin] = useState(1);
  const [editando, setEditando] = useState(null);

  const loadAdmin = async () => {
    setLoading(true);
    const [l, inf, pag] = await Promise.all([
      supabase.from("INFLUX").select("*").order("entradas_hoje", { ascending: false }).limit(20),
      supabase.from("Influenciadores").select("*"),
      supabase.from("Pagamentos").select("*").eq("status", "pendente"),
    ]);
    if (l.data) { setLeads(l.data); setStats({ total: l.data.length, hoje: l.data.reduce((s, x) => s + (x.Entradas_De_Hoje || 0), 0), semana: l.data.reduce((s, x) => s + (x.Entradas_Da_Semana || 0), 0) }); }
    if (inf.data) setInfluencers(inf.data);
    if (pag.data) setPagamentos(pag.data);
    setLoading(false);
  };
  useEffect(() => { loadAdmin(); }, []);

  const pagarPix = async (p) => { await supabase.from("Pagamentos").update({ status: "pago" }).eq("id", p.id); loadAdmin(); };
  const addCredito = async (leadId) => {
    const ld = leads.find(l => l.id === leadId);
    await supabase.from("INFLUX").update({ creditos_roleta: (ld?.Creditos_Da_Roleta || 0) + 1 }).eq("id", leadId);
    loadAdmin();
  };

  const TABS = [{ id: "overview", l: "Overview" }, { id: "leads", l: "Leads" }, { id: "roleta", l: "Roleta" }, { id: "influenc", l: "Influenc." }, { id: "pagamentos", l: "Pagamentos" }];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace" }}>
      <div style={{ background: `linear-gradient(135deg,${C.purple}12,${C.red}08)`, borderBottom: `1px solid ${C.border}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg,${C.purple},${C.red})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>INFLUX ADMIN</div>
          <div style={{ color: C.muted, fontSize: 10 }}>Painel de Controle</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill label="LIVE" color={C.green} />
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 8px", color: C.muted, fontSize: 10, cursor: "pointer" }}>sair</button>
        </div>
      </div>

      <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${C.purple}` : "2px solid transparent", color: tab === t.id ? C.purple : C.muted, padding: "10px 12px", fontWeight: 700, fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "monospace" }}>{t.l}</button>)}
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
                  <StatCard icon="💰" label="Receita est." value={`R$${fmt(Math.floor(stats.semana/10))}`} color={C.green} />
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 12, marginBottom: 14 }}>CUSTO MENSAL</div>
                  {[{ l: "Roleta Semanal", v: "R$ 10.000", c: C.purple, p: 62.5 }, { l: "Ranking Diario", v: "R$ 4.000", c: C.gold, p: 25 }, { l: "Streak Semanal", v: "R$ 2.000", c: C.accent, p: 12.5 }].map((item, i) => (
                    <div key={i} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 11 }}><span style={{ color: C.sub }}>{item.l}</span><span style={{ color: item.c, fontWeight: 700 }}>{item.v}</span></div>
                      <div style={{ height: 4, background: C.border, borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${item.p}%`, background: item.c, borderRadius: 4 }} /></div>
                    </div>
                  ))}
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 13 }}>
                    <span style={{ color: C.text }}>TOTAL</span><span style={{ color: C.red }}>R$ 16.000/mes</span>
                  </div>
                </div>
              </div>
            )}

            {tab === "leads" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ color: C.muted, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>TOP LEADS</div>
                {leads.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum lead ainda</div>}
                {leads.map((ld, i) => (
                  <div key={ld.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ color: C.muted, fontWeight: 700, width: 20, fontSize: 11 }}>{i+1}</div>
                    <Avatar name={ld.Nome} size={34} color={C.purple} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{ld.Nome}</div>
                      <div style={{ color: C.muted, fontSize: 10 }}>{ld.Telefone} · streak {ld.Streak || 0}d</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ textAlign: "right" }}><div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 15 }}>{ld.Entradas_De_Hoje || 0}x</div><div style={{ color: C.muted, fontSize: 9 }}>hoje</div></div>
                      <button onClick={() => addCredito(ld.id)} style={{ background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: "4px 8px", color: C.accent, fontWeight: 700, fontSize: 9, cursor: "pointer", fontFamily: "monospace" }}>+CR</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "roleta" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ background: C.card, border: `1px solid ${C.purple}33`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.purple, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>CONTROLE DA ROLETA</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <span style={{ color: C.text, fontSize: 12 }}>Roleta ativa</span>
                    <button onClick={() => setRotletaAtiva(!roletaAtiva)} style={{ background: roletaAtiva ? C.green+"22" : C.redDim, border: `1px solid ${roletaAtiva ? C.green : C.red}44`, borderRadius: 20, padding: "6px 16px", color: roletaAtiva ? C.green : C.red, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{roletaAtiva ? "ATIVA" : "PAUSADA"}</button>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: C.text, fontSize: 12 }}>Creditos minimos</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <button onClick={() => setCreditosMin(Math.max(1, creditosMin-1))} style={{ background: C.border, border: "none", borderRadius: 6, width: 28, height: 28, color: C.text, cursor: "pointer", fontSize: 16 }}>-</button>
                      <span style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", width: 20, textAlign: "center" }}>{creditosMin}</span>
                      <button onClick={() => setCreditosMin(creditosMin+1)} style={{ background: C.border, border: "none", borderRadius: 6, width: 28, height: 28, color: C.text, cursor: "pointer", fontSize: 16 }}>+</button>
                    </div>
                  </div>
                </div>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>PREMIOS DA ROLETA</div>
                  {prizes.map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "8px 12px", background: C.surface, borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} /><span style={{ color: p.color, fontSize: 12, fontWeight: 700 }}>{p.label}</span></div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Pill label={p.weight<=3?"RARO":p.weight<=6?"MEDIO":"COMUM"} color={p.weight<=3?C.red:p.weight<=6?C.gold:C.muted} />
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
                      <input value={prizes[editando].label} onChange={e => { const n=[...prizes]; n[editando]={...n[editando],label:e.target.value}; setPrizes(n); }} style={{ width:"100%", background:C.surface, border:`1px solid ${C.border}`, borderRadius:8, padding:"10px 12px", color:C.text, fontSize:13, fontFamily:"monospace", outline:"none" }} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ color: C.sub, fontSize: 10, marginBottom: 6 }}>RARIDADE (1=raro, 9=comum)</div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button onClick={() => { const n=[...prizes]; n[editando]={...n[editando],weight:Math.max(1,prizes[editando].weight-1)}; setPrizes(n); }} style={{ background:C.border, border:"none", borderRadius:6, width:32, height:32, color:C.text, cursor:"pointer", fontSize:18 }}>-</button>
                        <span style={{ color:C.accent, fontWeight:900, fontFamily:"monospace", fontSize:20, width:30, textAlign:"center" }}>{prizes[editando].weight}</span>
                        <button onClick={() => { const n=[...prizes]; n[editando]={...n[editando],weight:Math.min(9,prizes[editando].weight+1)}; setPrizes(n); }} style={{ background:C.border, border:"none", borderRadius:6, width:32, height:32, color:C.text, cursor:"pointer", fontSize:18 }}>+</button>
                      </div>
                    </div>
                    <button onClick={() => setEditando(null)} style={{ width:"100%", background:`linear-gradient(135deg,${C.accent},${C.purple})`, color:"#000", border:"none", borderRadius:10, padding:"12px", fontWeight:800, fontSize:12, cursor:"pointer", letterSpacing:1 }}>SALVAR</button>
                  </div>
                )}
              </div>
            )}

            {tab === "influenc" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {influencers.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum influenciador</div>}
                {influencers.map((inf, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={inf.nome} size={36} color={C.purple} />
                        <div><div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>@{inf.instagram || inf.nome}</div><div style={{ color: C.muted, fontSize: 10 }}>ativo</div></div>
                      </div>
                      <Pill label={inf.status || "ativo"} color={C.green} />
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[{ l:"leads",v:fmt(inf.leads_gerados||0),c:C.accent },{ l:"views",v:fmt(inf.visualizacoes||0),c:C.purple },{ l:"comissao 35%",v:`R$${fmt(Math.floor((inf.visualizacoes||0)/1000*100*0.35))}`,c:C.green }].map((s,j)=>(
                        <div key={j}><div style={{ color:s.c, fontWeight:900, fontFamily:"monospace", fontSize:14 }}>{s.v}</div><div style={{ color:C.muted, fontSize:9 }}>{s.l}</div></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === "pagamentos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pagamentos.length === 0 && (
                  <div style={{ background: C.greenDim, border: `1px solid ${C.green}22`, borderRadius: 14, padding: 24, textAlign: "center" }}>
                    <div style={{ color: C.green, fontSize: 12, fontWeight: 700 }}>Tudo em dia!</div>
                    <div style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Nenhum pagamento pendente</div>
                  </div>
                )}
                {pagamentos.map((p, i) => (
                  <div key={i} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <Avatar name={p.nome} size={34} color={C.green} />
                    <div style={{ flex: 1 }}><div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{p.nome}</div><div style={{ color: C.muted, fontSize: 10 }}>{p.tipo}</div></div>
                    <div style={{ color: C.green, fontWeight: 900, fontFamily: "monospace", marginRight: 8 }}>R${p.valor}</div>
                    <button onClick={() => pagarPix(p)} style={{ background: C.greenDim, border: `1px solid ${C.green}44`, borderRadius: 8, padding: "6px 12px", color: C.green, fontWeight: 700, fontSize: 10, cursor: "pointer", fontFamily: "monospace" }}>PAGAR</button>
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

// ── APP ROOT ──────────────────────────────────────────────────────────────────
export default function App() {
  const [lead, setLead] = useState(null);
  const [area, setArea] = useState("lead");
  const [modalSenha, setModalSenha] = useState(null);

  const logout = () => { setLead(null); setArea("lead"); };

  if (!lead) return <LeadCadastro onEntrar={(l) => setLead(l)} />;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#1e2535;border-radius:4px}`}</style>

      {modalSenha && (
        <SenhaModal
          tipo={modalSenha}
          onSuccess={() => { setArea(modalSenha); setModalSenha(null); }}
          onClose={() => setModalSenha(null)}
        />
      )}

      <div style={{ width: "100%", maxWidth: 430 }}>
        {/* Seletor de area */}
        <div style={{ display: "flex", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 4, marginBottom: 12, gap: 4 }}>
          <button onClick={() => setArea("lead")} style={{ flex: 1, background: area === "lead" ? `linear-gradient(135deg,${C.accent},${C.purple})` : "transparent", color: area === "lead" ? "#000" : C.muted, border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 800, fontSize: 10, cursor: "pointer", letterSpacing: 1, fontFamily: "monospace" }}>LEAD</button>

          <button onClick={() => area === "influencer" ? setArea("lead") : setModalSenha("influencer")} style={{ flex: 1, background: area === "influencer" ? `linear-gradient(135deg,${C.gold},${C.orange})` : "transparent", color: area === "influencer" ? "#000" : C.muted, border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 800, fontSize: 10, cursor: "pointer", letterSpacing: 1, fontFamily: "monospace" }}>INFLUENCER</button>

          <button onClick={() => area === "admin" ? setArea("lead") : setModalSenha("admin")} style={{ flex: 1, background: area === "admin" ? `linear-gradient(135deg,${C.purple},${C.red})` : "transparent", color: area === "admin" ? "#fff" : C.muted, border: "none", borderRadius: 10, padding: "10px 0", fontWeight: 800, fontSize: 10, cursor: "pointer", letterSpacing: 1, fontFamily: "monospace" }}>ADMIN</button>
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 26, overflow: "hidden", height: 640, boxShadow: `0 0 80px ${area==="admin"?C.purple:area==="influencer"?C.gold:C.accent}14` }}>
          {area === "lead" && <LeadArea lead={lead} onLogout={logout} />}
          {area === "influencer" && <InfluencerArea onLogout={() => setArea("lead")} />}
          {area === "admin" && <AdminPanel onLogout={() => setArea("lead")} />}
        </div>

        <div style={{ textAlign: "center", color: C.muted, fontSize: 9, marginTop: 12, letterSpacing: 2 }}>INFLUX · SUPABASE · MAKE · CIFRA DO BEM</div>
      </div>
    </div>
  );
}
