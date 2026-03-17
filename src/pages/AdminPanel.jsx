import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { C, fmt } from "../lib/utils";
import { Avatar, Pill, StatCard } from "../components/Avatar";
import { Loader } from "../components/Loader";

export function AdminPanel({ user, onLogout }) {
  const [tab, setTab]           = useState("overview");
  const [leads, setLeads]       = useState([]);
  const [influencers, setInfluencers] = useState([]);
  const [pagamentos, setPagamentos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [loadError, setLoadError] = useState("");
  const [stats, setStats]       = useState({ total: 0, hoje: 0, semana: 0 });
  // FIX 8: prêmios da roleta vêm do banco
  const [prizes, setPrizes]     = useState([]);
  const [roletaAtiva, setRotletaAtiva] = useState(true);
  const [editando, setEditando] = useState(null);
  const [pixInfo, setPixInfo]   = useState({});
  const [sessionValid, setSessionValid] = useState(null); // null=checking, true, false

  // FIX 1: Valida token no Supabase ao montar — impede acesso via localStorage manipulado
  useEffect(() => {
    const verificarSessao = async () => {
      if (!user?.token) { setSessionValid(false); return; }
      try {
        const { data } = await supabase.rpc("validar_admin", {
          p_email: user.email || "",
          p_token: user.token,
        });
        setSessionValid(data?.ok === true);
      } catch {
        setSessionValid(false);
      }
    };
    verificarSessao();
  }, [user]);

  const loadAdmin = async () => {
    setLoading(true); setLoadError("");
    try {
      const [l, inf, pag, prem] = await Promise.all([
        supabase.from("INFLUX").select("*").order("Entradas_De_Hoje", { ascending: false }).limit(50),
        supabase.from("Influenciadores").select("*"),
        supabase.from("Pagamentos").select("*").order("created_at", { ascending: false }),
        supabase.from("Roleta_Premios").select("*").order("ordem"),
      ]);

      if (l.error) throw new Error("Erro ao carregar leads: " + l.error.message);
      if (l.data) {
        setLeads(l.data);
        setStats({ total: l.data.length, hoje: l.data.reduce((s, x) => s + (x.Entradas_De_Hoje || 0), 0), semana: l.data.reduce((s, x) => s + (x.Entradas_Da_Semana || 0), 0) });
      }
      if (inf.data) setInfluencers(inf.data);
      if (pag.data) setPagamentos(pag.data);
      if (prem.data) setPrizes(prem.data);
    } catch (e) {
      setLoadError(e.message || "Erro ao carregar dados.");
    }
    setLoading(false);
  };

  useEffect(() => { if (sessionValid === true) loadAdmin(); }, [sessionValid]);

  // FIX 1: Sessão inválida → força logout
  if (sessionValid === false) {
    onLogout();
    return null;
  }

  if (sessionValid === null) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", alignItems: "center", justifyContent: "center", background: C.bg, fontFamily: "monospace" }}>
        <Loader />
        <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>Verificando sessão...</div>
      </div>
    );
  }

  const marcarPago = async (id) => {
    try {
      const { error } = await supabase.from("Pagamentos").update({ status: "pago" }).eq("id", id);
      if (error) throw error;
      loadAdmin();
    } catch (e) { alert("Erro ao marcar como pago: " + e.message); }
  };

  // FIX 2: incremento atômico via RPC — sem race condition
  const addCredito = async (leadId) => {
    try {
      const { data, error } = await supabase.rpc("incrementar_creditos", { lead_id: leadId, delta: 1 });
      if (error) throw error;
      loadAdmin();
    } catch (e) { alert("Erro ao adicionar crédito: " + e.message); }
  };

  const toggleRoleta = async () => {
    const novoStatus = !roletaAtiva;
    try {
      await supabase.from("Config").upsert({ chave: "roleta_ativa", valor: novoStatus ? "true" : "false" });
      setRotletaAtiva(novoStatus);
    } catch { setRotletaAtiva(novoStatus); }
  };

  // FIX 4: reset via RPC — sem gte(uuid)
  const zerarEntradas = async () => {
    if (!window.confirm("Zerar TODAS as entradas de hoje?")) return;
    try {
      await supabase.rpc("reset_entradas_diarias");
      loadAdmin();
    } catch (e) { alert("Erro: " + e.message); }
  };

  // FIX 8: salva prêmio editado no banco
  const salvarPremio = async (premio) => {
    try {
      await supabase.from("Roleta_Premios").update({ label: premio.label, weight: premio.weight }).eq("id", premio.id);
      setEditando(null);
      loadAdmin();
    } catch (e) { alert("Erro ao salvar prêmio: " + e.message); }
  };

  const TABS = [{ id: "overview", l: "Overview" }, { id: "leads", l: "Leads" }, { id: "roleta", l: "Roleta" }, { id: "influenc", l: "Influenc." }, { id: "pagamentos", l: "Pagamentos" }];
  const pendentes = pagamentos.filter(p => p.status === "pendente");
  const pagos     = pagamentos.filter(p => p.status === "pago");

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
                <button onClick={zerarEntradas} style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 12, padding: "12px", color: C.red, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "monospace", letterSpacing: 1 }}>
                  ⚠ ZERAR ENTRADAS DO DIA
                </button>
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.text, fontWeight: 700, fontSize: 12, marginBottom: 14 }}>CUSTO MENSAL</div>
                  {[{ l: "Roleta Semanal", v: "R$ 10.000", c: C.purple, p: 62.5 }, { l: "Ranking Diário", v: "R$ 4.000", c: C.gold, p: 25 }, { l: "Streak Semanal", v: "R$ 2.000", c: C.accent, p: 12.5 }].map((item, i) => (
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
                <div style={{ color: C.muted, fontSize: 10, letterSpacing: 1, marginBottom: 4 }}>TOP LEADS ({leads.length} total)</div>
                {leads.length === 0 && <div style={{ color: C.muted, textAlign: "center", padding: 32 }}>Nenhum lead ainda</div>}
                {leads.map((ld, i) => (
                  <div key={ld.id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ color: C.muted, fontWeight: 700, width: 20, fontSize: 11 }}>{i + 1}</div>
                    <Avatar name={ld.Nome} size={34} color={C.purple} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{ld.Nome}</div>
                      <div style={{ color: C.muted, fontSize: 10 }}>{ld.Telefone} · streak {ld.Streak || 0}d · mult {ld.Multiplicador || 1}x</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 15 }}>{ld.Entradas_De_Hoje || 0}x</div>
                        <div style={{ color: C.muted, fontSize: 9 }}>{ld.Creditos_Da_Roleta || 0} créditos</div>
                      </div>
                      {/* FIX 2: incremento atômico via RPC */}
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: C.text, fontSize: 12 }}>Status da roleta</span>
                    <button onClick={toggleRoleta} style={{ background: roletaAtiva ? C.green + "22" : C.redDim, border: `1px solid ${roletaAtiva ? C.green : C.red}44`, borderRadius: 20, padding: "6px 16px", color: roletaAtiva ? C.green : C.red, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{roletaAtiva ? "ATIVA" : "PAUSADA"}</button>
                  </div>
                </div>

                {/* FIX 8: prêmios do banco, editáveis e persistidos */}
                <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
                  <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>PRÊMIOS (salvos no banco)</div>
                  {prizes.map((p, i) => (
                    <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "8px 12px", background: C.surface, borderRadius: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: p.color }} />
                        <span style={{ color: p.color, fontSize: 12, fontWeight: 700 }}>{p.label}</span>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <Pill label={p.weight <= 3 ? "RARO" : p.weight <= 6 ? "MÉDIO" : "COMUM"} color={p.weight <= 3 ? C.red : p.weight <= 6 ? C.gold : C.muted} />
                        <button onClick={() => setEditando({ ...p })} style={{ background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 6, padding: "3px 8px", color: C.accent, fontSize: 9, cursor: "pointer", fontFamily: "monospace" }}>EDITAR</button>
                      </div>
                    </div>
                  ))}
                </div>

                {editando !== null && (
                  <div style={{ background: C.card, border: `1px solid ${C.accent}44`, borderRadius: 16, padding: 16 }}>
                    <div style={{ color: C.accent, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>EDITANDO: {editando.label}</div>
                    <input value={editando.label} onChange={e => setEditando(prev => ({ ...prev, label: e.target.value }))} style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", color: C.text, fontSize: 13, fontFamily: "monospace", marginBottom: 12, outline: "none" }} />
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
                      <button onClick={() => setEditando(prev => ({ ...prev, weight: Math.max(1, prev.weight - 1) }))} style={{ background: C.border, border: "none", borderRadius: 6, width: 32, height: 32, color: C.text, cursor: "pointer", fontSize: 18 }}>−</button>
                      <span style={{ color: C.accent, fontWeight: 900, fontFamily: "monospace", fontSize: 20, width: 30, textAlign: "center" }}>{editando.weight}</span>
                      <button onClick={() => setEditando(prev => ({ ...prev, weight: Math.min(9, prev.weight + 1) }))} style={{ background: C.border, border: "none", borderRadius: 6, width: 32, height: 32, color: C.text, cursor: "pointer", fontSize: 18 }}>+</button>
                      <span style={{ color: C.muted, fontSize: 10 }}>(1=raro, 9=comum)</span>
                    </div>
                    <button onClick={() => salvarPremio(editando)} style={{ width: "100%", background: `linear-gradient(135deg,${C.accent},${C.purple})`, color: "#000", border: "none", borderRadius: 10, padding: "12px", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                      SALVAR NO BANCO
                    </button>
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
                        <div>
                          <div style={{ color: C.text, fontWeight: 700, fontSize: 13 }}>@{inf.instagram || inf.nome}</div>
                          <div style={{ color: C.muted, fontSize: 10 }}>{inf.data_entrada || "ativo"}</div>
                        </div>
                      </div>
                      <Pill label={inf.status || "ativo"} color={C.green} />
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      {[{ l: "leads", v: fmt(inf.leads_gerados || 0), c: C.accent }, { l: "views", v: fmt(inf.visualizacoes || 0), c: C.purple }, { l: "comissão 35%", v: `R$${fmt(Math.floor((inf.visualizacoes || 0) / 1000 * 100 * 0.35))}`, c: C.green }].map((s, j) => (
                        <div key={j}><div style={{ color: s.c, fontWeight: 900, fontFamily: "monospace", fontSize: 14 }}>{s.v}</div><div style={{ color: C.muted, fontSize: 9 }}>{s.l}</div></div>
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
                    <div style={{ color: C.red, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>PENDENTES ({pendentes.length})</div>
                    {pendentes.map((p, i) => (
                      <div key={i} style={{ background: C.card, border: `1px solid ${C.red}33`, borderRadius: 14, padding: 14 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                          <Avatar name={p.nome} size={34} color={C.red} />
                          <div style={{ flex: 1 }}>
                            <div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{p.nome}</div>
                            <div style={{ color: C.muted, fontSize: 10 }}>{p.tipo} · {p.data_solicitacao ? new Date(p.data_solicitacao).toLocaleDateString("pt-BR") : ""}</div>
                          </div>
                          <div style={{ color: C.green, fontWeight: 900, fontFamily: "monospace", fontSize: 16 }}>R${fmt(p.valor)}</div>
                        </div>
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ color: C.sub, fontSize: 10, marginBottom: 4 }}>CHAVE PIX DO LEAD</div>
                          <input value={pixInfo[p.id] || p.chave_pix || ""} onChange={e => setPixInfo(prev => ({ ...prev, [p.id]: e.target.value }))} placeholder="Chave Pix recebida do lead..." style={{ width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", color: C.text, fontSize: 12, fontFamily: "monospace", outline: "none" }} />
                        </div>
                        <button onClick={() => marcarPago(p.id)} style={{ width: "100%", background: `linear-gradient(135deg,${C.green},${C.green}99)`, border: "none", borderRadius: 10, padding: "10px", color: "#000", fontWeight: 800, fontSize: 11, cursor: "pointer", letterSpacing: 1 }}>MARCAR COMO PAGO (ITAÚ)</button>
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
                    <div style={{ color: C.green, fontWeight: 700, fontSize: 11, letterSpacing: 1, marginTop: 8 }}>PAGOS ({pagos.length})</div>
                    {pagos.map((p, i) => (
                      <div key={i} style={{ background: C.card, border: `1px solid ${C.green}22`, borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, opacity: 0.7 }}>
                        <Avatar name={p.nome} size={32} color={C.green} />
                        <div style={{ flex: 1 }}><div style={{ color: C.text, fontWeight: 700, fontSize: 12 }}>{p.nome}</div><div style={{ color: C.muted, fontSize: 10 }}>{p.tipo}</div></div>
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
