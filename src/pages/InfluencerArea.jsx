import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { C, fmt } from "../lib/utils";
import { Avatar, Pill } from "../components/Avatar";
import { Loader } from "../components/Loader";

export function InfluencerArea({ user, onLogout }) {
  const [list, setList]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("Influenciadores").select("*").then(({ data, error: err }) => {
      if (err) setError("Erro ao carregar dados.");
      else if (data) setList(data);
      setLoading(false);
    });
  }, []);

  const myData      = list.find(i => i.instagram === user?.instagram) || null;
  const displayList = myData ? [myData] : list;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "monospace" }}>
      <div style={{ background: `linear-gradient(135deg,${C.gold}12,${C.orange}08)`, borderBottom: `1px solid ${C.border}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: 3, background: `linear-gradient(135deg,${C.gold},${C.orange})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>INFLUX PRO</div>
          <div style={{ color: C.muted, fontSize: 10 }}>{user?.nome || user?.instagram}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Pill label="INFLUENCER" color={C.gold} />
          <button onClick={onLogout} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, padding: "4px 8px", color: C.muted, fontSize: 10, cursor: "pointer" }}>sair</button>
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
              <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, textAlign: "center", color: C.muted, fontSize: 12 }}>Nenhum dado disponível.</div>
            )}

            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: 16 }}>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 12, marginBottom: 12 }}>COMO FUNCIONA</div>
              {["Compartilhe seu link com seus seguidores", "Cada visualização conta para sua comissão", "Você ganha 35% de R$100 por 1.000 views", "Pagamento via Pix todo mês"].map((s, i) => (
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
