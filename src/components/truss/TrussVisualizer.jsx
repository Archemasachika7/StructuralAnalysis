import { useMemo, useState } from 'react';

function forceColor(force, maxForce) {
  if (Math.abs(force) < 1) return '#94a3b8'; // near zero
  const t = Math.min(Math.abs(force) / (maxForce || 1), 1);
  if (force > 0) {
    // Tension: blue scale
    const r = Math.round(30 + t * 20);
    const g = Math.round(100 + t * 80);
    const b = Math.round(200 + t * 55);
    return `rgb(${r},${g},${b})`;
  } else {
    // Compression: red scale
    const r = Math.round(200 + t * 55);
    const g = Math.round(50 - t * 30);
    const b = Math.round(50 - t * 30);
    return `rgb(${r},${g},${b})`;
  }
}

function fmtForce(v) {
  const abs = Math.abs(v);
  const sign = v >= 0 ? 'T' : 'C';
  if (abs >= 1e6) return `${(abs / 1e6).toFixed(2)} MN (${sign})`;
  if (abs >= 1e3) return `${(abs / 1e3).toFixed(2)} kN (${sign})`;
  return `${abs.toFixed(0)} N (${sign})`;
}

export default function TrussVisualizer({ nodes, members, loads, results }) {
  const [hoveredMember, setHoveredMember] = useState(null);
  const [tooltip, setTooltip] = useState({ x: 0, y: 0, text: '' });

  if (!nodes.length) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-700 h-64 flex items-center justify-center text-slate-600 text-sm">
        Generate a truss to see visualization
      </div>
    );
  }

  // Compute SVG bounds
  const PAD = 50;
  const SVG_W = 720;
  const SVG_H = 260;

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const scaleX = (SVG_W - 2 * PAD) / spanX;
  const scaleY = (SVG_H - 2 * PAD - 40) / spanY;
  const scale = Math.min(scaleX, scaleY);

  const tx = (x) => PAD + (x - minX) * scale;
  const ty = (y) => SVG_H - PAD - 30 - (y - minY) * scale;

  const memberForces = results?.memberForces || [];
  const maxForce = memberForces.length
    ? Math.max(...memberForces.map((m) => Math.abs(m.force)))
    : 1;

  const nodeMap = {};
  nodes.forEach((n) => { nodeMap[n.id] = n; });

  // Support nodes (leftmost = pin, rightmost = roller)
  const sortedNodes = [...nodes].sort((a, b) => a.x - b.x);
  const pinNode = sortedNodes[0];
  const rollerNode = sortedNodes[sortedNodes.length - 1];

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 relative">
      <div className="px-3 py-2 border-b border-slate-700 flex items-center gap-4">
        <span className="text-xs font-semibold text-slate-400">TRUSS DIAGRAM</span>
        {results && (
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-blue-400"></span>
              Tension
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-red-500"></span>
              Compression
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm bg-slate-500"></span>
              Near Zero
            </span>
          </div>
        )}
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ display: 'block' }}
        onMouseLeave={() => setHoveredMember(null)}
      >
        {/* Members */}
        {members.map((m) => {
          const ni = nodeMap[m.nodeA];
          const nj = nodeMap[m.nodeB];
          if (!ni || !nj) return null;
          const x1 = tx(ni.x), y1 = ty(ni.y);
          const x2 = tx(nj.x), y2 = ty(nj.y);
          const mf = memberForces.find((f) => f.nodeA === m.nodeA && f.nodeB === m.nodeB || f.id === m.id);
          const color = mf ? forceColor(mf.force, maxForce) : '#475569';
          const isHovered = hoveredMember === m.id;
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;

          return (
            <g key={m.id}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={color}
                strokeWidth={isHovered ? 4 : 2.5}
                strokeLinecap="round"
                style={{ cursor: 'pointer' }}
                onMouseEnter={(e) => {
                  setHoveredMember(m.id);
                  if (mf) {
                    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
                    setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, text: fmtForce(mf.force) });
                  }
                }}
              />
              {isHovered && mf && (
                <text x={mx} y={my - 6} textAnchor="middle" fontSize={10} fill="#f1f5f9"
                  className="pointer-events-none">
                  {fmtForce(mf.force)}
                </text>
              )}
            </g>
          );
        })}

        {/* Loads */}
        {loads.map((l) => {
          const n = nodeMap[l.nodeId];
          if (!n) return null;
          const nx = tx(n.x), ny = ty(n.y);
          const arrowLen = 28;
          if (l.fy) {
            const isDown = l.fy < 0;
            const y1 = isDown ? ny - arrowLen : ny + arrowLen;
            const y2 = ny;
            const headDir = isDown ? 1 : -1;
            return (
              <g key={l.id}>
                <line x1={nx} y1={y1} x2={nx} y2={y2} stroke="#f87171" strokeWidth={2} />
                <polygon points={`${nx},${y2} ${nx-5},${y2-8*headDir} ${nx+5},${y2-8*headDir}`} fill="#f87171" />
                <text x={nx} y={y1-(isDown?4:-6)} textAnchor="middle" fontSize={9} fill="#f87171">
                  {(l.fy/1000).toFixed(0)}kN
                </text>
              </g>
            );
          }
          return null;
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const nx = tx(n.x), ny = ty(n.y);
          const isPin = n.id === pinNode.id;
          const isRoller = n.id === rollerNode.id;
          return (
            <g key={n.id}>
              {isPin && (
                <polygon
                  points={`${nx},${ny+2} ${nx-9},${ny+16} ${nx+9},${ny+16}`}
                  fill="none" stroke="#60a5fa" strokeWidth={1.5}
                />
              )}
              {isRoller && (
                <g>
                  <polygon points={`${nx},${ny+2} ${nx-9},${ny+16} ${nx+9},${ny+16}`}
                    fill="none" stroke="#34d399" strokeWidth={1.5} />
                  <circle cx={nx-5} cy={ny+20} r={3} fill="none" stroke="#34d399" strokeWidth={1.5} />
                  <circle cx={nx+5} cy={ny+20} r={3} fill="none" stroke="#34d399" strokeWidth={1.5} />
                </g>
              )}
              <circle cx={nx} cy={ny} r={4} fill="#1e293b" stroke="#94a3b8" strokeWidth={1.5} />
              <text x={nx} y={ny-7} textAnchor="middle" fontSize={8} fill="#64748b">
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Force table */}
      {results && memberForces.length > 0 && (
        <div className="border-t border-slate-700 p-3">
          <div className="text-xs font-semibold text-slate-400 mb-2">MEMBER FORCES</div>
          <div className="overflow-x-auto">
            <table className="text-xs w-full">
              <thead>
                <tr className="text-slate-500">
                  <th className="text-left pb-1 pr-4">Member</th>
                  <th className="text-right pb-1 pr-4">Force</th>
                  <th className="text-right pb-1 pr-4">Type</th>
                  <th className="text-right pb-1">Length (m)</th>
                </tr>
              </thead>
              <tbody>
                {memberForces.map((m) => (
                  <tr key={m.id}
                    className={`border-t border-slate-800 ${hoveredMember === m.id ? 'bg-slate-800' : ''}`}
                    onMouseEnter={() => setHoveredMember(m.id)}
                    onMouseLeave={() => setHoveredMember(null)}
                  >
                    <td className="py-0.5 pr-4 text-slate-400">
                      N{m.nodeA}–N{m.nodeB}
                    </td>
                    <td className={`text-right pr-4 font-mono ${m.force > 0 ? 'text-blue-400' : m.force < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {fmtForce(m.force).split(' (')[0]}
                    </td>
                    <td className={`text-right pr-4 ${m.force > 0 ? 'text-blue-400' : m.force < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                      {Math.abs(m.force) < 1 ? '—' : m.force > 0 ? 'Tension' : 'Compression'}
                    </td>
                    <td className="text-right text-slate-500">{m.L.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
