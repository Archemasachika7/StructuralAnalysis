function isoProject(x, y, z, scale = 1) {
  const isoX = (x - z) * 0.866 * scale;
  const isoY = (x + z) * 0.5 * scale - y * scale;
  return { x: isoX, y: isoY };
}

export default function TrussSection3D({ truss }) {
  const depth = Math.max(1.2, truss.height * 0.35);
  const span = Math.max(4, truss.span || 12);
  const bays = Math.max(2, truss.bays || 4);
  const height = Math.max(1, truss.height || 3);
  const dx = span / bays;
  const scale = 20;

  const bottomFront = Array.from({ length: bays + 1 }, (_, i) => isoProject(i * dx, 0, 0, scale));
  const topFront = Array.from({ length: bays + 1 }, (_, i) => isoProject(i * dx, height, 0, scale));
  const bottomBack = Array.from({ length: bays + 1 }, (_, i) => isoProject(i * dx, 0, depth, scale));
  const topBack = Array.from({ length: bays + 1 }, (_, i) => isoProject(i * dx, height, depth, scale));

  const diagonals = Array.from({ length: bays }, (_, i) => {
    const left = i;
    const right = i + 1;
    if (truss.type === 'howe') {
      return [bottomFront[right], topFront[left], bottomBack[right], topBack[left]];
    }
    if (truss.type === 'warren') {
      return i % 2 === 0
        ? [bottomFront[left], topFront[right], bottomBack[left], topBack[right]]
        : [bottomFront[right], topFront[left], bottomBack[right], topBack[left]];
    }
    return [bottomFront[left], topFront[right], bottomBack[left], topBack[right]];
  });

  const line = (a, b, key, color = '#22d3ee', w = 1.3) => (
    <line
      key={key}
      x1={a.x + 90}
      y1={a.y + 200}
      x2={b.x + 90}
      y2={b.y + 200}
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
    />
  );

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 text-xs text-slate-400 font-semibold">
        TRUSS 3D FRAME VIEW
      </div>

      <div className="p-3">
        <svg width="100%" viewBox="0 0 760 280" style={{ display: 'block' }}>
          <rect x="0" y="0" width="760" height="280" fill="#0f172a" />

          {bottomFront.slice(0, -1).map((p, i) => line(p, bottomFront[i + 1], `bf-${i}`, '#60a5fa', 2))}
          {topFront.slice(0, -1).map((p, i) => line(p, topFront[i + 1], `tf-${i}`, '#34d399', 2))}
          {bottomBack.slice(0, -1).map((p, i) => line(p, bottomBack[i + 1], `bb-${i}`, '#334155'))}
          {topBack.slice(0, -1).map((p, i) => line(p, topBack[i + 1], `tb-${i}`, '#334155'))}

          {bottomFront.map((p, i) => line(p, bottomBack[i], `db-${i}`, '#475569'))}
          {topFront.map((p, i) => line(p, topBack[i], `dt-${i}`, '#475569'))}
          {bottomFront.map((p, i) => line(p, topFront[i], `vf-${i}`, '#2dd4bf'))}

          {diagonals.map((d, i) => (
            <g key={`diag-${i}`}>
              {line(d[0], d[1], `f-${i}`, '#f59e0b')}
              {line(d[2], d[3], `b-${i}`, '#92400e')}
            </g>
          ))}

          {bottomFront.map((p, i) => (
            <text key={`n-${i}`} x={p.x + 94} y={p.y + 214} fill="#94a3b8" fontSize="9">N{i}</text>
          ))}

          <text x="26" y="34" fill="#cbd5e1" fontSize="12">Type: {truss.type.toUpperCase()} · Bays: {bays}</text>
          <text x="26" y="52" fill="#cbd5e1" fontSize="12">Span: {span.toFixed(2)} m · Height: {height.toFixed(2)} m · Depth: {depth.toFixed(2)} m</text>
          <text x="26" y="70" fill="#64748b" fontSize="11">Front frame = analysis plane, back frame = depth preview</text>

          <line x1="76" y1="238" x2="582" y2="238" stroke="#475569" strokeWidth="1" />
          <text x="590" y="242" fill="#64748b" fontSize="10">Span axis</text>
        </svg>
      </div>
    </div>
  );
}
