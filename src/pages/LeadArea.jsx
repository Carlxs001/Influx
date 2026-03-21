import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { C, fmt, calcularStreakECredito } from "../lib/utils";
import { RouletteWheel } from "../components/RouletteWheel";
import { Avatar, Pill, StatCard } from "../components/Avatar";
import { Loader } from "../components/Loader";

export function LeadArea({ lead, onLogout }) {
  const [tab, setTab]           = useState("home");
  const [leadData, setLeadData] = useState(lead);
  const [ranking, setRanking]   = useState([]);
  const [rankMes, setRankMes]   = useState([]);
  const [ticket, setTicket]     = useState("");
  const [ticketMsg, setTicketMsg] = useState(null);
  const [loadingT, setLoadingT] = useState(false);
  const [spinCredits, setSpinCredits] = useState(lead?.Creditos_Da_Roleta || 0);
  // FIX 8: prêmios carregados do banco
  const [prizes, setPrizes]     = useState([]);

  const reload = async () => {
    try {
      const { data } = await supabase.from("INFLUX").select("*").eq("id", lead.id).single();
      if (data) {
        setLeadData(data);
        setSpinCredits(data.Creditos_Da_Roleta || 0);
        localStorage.setItem("influx_user", JSON.stringify({ ...data, tipo: "lead" }));
      }
    } catch {}

    try {
      const { data: r1 } = await supabase.from("ranking_diario").select("*").order("entradas", { ascending: false }).limit(10);
      if (r1) setRanking(r1);
    } catch {}

    try {
      const { data: r2 } = await supabase.from("Ranking_Mensal").select("*").order("Entradas_Do_Mes", { ascending: false }).limit(10);
      if (r2) setRankMes(r2);
    } catch {}
  };

  // FIX 8: carrega prêmios do banco
  const carregarPremios = async () => {
    const { data } = await supabase.from("Roleta_Premios").select("*").eq("ativo", true).order("ordem");
    if (data) setPrizes(data);
  };

  useEffect(() => { reload(); carregarPremios(); }, []);

  const submitTicket = async () => {
    if (!ticket.trim()) return;
    setTicketMsg(null); setLoadingT(true);

    try {
      const { data: ex } = await supabase.from("Tickets").select("Id, Lead_id").eq("Ticket_codigo", ticket.trim()).maybeSingle();

      if (ex) {
        setTicketMsg({ ok: false, txt: ex.Lead_id === leadData.id ? "Você já usou este ticket!" : "Ticket já utilizado por outro participante!" });
        setLoadingT(false); return;
      }

      const { error } = await supabase.from("Tickets").insert({
        Lead_id: leadData.id,
        Ticket_codigo: ticket.trim(),
        Status: "validado",
        Data_Validacao: new Date().toISOString(),
      });

      // FIX 7: constraint UNIQUE no banco — código 23505 = duplicate
      if (error?.code === "23505") {
        setTicketMsg({ ok: false, txt: "Ticket já utilizado." });
        setLoadingT(false); return;
      }
      if (error) { setTicketMsg({ ok: false, txt: "Erro ao validar: " + error.message }); setLoadingT(false); return; }

      const novasEntradas = (leadData.Entradas_De_Hoje || 0) + 1;
      await supabase.from("INFLUX").update({
        Entradas_De_Hoje: novasEntradas,
        Entradas_Da_Semana: (leadData.Entradas_Da_Semana || 0) + 1,
        Entradas_Do_Mes: (leadData.Entradas_Do_Mes || 0) + 1,
        Total_Tickets_Validados: (leadData.Total_Tickets_Validados || 0) + 1,
        Multiplicador: novasEntradas >= 12 ? 2 : 1,
        Ultimo_Dia_Ativo: new Date().toISOString().split("T")[0],
      }).eq("id", leadData.id);

      await calcularStreakECredito(supabase, leadData.id);
      setTicketMsg({ ok: true, txt: "Ticket validado! +1 entrada." });
      setTicket("");
    } catch (e) {
      setTicketMsg({ ok: false, txt: "Erro de conexão. Tente novamente." });
    }
    setLoadingT(false);
    reload();
  };

  // FIX 3: spin via RPC — resultado vem do servidor
  const handleSpin = async () => {
    try {
      const { data, error } = await supabase.rpc("executar_spin", { lead_id: leadData.id });
      if (error || !data?.ok) return null;
      setSpinCredits(data.creditos_restantes);
      return data; // { ok, premio: { label, color, idx }, creditos_restantes }
    } catch {
      return null;
    }
  };

  const TABS = [
    { id: "home", l: "Início" }, { id: "ticket", l: "Ticket" },
    { id: "roleta", l: "Roleta" }, { id: "ranking", l: "Diário" },
    { id: "mensal", l: "Mensal" }, { id: "premios", l: "Prêmios" },
  ];

  const medalColors = [C.gold, "#c0c0c0", "#cd7f32"];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace" }}>
      {/* Header */}
      <div style={{ background: `linear-gradient(135deg,${C.accent}12,${C.purple}08)`, borderBottom: `1px solid ${C.border}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: 4, background: `linear-gradient(135deg,${C.accent},${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>INFLUX</div>
          <div style={{ color: C.muted, fontSize: 10 }}>{leadData?.Nome}</div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {(leadData?.Streak || 0) >= 7 && <Pill label={`${leadData.Streak}d 🔥`} color={C.gold} />}
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 8px", color: C.muted, fontSize: 10, cursor: "pointer" }}>sair</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: C.surface, borderBottom: `1px solid ${C.border}`, overflowX: "auto" }}>
        {TABS.map(t => <button key={t.id} onClick={() => setTab(t.id)} style={{ background: "none", border: "none", borderBottom: tab === t.id ? `2px solid ${C.accent}` : "2px solid transparent", color: tab === t.id ? C.accent : C.muted, padding: "10px 12px", fontWeight: 700, fontSize: 10, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "monospace" }}>{t.l}</button>)}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
        {tab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <StatCard icon="📍" label="Hoje" value={leadData?.Entradas_De_Hoje || 0} color={C.accent} />
              <StatCard icon="🔥" label="Streak" value={`${leadData?.Streak || 0}d`} color={C.gold} />
              <StatCard icon="✕" label="Multi" value={`${leadData?.Multiplicador || 1}x`} color={C.green} />
            </div>
            <div style={{ background: `linear-gradient(135deg,${C.accent}12,${C.purple}08)`, border: `1px solid ${C.accent}33`, borderRadius: 16, padding: 18 }}>
              <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>SORTEIO DA SEMANA</div>
              <div style={{ color: C.sub, fontSize: 11, marginBottom: 14 }}>Próxima Segunda-feira. Cadastre tickets para participar.</div>
              <a href="https://influx-links.vercel.app" target="_blank" rel="noreferrer" style={{ display: "block", background: `linear-gradient(135deg,${C.accent},${C.purple})`, color: "#000", fontWeight: 800, textAlign: "center", borderRadius: 12, padding: "13px", textDecoration: "none", fontSize: 12, letterSpacing: 2 }}>VER TODOS OS SORTEIOS</a>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>METAS DO DIA</div>
              {[
                { l: "Mínimo diário (7x)", ok: (leadData?.Entradas_De_Hoje || 0) >= 7 },
                { l: "Crédito de roleta (7x × 7d)", ok: (leadData?.Streak || 0) > 0 && (leadData?.Streak || 0) % 7 === 0 },
                { l: "Multiplicador ativo (12x+)", ok: (leadData?.Entradas_De_Hoje || 0) >= 12 },
              ].map((m, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: m.ok ? C.green + "22" : C.border, border: `1.5px solid ${m.ok ? C.green : C.muted}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, color: C.green }}>{m.ok ? "✓" : ""}</div>
                  <span style={{ color: m.ok ? C.text : C.sub, fontSize: 12 }}>{m.l}</span>
                </div>
              ))}
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.sub, fontSize: 11, marginBottom: 8 }}>Total de tickets validados</div>
              <div style={{ color: C.accent, fontSize: 28, fontWeight: 900, fontFamily: "monospace" }}>{leadData?.Total_Tickets_Validados || 0}</div>
            </div>
          </div>
        )}

        {tab === "ticket" && (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 18 }}>
            <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 6 }}>VALIDAR TICKET</div>
            <div style={{ color: C.sub, fontSize: 11, marginBottom: 16, lineHeight: 1.6 }}>Após cada cadastro na Cifra do Bem você recebe um código único. Cole abaixo.</div>
            <input value={ticket} onChange={e => setTicket(e.target.value)} placeholder="Cole o código do ticket..." onKeyDown={e => e.key === "Enter" && submitTicket()} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px 14px", color: C.text, fontSize: 13, fontFamily: "monospace", marginBottom: 12 }} />
            <button onClick={submitTicket} disabled={loadingT} style={{ width: "100%", background: `linear-gradient(135deg,${C.accent},${C.purple})`, color: "#000", border: "none", borderRadius: 12, padding: "13px", fontWeight: 800, fontSize: 12, cursor: loadingT ? "not-allowed" : "pointer", letterSpacing: 2 }}>
              {loadingT ? "VALIDANDO..." : "VALIDAR ENTRADA"}
            </button>
            {ticketMsg && <div style={{ marginTop: 12, background: ticketMsg.ok ? C.greenDim : C.redDim, border: `1px solid ${ticketMsg.ok ? C.green : C.red}44`, borderRadius: 10, padding: "12px 14px", color: ticketMsg.ok ? C.green : C.red, fontSize: 12, fontWeight: 600 }}>{ticketMsg.txt}</div>}
          </div>
        )}

        {tab === "roleta" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 14, textAlign: "center" }}>
              <div style={{ color: C.muted, fontSize: 10 }}>SEUS CRÉDITOS</div>
              <div style={{ color: C.accent, fontSize: 36, fontWeight: 900, fontFamily: "monospace" }}>{spinCredits}</div>
              <div style={{ color: C.muted, fontSize: 10 }}>7x/dia × 7 dias consecutivos = 1 crédito</div>
            </div>
            {prizes.length > 0
              ? <RouletteWheel credits={spinCredits} prizes={prizes} onSpin={handleSpin} />
              : <Loader />
            }
          </div>
        )}

        {tab === "ranking" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ background: C.goldDim, border: `1px solid ${C.gold}33`, borderRadius: 12, padding: "10px 14px", textAlign: "center", color: C.gold, fontSize: 11, fontWeight: 700 }}>Top 10 do dia ganham R$20 — Seg a Sex</div>
            {ranking.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32, fontSize: 12 }}>Nenhum dado ainda hoje</div>}
            {ranking.map((r, i) => (
              <div key={r.id || i} style={{ background: i < 3 ? `${medalColors[i]}10` : C.card, border: `1px solid ${i < 3 ? medalColors[i] + "33" : C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ color: i < 3 ? medalColors[i] : C.muted, fontWeight: 900, width: 24, textAlign: "center" }}>{i + 1}</div>
                <Avatar name={r.Nome || r.nome} size={34} color={i < 3 ? medalColors[i] : C.accent} />
                <div style={{ flex: 1 }}><div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>{r.Nome || r.nome}</div></div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 16 }}>{r.entradas || r.Entradas_De_Hoje || 0}x</div>
                  <div style={{ color: C.green, fontSize: 10, fontWeight: 700 }}>R$20</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "mensal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rankMes.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32, fontSize: 12 }}>Nenhum dado este mês</div>}
            {rankMes.map((r, i) => (
              <div key={r.id || i} style={{ background: i < 3 ? `${medalColors[i]}10` : C.card, border: `1px solid ${i < 3 ? medalColors[i] + "33" : C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ color: i < 3 ? medalColors[i] : C.muted, fontWeight: 900, width: 24 }}>{i + 1}</div>
                <Avatar name={r.Nome || r.nome} size={34} color={i < 3 ? medalColors[i] : C.purple} />
                <div style={{ flex: 1 }}><div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{r.Nome || r.nome}</div></div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace" }}>{r.Entradas_Do_Mes || 0}</div>
                  <div style={{ color: i < 3 ? C.green : C.muted, fontSize: 9 }}>{i < 3 ? "TOP 3" : "entradas"}</div>
                </div>
              </div>
            ))}
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
