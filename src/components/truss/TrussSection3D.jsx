function isoProject(x, y, z, scale = 1) {
  const isoX = (x - z) * 0.866 * scale;
  const isoY = (x + z) * 0.5 * scale - y * scale;
  return { x: isoX, y: isoY };
}

function buildPreviewNodes(truss) {
  if (truss.nodes.length) return truss.nodes;
  const bays = Math.max(2, truss.bays || 4);
  const span = Math.max(2, truss.span || 12);
  const height = Math.max(0.5, truss.height || 3);
  const dx = span / bays;

  const bottom = Array.from({ length: bays + 1 }, (_, i) => ({ id: i + 1, x: i * dx, y: 0 }));
  const top = Array.from({ length: bays + 1 }, (_, i) => ({ id: bays + 2 + i, x: i * dx, y: height }));
  return [...bottom, ...top];
}

export default function TrussSection3D({ truss }) {
  const nodes = buildPreviewNodes(truss);
  const members = truss.members || [];

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 1);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 1);

  const span = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 0.5);
  const depth = Math.max(1, height * 0.45);

  const scale = Math.min(30, Math.max(11, 500 / span));
  const offsetX = 85;
  const offsetY = 210;

  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]));

  const pos3 = (node, back = false) => isoProject(node.x - minX, node.y - minY, back ? depth : 0, scale);

  const line = (a, b, key, color = '#22d3ee', w = 1.3, dash = undefined) => (
    <line
      key={key}
      x1={a.x + offsetX}
      y1={a.y + offsetY}
      x2={b.x + offsetX}
      y2={b.y + offsetY}
      stroke={color}
      strokeWidth={w}
      strokeDasharray={dash}
      strokeLinecap="round"
    />
  );

  const supportNodes = [...nodes].sort((a, b) => a.x - b.x);
  const pinNode = supportNodes[0];
  const rollerNode = supportNodes[supportNodes.length - 1];

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 text-xs text-slate-400 font-semibold">
        TRUSS 3D INPUT-ALIGNED VIEW
      </div>

      <div className="p-3">
        <svg width="100%" viewBox="0 0 760 300" style={{ display: 'block' }}>
          <rect x="0" y="0" width="760" height="300" fill="#0f172a" />

          {members.map((m) => {
            const na = nodeMap[m.nodeA];
            const nb = nodeMap[m.nodeB];
            if (!na || !nb) return null;
            return line(pos3(na, true), pos3(nb, true), `m-back-${m.id}`, '#334155', 1.2);
          })}

          {members.map((m) => {
            const na = nodeMap[m.nodeA];
            const nb = nodeMap[m.nodeB];
            if (!na || !nb) return null;
            return (
              <g key={`m-front-${m.id}`}>
                {line(pos3(na), pos3(nb), `mf-${m.id}`, '#38bdf8', 1.8)}
                {line(pos3(na), pos3(na, true), `ma-${m.id}`, '#475569', 1)}
                {line(pos3(nb), pos3(nb, true), `mb-${m.id}`, '#475569', 1)}
              </g>
            );
          })}

          {!members.length && (
            <text x="34" y="92" fill="#f59e0b" fontSize="11">
              No generated members yet. Click “Generate Truss” to project the real 3D frame.
            </text>
          )}

          {nodes.map((n) => {
            const f = pos3(n);
            const b = pos3(n, true);
            return (
              <g key={`node-${n.id}`}>
                <circle cx={b.x + offsetX} cy={b.y + offsetY} r={2.8} fill="#334155" />
                <circle cx={f.x + offsetX} cy={f.y + offsetY} r={3.4} fill="#0f172a" stroke="#a7f3d0" strokeWidth="1.2" />
                <text x={f.x + offsetX + 4} y={f.y + offsetY - 4} fill="#94a3b8" fontSize="9">N{n.id}</text>
              </g>
            );
          })}

          {truss.loads.map((l) => {
            const n = nodeMap[l.nodeId];
            if (!n) return null;
            const p = pos3(n);
            const x = p.x + offsetX;
            const y = p.y + offsetY;
            const fy = l.fy || 0;
            const len = Math.min(30, 10 + Math.abs(fy) / 2000);
            const down = fy < 0;
            return (
              <g key={`load-${l.id}`}>
                {!!l.fx && (
                  <>
                    <line x1={x - (l.fx > 0 ? len : -len)} y1={y} x2={x} y2={y} stroke="#fb7185" strokeWidth="1.8" />
                    <polygon
                      points={`${x},${y} ${x - 6},${y - 3} ${x - 6},${y + 3}`}
                      fill="#fb7185"
                      transform={l.fx > 0 ? undefined : `rotate(180 ${x} ${y})`}
                    />
                  </>
                )}
                {!!fy && (
                  <>
                    <line x1={x} y1={y - (down ? len : -len)} x2={x} y2={y} stroke="#f87171" strokeWidth="1.8" />
                    <polygon
                      points={`${x},${y} ${x - 4},${y - 7} ${x + 4},${y - 7}`}
                      fill="#f87171"
                      transform={down ? undefined : `rotate(180 ${x} ${y})`}
                    />
                  </>
                )}
              </g>
            );
          })}

          {pinNode && (
            <polygon
              points={`${pos3(pinNode).x + offsetX},${pos3(pinNode).y + offsetY + 4} ${pos3(pinNode).x + offsetX - 9},${pos3(pinNode).y + offsetY + 18} ${pos3(pinNode).x + offsetX + 9},${pos3(pinNode).y + offsetY + 18}`}
              fill="none"
              stroke="#60a5fa"
              strokeWidth="1.4"
            />
          )}

          {rollerNode && (
            <g>
              <polygon
                points={`${pos3(rollerNode).x + offsetX},${pos3(rollerNode).y + offsetY + 4} ${pos3(rollerNode).x + offsetX - 9},${pos3(rollerNode).y + offsetY + 18} ${pos3(rollerNode).x + offsetX + 9},${pos3(rollerNode).y + offsetY + 18}`}
                fill="none"
                stroke="#34d399"
                strokeWidth="1.4"
              />
              <circle cx={pos3(rollerNode).x + offsetX - 5} cy={pos3(rollerNode).y + offsetY + 22} r={2.7} fill="none" stroke="#34d399" strokeWidth="1.4" />
              <circle cx={pos3(rollerNode).x + offsetX + 5} cy={pos3(rollerNode).y + offsetY + 22} r={2.7} fill="none" stroke="#34d399" strokeWidth="1.4" />
            </g>
          )}

          <text x="26" y="34" fill="#cbd5e1" fontSize="12">Type: {truss.type.toUpperCase()} · Nodes: {nodes.length} · Members: {members.length}</text>
          <text x="26" y="52" fill="#cbd5e1" fontSize="12">Span: {span.toFixed(2)} m · Height: {height.toFixed(2)} m · Depth: {depth.toFixed(2)} m</text>
          <text x="26" y="70" fill="#64748b" fontSize="11">Front = analysis plane from your inputs, back = depth extrusion</text>

          <line
            x1={isoProject(0, 0, depth * 0.5, scale).x + offsetX}
            y1={isoProject(0, 0, depth * 0.5, scale).y + offsetY + 46}
            x2={isoProject(span, 0, depth * 0.5, scale).x + offsetX}
            y2={isoProject(span, 0, depth * 0.5, scale).y + offsetY + 46}
            stroke="#475569"
            strokeWidth="1"
          />
          <text x={isoProject(span, 0, depth * 0.5, scale).x + offsetX + 8} y={isoProject(span, 0, depth * 0.5, scale).y + offsetY + 50} fill="#64748b" fontSize="10">Span axis</text>
          <line x1="640" y1="180" x2="682" y2="180" stroke="#38bdf8" strokeWidth="1.8" />
          <text x="688" y="184" fill="#64748b" fontSize="10">member</text>
          <line x1="640" y1="198" x2="682" y2="198" stroke="#f87171" strokeWidth="1.8" />
          <text x="688" y="202" fill="#64748b" fontSize="10">load</text>
          <line x1="640" y1="216" x2="682" y2="216" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
          <text x="688" y="220" fill="#64748b" fontSize="10">depth connector</text>
        </svg>
      </div>
    </div>
  );
}
