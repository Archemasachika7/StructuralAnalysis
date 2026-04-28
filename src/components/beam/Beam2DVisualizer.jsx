import { useMemo } from 'react';

const W = 680;
const H = 160;
const PAD_L = 40;
const PAD_R = 40;
const BEAM_Y = 90;
const BEAM_H = 10;

function toSvgX(x, span) {
  return PAD_L + (x / span) * (W - PAD_L - PAD_R);
}

function PinSupport({ cx, cy }) {
  const size = 14;
  return (
    <g>
      <polygon
        points={`${cx},${cy} ${cx - size},${cy + size * 1.5} ${cx + size},${cy + size * 1.5}`}
        fill="none" stroke="#60a5fa" strokeWidth={1.5}
      />
      <line x1={cx - size - 4} y1={cy + size * 1.5 + 4} x2={cx + size + 4} y2={cy + size * 1.5 + 4}
        stroke="#60a5fa" strokeWidth={1.5} />
    </g>
  );
}

function RollerSupport({ cx, cy }) {
  const size = 12;
  return (
    <g>
      <polygon
        points={`${cx},${cy} ${cx - size},${cy + size * 1.4} ${cx + size},${cy + size * 1.4}`}
        fill="none" stroke="#34d399" strokeWidth={1.5}
      />
      <circle cx={cx - size + 5} cy={cy + size * 1.4 + 6} r={4} fill="none" stroke="#34d399" strokeWidth={1.5} />
      <circle cx={cx + size - 5} cy={cy + size * 1.4 + 6} r={4} fill="none" stroke="#34d399" strokeWidth={1.5} />
    </g>
  );
}

function FixedSupport({ cx, cy }) {
  return (
    <g>
      <rect x={cx - 4} y={cy - 14} width={8} height={28} fill="#f59e0b" />
      {[-12, -6, 0, 6, 12].map((dy) => (
        <line key={dy} x1={cx - 4} y1={cy + dy} x2={cx - 14} y2={cy + dy + 8}
          stroke="#f59e0b" strokeWidth={1} />
      ))}
    </g>
  );
}

function Arrow({ x, magnitude, span, label }) {
  const sx = toSvgX(x, span);
  const isDown = magnitude < 0;
  const arrowLen = 35;
  const y1 = isDown ? BEAM_Y - arrowLen : BEAM_Y + BEAM_H + arrowLen;
  const y2 = isDown ? BEAM_Y : BEAM_Y + BEAM_H;
  const color = isDown ? '#f87171' : '#4ade80';
  const headDir = isDown ? 1 : -1;

  return (
    <g>
      <line x1={sx} y1={y1} x2={sx} y2={y2} stroke={color} strokeWidth={2} />
      <polygon
        points={`${sx},${y2} ${sx - 5},${y2 - 10 * headDir} ${sx + 5},${y2 - 10 * headDir}`}
        fill={color}
      />
      <text x={sx} y={y1 - (isDown ? 4 : -12)} textAnchor="middle" fontSize={9} fill={color}>
        {label}
      </text>
    </g>
  );
}

function UDLArrows({ x1, x2, magnitude, span }) {
  const sx1 = toSvgX(x1, span);
  const sx2 = toSvgX(x2, span);
  const isDown = magnitude < 0;
  const topY = isDown ? BEAM_Y - 30 : BEAM_Y + BEAM_H + 30;
  const baseY = isDown ? BEAM_Y : BEAM_Y + BEAM_H;
  const color = '#a78bfa';
  const steps = Math.max(2, Math.round((sx2 - sx1) / 18));

  return (
    <g>
      <line x1={sx1} y1={topY} x2={sx2} y2={topY} stroke={color} strokeWidth={1.5} />
      {Array.from({ length: steps + 1 }, (_, i) => {
        const px = sx1 + (i / steps) * (sx2 - sx1);
        const headDir = isDown ? 1 : -1;
        return (
          <g key={i}>
            <line x1={px} y1={topY} x2={px} y2={baseY} stroke={color} strokeWidth={1} />
            <polygon points={`${px},${baseY} ${px - 3},${baseY - 7 * headDir} ${px + 3},${baseY - 7 * headDir}`} fill={color} />
          </g>
        );
      })}
      <text x={(sx1 + sx2) / 2} y={topY - 4} textAnchor="middle" fontSize={9} fill={color}>
        {(magnitude / 1000).toFixed(1)} kN/m
      </text>
    </g>
  );
}

export default function Beam2DVisualizer({ beam }) {
  const { span, supports, pointLoads, udls, moments } = beam;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 text-xs text-slate-400 font-semibold">
        BEAM DIAGRAM
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {/* Background grid */}
        {Array.from({ length: 11 }, (_, i) => (
          <line key={i}
            x1={toSvgX((i / 10) * span, span)} y1={20}
            x2={toSvgX((i / 10) * span, span)} y2={H - 10}
            stroke="#1e293b" strokeWidth={1}
          />
        ))}

        {/* UDLs */}
        {udls.map((u) => (
          <UDLArrows key={u.id} x1={u.x1} x2={u.x2} magnitude={u.magnitude} span={span} />
        ))}

        {/* Beam body */}
        <rect
          x={PAD_L} y={BEAM_Y} width={W - PAD_L - PAD_R} height={BEAM_H}
          fill="#334155" stroke="#60a5fa" strokeWidth={1.5} rx={2}
        />

        {/* Point loads */}
        {pointLoads.map((pl) => (
          <Arrow key={pl.id} x={pl.x} magnitude={pl.magnitude} span={span}
            label={`${(pl.magnitude / 1000).toFixed(1)}kN`} />
        ))}

        {/* Moments */}
        {moments.map((m) => {
          const sx = toSvgX(m.x, span);
          return (
            <g key={m.id}>
              <text x={sx} y={BEAM_Y - 8} textAnchor="middle" fontSize={16} fill="#fbbf24">
                {m.magnitude > 0 ? '↺' : '↻'}
              </text>
              <text x={sx} y={BEAM_Y - 22} textAnchor="middle" fontSize={9} fill="#fbbf24">
                {(m.magnitude / 1000).toFixed(1)}kN·m
              </text>
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

        {/* Dimension line */}
        <line x1={PAD_L} y1={H - 12} x2={W - PAD_R} y2={H - 12} stroke="#475569" strokeWidth={1} />
        <text x={(PAD_L + W - PAD_R) / 2} y={H - 3} textAnchor="middle" fontSize={10} fill="#64748b">
          L = {span} m
        </text>

        {/* X labels for supports */}
        {supports.map((s) => (
          <text key={s.id} x={toSvgX(s.x, span)} y={H - 14} textAnchor="middle" fontSize={9} fill="#94a3b8">
            x={s.x}
          </text>
        ))}
      </svg>
    </div>
  );
}
