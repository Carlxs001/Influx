// ── DESIGN TOKENS ─────────────────────────────────────────────────────────────
export const C = {
  bg: "#05060a", surface: "#0b0d14", card: "#0f1219", border: "#161b28",
  accent: "#00d4ff", accentDim: "#00d4ff18", gold: "#f5c542", goldDim: "#f5c54218",
  green: "#00e87a", greenDim: "#00e87a18", purple: "#9b6dff", purpleDim: "#9b6dff18",
  red: "#ff3d5a", redDim: "#ff3d5a18", orange: "#ff7043",
  text: "#dde3f0", sub: "#8892a4", muted: "#4a5568",
};

// ── UTILITÁRIOS ───────────────────────────────────────────────────────────────
export const fmt = (n) => {
  const num = Number(n);
  if (isNaN(num)) return "0";
  return new Intl.NumberFormat("pt-BR").format(num);
};

export const initials = (name = "") => {
  if (!name || typeof name !== "string") return "?";
  return name.trim().split(/\s+/).map(w => w[0] || "").join("").slice(0, 2).toUpperCase() || "?";
};

// FIX 4: Credenciais movidas para env — nunca hardcoded no fonte
export const EMAIL_ADMIN      = import.meta.env.VITE_ADMIN_EMAIL  || "";
export const SENHA_INFLUENCER = import.meta.env.VITE_SENHA_INFLUX || "";

// FIX: Streak + crédito de roleta calculados no servidor via RPC
// Esta função apenas recalcula localmente para exibição imediata
export const calcularStreakECredito = async (supabase, leadId) => {
  const { data } = await supabase.from("INFLUX").select("*").eq("id", leadId).single();
  if (!data) return;

  const hoje = new Date().toISOString().split("T")[0];
  const ultimoDia = data.Ultimo_Dia_Ativo;
  const entradas  = data.Entradas_De_Hoje || 0;

  let novoStreak  = data.Streak || 0;
  let novoCredito = data.Creditos_Da_Roleta || 0;

  if (ultimoDia) {
    const diff = Math.floor((new Date(hoje) - new Date(ultimoDia)) / 86400000);
    if (diff === 1 && entradas >= 7) novoStreak += 1;
    else if (diff > 1) novoStreak = entradas >= 7 ? 1 : 0;
  } else {
    novoStreak = entradas >= 7 ? 1 : 0;
  }

  if (novoStreak > 0 && novoStreak % 7 === 0) novoCredito += 1;

  const novoMult = entradas >= 12 ? 2 : 1;

  await supabase.from("INFLUX").update({
    Streak: novoStreak,
    Multiplicador: novoMult,
    Creditos_Da_Roleta: novoCredito,
    Ultimo_Dia_Ativo: hoje,
  }).eq("id", leadId);
};
