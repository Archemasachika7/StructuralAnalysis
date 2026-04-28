function isoProject(x, y, z, scale = 1) {
  const isoX = (x - z) * 0.866 * scale;
  const isoY = (x + z) * 0.5 * scale - y * scale;
  return { x: isoX, y: isoY };
}

function shifted(points, dx, dy) {
  return points.map((p) => `${(p.x + dx).toFixed(2)},${(p.y + dy).toFixed(2)}`).join(' ');
}

function estimateRectFromI(I) {
  // assume b = h / 2 for display-only section reconstruction
  const h = Math.max(0.1, Math.cbrt(24 * I));
  const b = h / 2;
  return { b, h };
}

export default function BeamSection3D({ beam }) {
  const { b, h } = estimateRectFromI(beam.I || 1e-4);

  const length = Math.max(3, beam.span || 10);
  const scale = 18;

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

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 text-xs text-slate-400 font-semibold">
        BEAM 3D SECTION VIEW
      </div>

      <div className="p-3">
        <svg width="100%" viewBox="0 0 700 260" style={{ display: 'block' }}>
          <rect x="0" y="0" width="700" height="260" fill="#0f172a" />

          <polygon points={shifted(back, 140, 185)} fill="#334155" stroke="#94a3b8" strokeWidth="1.3" />
          <polygon points={shifted(front, 140, 185)} fill="#1e293b" stroke="#93c5fd" strokeWidth="1.6" />

          {[0, 1, 2, 3].map((i) => (
            <line
              key={i}
              x1={front[i].x + 140}
              y1={front[i].y + 185}
              x2={back[i].x + 140}
              y2={back[i].y + 185}
              stroke="#60a5fa"
              strokeWidth="1.4"
            />
          ))}

          <text x="40" y="36" fill="#cbd5e1" fontSize="12">Span ≈ {length.toFixed(2)} m</text>
          <text x="40" y="54" fill="#cbd5e1" fontSize="12">Assumed rectangular section from I</text>
          <text x="40" y="72" fill="#a5f3fc" fontSize="12">b ≈ {b.toFixed(3)} m</text>
          <text x="40" y="90" fill="#a5f3fc" fontSize="12">h ≈ {h.toFixed(3)} m</text>
          <text x="40" y="108" fill="#a5f3fc" fontSize="12">I = {beam.I?.toExponential(3)} m⁴</text>

          <line x1="70" y1="216" x2="522" y2="216" stroke="#475569" strokeWidth="1" />
          <text x="530" y="220" fill="#64748b" fontSize="10">Length axis</text>
        </svg>
      </div>
    </div>
  );
}
