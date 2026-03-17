import { C, initials } from "../lib/utils";

export function Avatar({ name, size = 36, color = C.accent }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: color + "22", border: `1.5px solid ${color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color, fontWeight: 800, fontSize: size * 0.3,
      flexShrink: 0, fontFamily: "monospace",
    }}>
      {initials(name)}
    </div>
  );
}

export function Pill({ label, color }) {
  return (
    <span style={{
      background: color + "22", color,
      border: `1px solid ${color}44`,
      borderRadius: 20, padding: "3px 10px",
      fontSize: 10, fontWeight: 700,
    }}>{label}</span>
  );
}

export function StatCard({ icon, label, value, color = C.accent, sub }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
      padding: "16px 18px", flex: 1, minWidth: 110,
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `radial-gradient(circle at top right, ${color}15, transparent 70%)` }} />
      <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
      <div style={{ color, fontSize: 22, fontWeight: 900, fontFamily: "monospace", lineHeight: 1 }}>{value}</div>
      <div style={{ color: C.sub, fontSize: 11, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ color: C.sub, fontSize: 10, marginTop: 3 }}>{sub}</div>}
    </div>
  );
}
