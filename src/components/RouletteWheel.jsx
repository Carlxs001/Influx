import { useRef, useState, useEffect, useCallback } from "react";
import { C } from "../lib/utils";

// Prêmios recebidos do banco via prop — FIX 8
export function RouletteWheel({ credits, prizes, onSpin }) {
  const canvasRef = useRef(null);
  const angleRef  = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [result,   setResult]   = useState(null);
  const arc = prizes.length > 0 ? (2 * Math.PI) / prizes.length : 0;

  const draw = useCallback((angle) => {
    const canvas = canvasRef.current;
    if (!canvas || prizes.length === 0) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2, r = cx - 12;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    prizes.forEach((seg, i) => {
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
    ctx.fillStyle = cGrd; ctx.fill();
    ctx.strokeStyle = C.accent; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = "bold 7px monospace"; ctx.fillStyle = C.accent;
    ctx.textAlign = "center"; ctx.shadowBlur = 0;
    ctx.fillText("INFLUX", cx, cy + 3);

    ctx.beginPath();
    ctx.moveTo(cx + r + 4, cy);
    ctx.lineTo(cx + r + 18, cy - 8);
    ctx.lineTo(cx + r + 18, cy + 8);
    ctx.closePath();
    ctx.fillStyle = C.accent; ctx.shadowColor = C.accent; ctx.shadowBlur = 10; ctx.fill();
  }, [arc, prizes]);

  useEffect(() => { draw(0); }, [draw]);

  const spin = async () => {
    if (spinning || credits < 1) return;
    setResult(null);
    setSpinning(true);

    // FIX 3: resultado vem do servidor (RPC executar_spin)
    const res = await onSpin();
    if (!res || !res.ok) {
      setSpinning(false);
      return;
    }

    // idx retornado pelo servidor — ordem do prêmio na lista (0-based)
    const winIdx = res.premio.idx ?? 0;

    // Calcula ângulo para o ponteiro apontar para o segmento correto
    const currentAngle = angleRef.current % (2 * Math.PI);
    const targetCenter = -winIdx * arc - arc / 2;
    const extraSpins   = 10 * Math.PI;
    let delta = (targetCenter - currentAngle + extraSpins) % (2 * Math.PI);
    if (delta < 0) delta += 2 * Math.PI;
    const totalAngle = delta + extraSpins;

    const dur = 5000, t0 = performance.now(), a0 = angleRef.current;

    const go = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = 1 - Math.pow(1 - p, 4);
      angleRef.current = a0 + totalAngle * e;
      draw(angleRef.current);

      if (p < 1) {
        requestAnimationFrame(go);
      } else {
        setSpinning(false);
        // Usa dados do prêmio que vieram do servidor
        setResult(res.premio);
      }
    };
    requestAnimationFrame(go);
  };

  const prizeColor = result ? (prizes.find(p => p.label === result.label)?.color || C.accent) : C.accent;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <canvas ref={canvasRef} width={280} height={280} aria-label="Roleta de prêmios INFLUX" role="img" />

      {result && (
        <div style={{
          background: prizeColor + "18", border: `1px solid ${prizeColor}66`,
          borderRadius: 14, padding: "14px 28px", textAlign: "center",
          animation: "fadeIn 0.4s ease",
        }}>
          <div style={{ color: prizeColor, fontWeight: 800, fontSize: 20 }}>Parabéns! {result.label}</div>
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
          fontWeight: 800, fontSize: 13,
          cursor: credits >= 1 && !spinning ? "pointer" : "not-allowed",
          letterSpacing: 1.5, transition: "all 0.2s",
        }}
      >
        {spinning ? "GIRANDO..." : credits >= 1 ? `GIRAR (${credits} crédito${credits > 1 ? "s" : ""})` : "SEM CRÉDITOS"}
      </button>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
