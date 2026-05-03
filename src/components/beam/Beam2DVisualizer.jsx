const W = 700;
const H = 175;
const PAD_L = 44;
const PAD_R = 44;
const BEAM_Y = 95;
const BEAM_H = 10;

function toSvgX(x, span) {
  return PAD_L + (x / span) * (W - PAD_L - PAD_R);
}

function PinSupport({ cx, cy }) {
  const sz = 13;
  return (
    <g>
      <polygon points={`${cx},${cy} ${cx-sz},${cy+sz*1.5} ${cx+sz},${cy+sz*1.5}`} fill="none" stroke="#60a5fa" strokeWidth={1.5} />
      <line x1={cx-sz-4} y1={cy+sz*1.5+4} x2={cx+sz+4} y2={cy+sz*1.5+4} stroke="#60a5fa" strokeWidth={1.5} />
    </g>
  );
}

function RollerSupport({ cx, cy }) {
  const sz = 12;
  return (
    <g>
      <polygon points={`${cx},${cy} ${cx-sz},${cy+sz*1.4} ${cx+sz},${cy+sz*1.4}`} fill="none" stroke="#34d399" strokeWidth={1.5} />
      <circle cx={cx-sz+5} cy={cy+sz*1.4+6} r={4} fill="none" stroke="#34d399" strokeWidth={1.5} />
      <circle cx={cx+sz-5} cy={cy+sz*1.4+6} r={4} fill="none" stroke="#34d399" strokeWidth={1.5} />
    </g>
  );
}

function FixedSupport({ cx, cy }) {
  return (
    <g>
      <rect x={cx-4} y={cy-14} width={8} height={28} fill="#f59e0b" />
      {[-10,-4,2,8,14].map((dy) => (
        <line key={dy} x1={cx-4} y1={cy-14+dy} x2={cx-14} y2={cy-14+dy+8} stroke="#f59e0b" strokeWidth={1} />
      ))}
    </g>
  );
}

function HingeSymbol({ cx, cy }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill="#0f172a" stroke="#fbbf24" strokeWidth={2} />
      <line x1={cx-8} y1={cy-8} x2={cx+8} y2={cy+8} stroke="#fbbf24" strokeWidth={1} />
      <line x1={cx+8} y1={cy-8} x2={cx-8} y2={cy+8} stroke="#fbbf24" strokeWidth={1} />
    </g>
  );
}

function Arrow({ x, magnitude, span, label }) {
  const sx = toSvgX(x, span);
  const isDown = magnitude < 0;
  const len = 36;
  const y1 = isDown ? BEAM_Y - len : BEAM_Y + BEAM_H + len;
  const y2 = isDown ? BEAM_Y : BEAM_Y + BEAM_H;
  const color = isDown ? '#f87171' : '#4ade80';
  const hd = isDown ? 1 : -1;
  return (
    <g>
      <line x1={sx} y1={y1} x2={sx} y2={y2} stroke={color} strokeWidth={2} />
      <polygon points={`${sx},${y2} ${sx-5},${y2-10*hd} ${sx+5},${y2-10*hd}`} fill={color} />
      <text x={sx} y={y1-(isDown?5:-10)} textAnchor="middle" fontSize={9} fill={color}>{label}</text>
    </g>
  );
}

function UDLBlock({ x1, x2, magnitude, span, color = '#a78bfa' }) {
  const sx1 = toSvgX(x1, span);
  const sx2 = toSvgX(x2, span);
  const isDown = magnitude < 0;
  const topY = isDown ? BEAM_Y - 32 : BEAM_Y + BEAM_H + 32;
  const baseY = isDown ? BEAM_Y : BEAM_Y + BEAM_H;
  const steps = Math.max(2, Math.round((sx2 - sx1) / 20));
  const hd = isDown ? 1 : -1;
  return (
    <g>
      <line x1={sx1} y1={topY} x2={sx2} y2={topY} stroke={color} strokeWidth={1.5} />
      {Array.from({ length: steps + 1 }, (_, i) => {
        const px = sx1 + (i / steps) * (sx2 - sx1);
        return (
          <g key={i}>
            <line x1={px} y1={topY} x2={px} y2={baseY} stroke={color} strokeWidth={1} />
            <polygon points={`${px},${baseY} ${px-3},${baseY-7*hd} ${px+3},${baseY-7*hd}`} fill={color} />
          </g>
        );
      })}
      <text x={(sx1+sx2)/2} y={topY-4} textAnchor="middle" fontSize={9} fill={color}>
        {(magnitude/1000).toFixed(1)} kN/m
      </text>
    </g>
  );
}

function TriLoad({ x1, x2, w1, w2, span }) {
  const sx1 = toSvgX(x1, span);
  const sx2 = toSvgX(x2, span);
  const isDown = (w1 + w2) < 0;
  const scale = 32 / (Math.max(Math.abs(w1), Math.abs(w2)) || 1);
  const h1 = Math.abs(w1) * scale;
  const h2 = Math.abs(w2) * scale;
  const baseY = isDown ? BEAM_Y : BEAM_Y + BEAM_H;
  const color = '#fcd34d';
  const sign = isDown ? -1 : 1;
  const steps = Math.max(2, Math.round((sx2 - sx1) / 22));
  return (
    <g>
      {/* Envelope line */}
      <line x1={sx1} y1={baseY - sign * h1} x2={sx2} y2={baseY - sign * h2} stroke={color} strokeWidth={1.5} />
      <line x1={sx1} y1={baseY - sign * h1} x2={sx1} y2={baseY} stroke={color} strokeWidth={1} strokeDasharray="3 2" />
      <line x1={sx2} y1={baseY - sign * h2} x2={sx2} y2={baseY} stroke={color} strokeWidth={1} strokeDasharray="3 2" />
      {/* Arrows */}
      {Array.from({ length: steps + 1 }, (_, i) => {
        const t = i / steps;
        const px = sx1 + t * (sx2 - sx1);
        const wt = w1 + (w2 - w1) * t;
        if (Math.abs(wt) < 1e-6) return null;
        const ht = Math.abs(wt) * scale;
        const tipY = isDown ? BEAM_Y : BEAM_Y + BEAM_H;
        const startY = tipY - sign * ht;
        return (
          <g key={i}>
            <line x1={px} y1={startY} x2={px} y2={tipY} stroke={color} strokeWidth={1} />
            <polygon points={`${px},${tipY} ${px-3},${tipY-7*sign} ${px+3},${tipY-7*sign}`} fill={color} />
          </g>
        );
      })}
      <text x={(sx1+sx2)/2} y={baseY - sign * Math.max(h1, h2) - 5} textAnchor="middle" fontSize={9} fill={color}>
        {(w1/1000).toFixed(1)}→{(w2/1000).toFixed(1)} kN/m
      </text>
    </g>
  );
}

export default function Beam2DVisualizer({ beam }) {
  const { span, supports = [], pointLoads = [], udls = [], triangularLoads = [], customLoads = [], moments = [], hinges = [] } = beam;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 text-xs text-slate-400 font-semibold flex items-center gap-4">
        BEAM DIAGRAM
        <span className="text-slate-600 font-normal">
          {supports.length} supports · {pointLoads.length} PL · {udls.length} UDL
          {triangularLoads.length ? ` · ${triangularLoads.length} TL` : ''}
          {customLoads.length ? ` · ${customLoads.length} custom` : ''}
          {hinges.length ? ` · ${hinges.length} hinge` : ''}
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Grid */}
        {Array.from({ length: 11 }, (_, i) => (
          <line key={i} x1={toSvgX(i/10*span,span)} y1={16} x2={toSvgX(i/10*span,span)} y2={H-10} stroke="#1e293b" strokeWidth={1} />
        ))}

        {/* Custom load regions */}
        {customLoads.map((c) => (
          <rect key={c.id} x={toSvgX(c.x1,span)} y={BEAM_Y-38} width={toSvgX(c.x2,span)-toSvgX(c.x1,span)} height={38}
            fill="#14532d30" stroke="#22c55e" strokeWidth={1} strokeDasharray="4 2" />
        ))}
        {customLoads.map((c) => (
          <text key={c.id} x={(toSvgX(c.x1,span)+toSvgX(c.x2,span))/2} y={BEAM_Y-42} textAnchor="middle" fontSize={9} fill="#22c55e">
            w(x)
          </text>
        ))}

        {/* UDLs */}
        {udls.map((u) => <UDLBlock key={u.id} x1={u.x1} x2={u.x2} magnitude={u.magnitude} span={span} />)}

        {/* Triangular loads */}
        {triangularLoads.map((t) => <TriLoad key={t.id} x1={t.x1} x2={t.x2} w1={t.w1} w2={t.w2} span={span} />)}

        {/* Beam */}
        <rect x={PAD_L} y={BEAM_Y} width={W-PAD_L-PAD_R} height={BEAM_H} fill="#334155" stroke="#60a5fa" strokeWidth={1.5} rx={2} />

        {/* Hinges on beam */}
        {hinges.map((h) => <HingeSymbol key={h.id} cx={toSvgX(h.x,span)} cy={BEAM_Y+BEAM_H/2} />)}

        {/* Point loads */}
        {pointLoads.map((pl) => (
          <Arrow key={pl.id} x={pl.x} magnitude={pl.magnitude} span={span} label={`${(pl.magnitude/1000).toFixed(1)}kN`} />
        ))}

        {/* Moments */}
        {moments.map((m) => {
          const sx = toSvgX(m.x, span);
          return (
            <g key={m.id}>
              <text x={sx} y={BEAM_Y-8} textAnchor="middle" fontSize={18} fill="#fbbf24">{m.magnitude>0?'↺':'↻'}</text>
              <text x={sx} y={BEAM_Y-24} textAnchor="middle" fontSize={9} fill="#fbbf24">{(m.magnitude/1000).toFixed(1)}kN·m</text>
            </g>
          );
        })}

        {/* Supports */}
        {supports.map((s) => {
          const sx = toSvgX(s.x, span);
          const sy = BEAM_Y + BEAM_H;
          if (s.type === 'roller') return <RollerSupport key={s.id} cx={sx} cy={sy} />;
          if (s.type === 'fixed') return <FixedSupport key={s.id} cx={sx} cy={sy} />;
          return <PinSupport key={s.id} cx={sx} cy={sy} />;
        })}

        {/* Dimension */}
        <line x1={PAD_L} y1={H-10} x2={W-PAD_R} y2={H-10} stroke="#475569" strokeWidth={1} />
        <text x={(PAD_L+W-PAD_R)/2} y={H-2} textAnchor="middle" fontSize={10} fill="#64748b">L = {span} m</text>
        {supports.map((s) => (
          <text key={s.id} x={toSvgX(s.x,span)} y={H-12} textAnchor="middle" fontSize={9} fill="#94a3b8">x={s.x}</text>
        ))}
      </svg>
    </div>
  );
}
