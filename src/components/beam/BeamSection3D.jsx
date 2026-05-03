function isoProject(x, y, z, scale = 1) {
  const isoX = (x - z) * 0.866 * scale;
  const isoY = (x + z) * 0.5 * scale - y * scale;
  return { x: isoX, y: isoY };
}

function shifted(points, dx, dy) {
  return points.map((p) => `${(p.x + dx).toFixed(2)},${(p.y + dy).toFixed(2)}`).join(' ');
}

function estimateRectFromI(I) {
  const safeI = Math.max(Math.abs(I) || 1e-4, 1e-8);
  // assume b = h / 2 for display-only section reconstruction
  const h = Math.max(0.1, Math.cbrt(24 * safeI));
  const b = h / 2;
  return { b, h };
}

function supportGlyph(type, x, y) {
  if (type === 'fixed') {
    return (
      <g>
        <line x1={x} y1={y - 20} x2={x} y2={y + 4} stroke="#f8fafc" strokeWidth="2.2" />
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={i}
            x1={x - 14}
            y1={y - 20 + i * 4}
            x2={x}
            y2={y - 24 + i * 4}
            stroke="#94a3b8"
            strokeWidth="1"
          />
        ))}
      </g>
    );
  }

  if (type === 'roller') {
    return (
      <g>
        <polygon points={`${x},${y} ${x - 12},${y + 16} ${x + 12},${y + 16}`} fill="none" stroke="#34d399" strokeWidth="1.6" />
        <circle cx={x - 6} cy={y + 20} r={3} fill="none" stroke="#34d399" strokeWidth="1.4" />
        <circle cx={x + 6} cy={y + 20} r={3} fill="none" stroke="#34d399" strokeWidth="1.4" />
      </g>
    );
  }

  return <polygon points={`${x},${y} ${x - 12},${y + 16} ${x + 12},${y + 16}`} fill="none" stroke="#60a5fa" strokeWidth="1.6" />;
}

export default function BeamSection3D({ beam }) {
  const { b, h } = estimateRectFromI(beam.I);
  const length = Math.max(0.5, Math.abs(beam.span) || 1);

  const maxLoads = Math.max(
    ...beam.pointLoads.map((p) => Math.abs(p.magnitude)),
    ...beam.udls.map((u) => Math.abs(u.magnitude * (u.x2 - u.x1))),
    1,
  );

  const maxMoment = Math.max(...beam.moments.map((m) => Math.abs(m.magnitude)), 1);

  const targetSpanPx = 460;
  const scale = Math.min(34, Math.max(12, targetSpanPx / length));
  const originX = 100;
  const originY = 200;

  const front = [
    isoProject(0, 0, 0, scale),
    isoProject(0, h, 0, scale),
    isoProject(0, h, b, scale),
    isoProject(0, 0, b, scale),
  ];

  const back = [
    isoProject(length, 0, 0, scale),
    isoProject(length, h, 0, scale),
    isoProject(length, h, b, scale),
    isoProject(length, 0, b, scale),
  ];

  const beamAxisStart = isoProject(0, 0, b * 0.5, scale);
  const beamAxisEnd = isoProject(length, 0, b * 0.5, scale);

  const xAt = (x) => isoProject(Math.min(Math.max(x, 0), length), 0, b * 0.5, scale).x + originX;
  const yAt = (x) => isoProject(Math.min(Math.max(x, 0), length), 0, b * 0.5, scale).y + originY;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 text-xs text-slate-400 font-semibold">
        BEAM 3D INPUT-ALIGNED VIEW
      </div>

      <div className="p-3">
        <svg width="100%" viewBox="0 0 760 300" style={{ display: 'block' }}>
          <rect x="0" y="0" width="760" height="300" fill="#0f172a" />

          <polygon points={shifted(back, originX, originY)} fill="#334155" stroke="#94a3b8" strokeWidth="1.3" />
          <polygon points={shifted(front, originX, originY)} fill="#1e293b" stroke="#93c5fd" strokeWidth="1.6" />

          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={front[i].x + originX}
              y1={front[i].y + originY}
              x2={back[i].x + originX}
              y2={back[i].y + originY}
              stroke="#60a5fa"
              strokeWidth="1.4"
            />
          ))}

          {beam.supports.map((s) => (
            <g key={`sup-${s.id}`}>
              {supportGlyph(s.type, xAt(s.x), yAt(s.x) + 4)}
              <text x={xAt(s.x)} y={yAt(s.x) + 38} textAnchor="middle" fill="#94a3b8" fontSize="10">
                {s.type}@{s.x.toFixed(2)}m
              </text>
            </g>
          ))}

          {beam.pointLoads.map((p) => {
            const x = xAt(p.x);
            const y = yAt(p.x);
            const signed = p.magnitude || 0;
            const arrow = 14 + 24 * (Math.abs(signed) / maxLoads);
            const down = signed < 0;
            return (
              <g key={`pl-${p.id}`}>
                <line x1={x} y1={y - (down ? arrow : -arrow)} x2={x} y2={y - 4} stroke="#f87171" strokeWidth="2" />
                <polygon
                  points={`${x},${y - 4} ${x - 5},${y - 12} ${x + 5},${y - 12}`}
                  fill="#f87171"
                  transform={down ? undefined : `rotate(180 ${x} ${y - 8})`}
                />
              </g>
            );
          })}

          {beam.udls.map((u) => {
            const x1 = xAt(u.x1);
            const x2 = xAt(u.x2);
            const topY = Math.min(yAt(u.x1), yAt(u.x2)) - 30;
            return (
              <g key={`udl-${u.id}`}>
                <line x1={x1} y1={topY} x2={x2} y2={topY} stroke="#c084fc" strokeWidth="2" />
                {Array.from({ length: 7 }, (_, i) => {
                  const t = i / 6;
                  const xx = x1 + (x2 - x1) * t;
                  return (
                    <line
                      key={i}
                      x1={xx}
                      y1={topY}
                      x2={xx}
                      y2={topY + 16}
                      stroke="#c084fc"
                      strokeWidth="1.4"
                    />
                  );
                })}
              </g>
            );
          })}

          {beam.moments.map((m) => {
            const x = xAt(m.x);
            const y = yAt(m.x) - 24;
            const r = 8 + 10 * (Math.abs(m.magnitude) / maxMoment);
            const clockwise = m.magnitude < 0;
            return (
              <g key={`mom-${m.id}`}>
                <path
                  d={`M ${x - r} ${y} A ${r} ${r} 0 1 1 ${x + r} ${y}`}
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth="2"
                  transform={clockwise ? undefined : `rotate(180 ${x} ${y})`}
                />
                <polygon
                  points={`${x + r},${y} ${x + r - 8},${y - 4} ${x + r - 7},${y + 4}`}
                  fill="#fbbf24"
                  transform={clockwise ? undefined : `rotate(180 ${x} ${y})`}
                />
              </g>
            );
          })}

          <text x="34" y="34" fill="#cbd5e1" fontSize="12">Span = {length.toFixed(2)} m · I = {(beam.I || 0).toExponential(3)} m⁴</text>
          <text x="34" y="52" fill="#cbd5e1" fontSize="12">Reconstructed section b ≈ {b.toFixed(3)} m, h ≈ {h.toFixed(3)} m</text>
          <text x="34" y="70" fill="#a5f3fc" fontSize="11">Supports: {beam.supports.length} · Point loads: {beam.pointLoads.length} · UDLs: {beam.udls.length} · Moments: {beam.moments.length}</text>

          <line x1={beamAxisStart.x + originX} y1={beamAxisStart.y + originY + 44} x2={beamAxisEnd.x + originX} y2={beamAxisEnd.y + originY + 44} stroke="#475569" strokeWidth="1" />
          <text x={beamAxisEnd.x + originX + 8} y={beamAxisEnd.y + originY + 48} fill="#64748b" fontSize="10">Length axis</text>
        </svg>
      </div>
    </div>
  );
}
