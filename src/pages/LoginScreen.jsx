import { useState } from "react";
import { supabase } from "../lib/supabase";
import { C, EMAIL_ADMIN, SENHA_INFLUENCER } from "../lib/utils";
import crypto from "crypto"; // disponível no browser via SubtleCrypto

// FIX 1: hash SHA-256 no browser para enviar ao RPC sem expor a senha em texto
async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function LoginScreen({ onEntrar }) {
  const [tela, setTela]             = useState("lead");
  const [nome, setNome]             = useState("");
  const [contato, setContato]       = useState("");
  const [tipoContato, setTipoContato] = useState("whatsapp");
  const [senha, setSenha]           = useState("");
  const [email, setEmail]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  // FIX 5: upsert por Telefone — nunca duplica o lead
  const entrarLead = async () => {
    if (!nome.trim() || !contato.trim()) { setError("Preencha todos os campos."); return; }
    setLoading(true); setError("");

    try {
      // Tenta buscar primeiro
      const { data: ex } = await supabase
        .from("INFLUX").select("*").eq("Telefone", contato.trim()).maybeSingle();

      if (ex) {
        const userData = { ...ex, tipo: "lead" };
        localStorage.setItem("influx_user", JSON.stringify(userData));
        onEntrar(userData);
        setLoading(false); return;
      }

      // Novo lead — banco tem constraint UNIQUE em Telefone, protege de race
      const { data, error: err } = await supabase.from("INFLUX").insert({
        Nome: nome.trim(),
        Telefone: contato.trim(),
        Entradas_De_Hoje: 0, Entradas_Da_Semana: 0, Entradas_Do_Mes: 0,
        Streak: 0, Multiplicador: 1, Creditos_Da_Roleta: 0,
        Ultimo_Dia_Ativo: null, Ativo: true,
      }).select().single();

      // Se violou unique (dois cliques rápidos), carrega o existente
      if (err?.code === "23505") {
        const { data: ex2 } = await supabase
          .from("INFLUX").select("*").eq("Telefone", contato.trim()).maybeSingle();
        if (ex2) { onEntrar({ ...ex2, tipo: "lead" }); setLoading(false); return; }
      }

      if (err) { setError("Erro ao cadastrar: " + err.message); setLoading(false); return; }

      const userData = { ...data, tipo: "lead" };
      localStorage.setItem("influx_user", JSON.stringify(userData));
      onEntrar(userData);
    } catch (e) {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  };

  const entrarInfluencer = async () => {
    if (!nome.trim() || !contato.trim() || !senha.trim()) { setError("Preencha todos os campos."); return; }
    if (senha.trim() !== SENHA_INFLUENCER) { setError("Senha incorreta!"); return; }
    setLoading(true); setError("");

    try {
      const { data: ex } = await supabase
        .from("Influenciadores").select("*").eq("instagram", contato.trim()).maybeSingle();

      if (!ex) { setError("Instagram não encontrado. Contate o admin."); setLoading(false); return; }

      const userData = { ...ex, tipo: "influencer" };
      localStorage.setItem("influx_user", JSON.stringify(userData));
      onEntrar(userData);
    } catch (e) {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  };

  // FIX 1: admin validado via RPC no Supabase — token salvo, não a senha
  const entrarAdmin = async () => {
    if (!email.trim() || !senha.trim()) { setError("Preencha todos os campos."); return; }
    setLoading(true); setError("");

    try {
      const senhaHash = await sha256(senha.trim());

      const { data, error: err } = await supabase.rpc("criar_sessao_admin", {
        p_email: email.trim(),
        p_senha_hash: senhaHash,
      });

      if (err || !data?.ok) {
        setError("Email ou senha incorretos!");
        setLoading(false); return;
      }

      // Salva token (não a senha) no localStorage
      const user = { nome: "Admin", email: email.trim(), tipo: "admin", token: data.token };
      localStorage.setItem("influx_user", JSON.stringify(user));
      onEntrar(user);
    } catch (e) {
      setError("Erro de conexão. Tente novamente.");
    }
    setLoading(false);
  };

  const handleEntrar = () => {
    setError("");
    if (tela === "lead") entrarLead();
    else if (tela === "influencer") entrarInfluencer();
    else entrarAdmin();
  };

  const IS = { width: "100%", background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", color: C.text, fontSize: 14, fontFamily: "monospace" };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "monospace" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0}input{outline:none}input::placeholder{color:#4a5568}`}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 42, fontWeight: 900, letterSpacing: 8, background: `linear-gradient(135deg,${C.accent},${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>INFLUX</div>
          <div style={{ color: C.muted, fontSize: 11, marginTop: 6, letterSpacing: 2 }}>PLATAFORMA DE AFILIADOS</div>
        </div>

        {/* Seletor de tipo */}
        <div style={{ display: "flex", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, padding: 4, marginBottom: 20, gap: 4 }}>
          {[{ id: "lead", label: "LEAD", color: C.accent }, { id: "influencer", label: "INFLUENCER", color: C.gold }, { id: "admin", label: "ADMIN", color: C.purple }].map(t => (
            <button key={t.id} onClick={() => { setTela(t.id); setError(""); }} style={{ flex: 1, background: tela === t.id ? `linear-gradient(135deg,${t.color}33,${t.color}11)` : "transparent", border: tela === t.id ? `1px solid ${t.color}44` : "1px solid transparent", borderRadius: 10, padding: "10px 0", color: tela === t.id ? t.color : C.muted, fontWeight: 800, fontSize: 9, cursor: "pointer", letterSpacing: 1, fontFamily: "monospace" }}>{t.label}</button>
          ))}
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, padding: 28 }}>
          {tela === "lead" && (
            <>
              <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>ÁREA DO LEAD</div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 20 }}>Cadastro simples — sem email, sem senha.</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>SEU NOME</div>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Como você se chama?" style={IS} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>CONTATO</div>
                <div style={{ display: "flex", background: C.surface, borderRadius: 10, padding: 3, marginBottom: 8 }}>
                  {["whatsapp", "instagram"].map(t => (
                    <button key={t} onClick={() => setTipoContato(t)} style={{ flex: 1, background: tipoContato === t ? `linear-gradient(135deg,${C.accent}22,${C.purple}22)` : "transparent", border: tipoContato === t ? `1px solid ${C.accent}44` : "1px solid transparent", borderRadius: 8, padding: "7px 0", color: tipoContato === t ? C.accent : C.muted, fontWeight: 700, fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>{t === "whatsapp" ? "WHATSAPP" : "INSTAGRAM"}</button>
                  ))}
                </div>
                <input value={contato} onChange={e => setContato(e.target.value)} placeholder={tipoContato === "whatsapp" ? "(00) 00000-0000" : "@seuinstagram"} onKeyDown={e => e.key === "Enter" && handleEntrar()} style={IS} />
              </div>
            </>
          )}

          {tela === "influencer" && (
            <>
              <div style={{ color: C.gold, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>ÁREA DO INFLUENCIADOR</div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 20 }}>Nome + Instagram + senha da equipe.</div>
              {[{ label: "SEU NOME", val: nome, set: setNome, ph: "Seu nome completo", type: "text" }, { label: "INSTAGRAM", val: contato, set: setContato, ph: "@seuinstagram", type: "text" }, { label: "SENHA DA EQUIPE", val: senha, set: setSenha, ph: "Senha especial", type: "password" }].map((f, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} onKeyDown={e => e.key === "Enter" && handleEntrar()} style={IS} />
                </div>
              ))}
            </>
          )}

          {tela === "admin" && (
            <>
              <div style={{ color: C.purple, fontWeight: 700, fontSize: 13, marginBottom: 4 }}>ÁREA ADMIN</div>
              <div style={{ color: C.muted, fontSize: 11, marginBottom: 20 }}>Acesso restrito — validado no servidor.</div>
              {[{ label: "EMAIL", val: email, set: setEmail, ph: "admin@email.com", type: "email" }, { label: "SENHA", val: senha, set: setSenha, ph: "Senha admin", type: "password" }].map((f, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ color: C.sub, fontSize: 11, marginBottom: 6 }}>{f.label}</div>
                  <input type={f.type} value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph} onKeyDown={e => e.key === "Enter" && handleEntrar()} style={IS} />
                </div>
              ))}
            </>
          )}

          {error && <div style={{ background: C.redDim, border: `1px solid ${C.red}44`, borderRadius: 8, padding: "10px 14px", color: C.red, fontSize: 12, marginBottom: 12 }}>{error}</div>}

          <button onClick={handleEntrar} disabled={loading} style={{ width: "100%", background: loading ? C.border : tela === "admin" ? `linear-gradient(135deg,${C.purple},${C.red})` : tela === "influencer" ? `linear-gradient(135deg,${C.gold},${C.orange})` : `linear-gradient(135deg,${C.accent},${C.purple})`, color: loading ? C.muted : "#000", border: "none", borderRadius: 12, padding: "14px", fontWeight: 800, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", letterSpacing: 2, fontFamily: "monospace" }}>
            {loading ? "AGUARDE..." : "ENTRAR"}
          </button>
          {tela === "lead" && <div style={{ color: C.muted, fontSize: 10, textAlign: "center", marginTop: 12 }}>Já cadastrado? Digite o mesmo contato.</div>}
        </div>
      </div>
    </div>
  );
}
