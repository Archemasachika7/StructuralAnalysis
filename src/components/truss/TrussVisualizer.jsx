import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

function fmtF(v) {
  const a = Math.abs(v), s = v >= 0 ? 'T' : 'C';
  if (a >= 1e6) return `${(a/1e6).toFixed(2)} MN (${s})`;
  if (a >= 1e3) return `${(a/1e3).toFixed(2)} kN (${s})`;
  return `${a.toFixed(0)} N (${s})`;
}
function fmtMm(v) { return `${(v*1000).toFixed(4)} mm`; }

function forceColor(force, maxForce) {
  if (Math.abs(force) < 0.5) return '#475569';
  const t = Math.min(Math.abs(force) / (maxForce || 1), 1);
  if (force > 0) return `rgb(${Math.round(30+t*20)},${Math.round(100+t*80)},${Math.round(200+t*55)})`;
  return `rgb(${Math.round(200+t*55)},${Math.round(50-t*30)},${Math.round(50-t*30)})`;
}

const IldTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200">
      <div>x = {parseFloat(label).toFixed(2)} m</div>
      <div>Force influence: {payload[0].value.toFixed(5)}</div>
    </div>
  );
};

export default function TrussVisualizer({ nodes, members, loads, results, ildData, ildMemberId }) {
  const [hoveredMember, setHoveredMember] = useState(null);

  if (!nodes.length) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-700 h-56 flex items-center justify-center text-slate-600 text-sm">
        Generate a truss to see the 2D diagram
      </div>
    );
  }

  const PAD = 50;
  const SVG_W = 740;
  const SVG_H = 260;

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const scaleX = (SVG_W - 2*PAD) / spanX;
  const scaleY = (SVG_H - 2*PAD - 40) / spanY;
  const scale = Math.min(scaleX, scaleY);
  const tx = (x) => PAD + (x - minX) * scale;
  const ty = (y) => SVG_H - PAD - 30 - (y - minY) * scale;

  const mfArr = results?.memberForces || [];
  const ndArr = results?.nodeDisplacements || [];
  const maxForce = mfArr.length ? Math.max(...mfArr.map((m) => Math.abs(m.force))) : 1;

  const nodeMap = {};
  nodes.forEach((n) => { nodeMap[n.id] = n; });

  const sortedByX = [...nodes].sort((a, b) => a.x - b.x);
  const pinNode = sortedByX[0];
  const rollerNode = sortedByX[sortedByX.length - 1];

  const ildMember = members.find((m) => m.id === ildMemberId);

  return (
    <div className="flex flex-col gap-3">
      {/* SVG 2D diagram */}
      <div className="bg-slate-900 rounded-lg border border-slate-700">
        <div className="px-3 py-2 border-b border-slate-700 flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-400">2D TRUSS DIAGRAM</span>
          {results && (
            <div className="flex gap-4 text-xs">
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-blue-400"/>Tension</span>
              <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-red-500"/>Compression</span>
            </div>
          )}
        </div>

        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }} onMouseLeave={() => setHoveredMember(null)}>
          {members.map((m) => {
            const ni = nodeMap[m.nodeA], nj = nodeMap[m.nodeB];
            if (!ni || !nj) return null;
            const mf = mfArr.find((f) => f.id === m.id);
            const color = mf ? forceColor(mf.force, maxForce) : '#475569';
            const isH = hoveredMember === m.id;
            const mx = (tx(ni.x)+tx(nj.x))/2, my = (ty(ni.y)+ty(nj.y))/2;
            return (
              <g key={m.id}>
                <line x1={tx(ni.x)} y1={ty(ni.y)} x2={tx(nj.x)} y2={ty(nj.y)}
                  stroke={color} strokeWidth={isH ? 4.5 : 2.5} strokeLinecap="round"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredMember(m.id)}
                />
                {isH && mf && (
                  <text x={mx} y={my-7} textAnchor="middle" fontSize={10} fill="#f1f5f9" style={{ pointerEvents: 'none' }}>
                    {fmtF(mf.force)}
                  </text>
                )}
                {/* Highlight ILD member */}
                {m.id === ildMemberId && (
                  <line x1={tx(ni.x)} y1={ty(ni.y)} x2={tx(nj.x)} y2={ty(nj.y)}
                    stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.6}
                    style={{ pointerEvents: 'none' }}
                  />
                )}
              </g>
            );
          })}

          {/* Loads */}
          {loads.map((l) => {
            const n = nodeMap[l.nodeId];
            if (!n) return null;
            const nx = tx(n.x), ny = ty(n.y);
            const len = 30;
            return l.fy ? (
              <g key={l.id}>
                {(() => {
                  const isDown = l.fy < 0;
                  const y1 = isDown ? ny - len : ny + len;
                  const hd = isDown ? 1 : -1;
                  return <>
                    <line x1={nx} y1={y1} x2={nx} y2={ny} stroke="#f87171" strokeWidth={2} />
                    <polygon points={`${nx},${ny} ${nx-5},${ny-8*hd} ${nx+5},${ny-8*hd}`} fill="#f87171" />
                    <text x={nx} y={y1-(isDown?5:-7)} textAnchor="middle" fontSize={9} fill="#f87171">
                      {(Math.abs(l.fy)/1000).toFixed(0)}kN
                    </text>
                  </>;
                })()}
              </g>
            ) : null;
          })}

          {/* Nodes */}
          {nodes.map((n) => {
            const nx = tx(n.x), ny = ty(n.y);
            const isPin = n.id === pinNode.id, isRoller = n.id === rollerNode.id;
            return (
              <g key={n.id}>
                {isPin && <polygon points={`${nx},${ny+2} ${nx-9},${ny+16} ${nx+9},${ny+16}`} fill="none" stroke="#60a5fa" strokeWidth={1.5} />}
                {isRoller && (
                  <g>
                    <polygon points={`${nx},${ny+2} ${nx-9},${ny+16} ${nx+9},${ny+16}`} fill="none" stroke="#34d399" strokeWidth={1.5} />
                    <circle cx={nx-5} cy={ny+20} r={3} fill="none" stroke="#34d399" strokeWidth={1.5} />
                    <circle cx={nx+5} cy={ny+20} r={3} fill="none" stroke="#34d399" strokeWidth={1.5} />
                  </g>
                )}
                <circle cx={nx} cy={ny} r={4} fill="#1e293b" stroke="#94a3b8" strokeWidth={1.5} />
                <text x={nx} y={ny-7} textAnchor="middle" fontSize={8} fill="#64748b">N{n.id}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Member forces table + node displacements side by side */}
      {results && (
        <div className="grid grid-cols-2 gap-3">
          {/* Member forces */}
          <div className="bg-slate-900 rounded-lg border border-slate-700">
            <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold text-slate-400">MEMBER FORCES</div>
            <div className="overflow-auto max-h-56">
              <table className="text-xs w-full">
                <thead><tr className="text-slate-500">
                  <th className="text-left py-1 px-2">Members</th>
                  <th className="text-right px-2">Force</th>
                  <th className="text-right px-2">Type</th>
                </tr></thead>
                <tbody>
                  {mfArr.map((m) => (
                    <tr key={m.id}
                      className={`border-t border-slate-800 ${hoveredMember===m.id?'bg-slate-800':''}`}
                      onMouseEnter={()=>setHoveredMember(m.id)} onMouseLeave={()=>setHoveredMember(null)}>
                      <td className="py-0.5 px-2 text-slate-400">N{m.nodeA}–N{m.nodeB}</td>
                      <td className={`text-right px-2 font-mono ${m.force>0?'text-blue-400':m.force<0?'text-red-400':'text-slate-500'}`}>
                        {Math.abs(m.force)<1?'0':fmtF(m.force).split(' (')[0]}
                      </td>
                      <td className={`text-right px-2 ${m.force>0?'text-blue-400':m.force<0?'text-red-400':'text-slate-500'}`}>
                        {Math.abs(m.force)<1?'—':m.force>0?'T':'C'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Node displacements */}
          <div className="bg-slate-900 rounded-lg border border-slate-700">
            <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold text-slate-400">NODE DISPLACEMENTS</div>
            <div className="overflow-auto max-h-56">
              <table className="text-xs w-full">
                <thead><tr className="text-slate-500">
                  <th className="text-left py-1 px-2">Node</th>
                  <th className="text-right px-2">δx</th>
                  <th className="text-right px-2">δy</th>
                </tr></thead>
                <tbody>
                  {ndArr.map((d) => (
                    <tr key={d.nodeId} className="border-t border-slate-800">
                      <td className="py-0.5 px-2 text-slate-400">
                        N{d.nodeId} <span className="text-slate-600">({d.x.toFixed(1)},{d.y.toFixed(1)})</span>
                      </td>
                      <td className="text-right px-2 font-mono text-orange-300">{fmtMm(d.ux)}</td>
                      <td className="text-right px-2 font-mono text-purple-300">{fmtMm(d.uy)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Truss ILD */}
      {ildData && ildData.length > 0 && (
        <div className="bg-slate-900 rounded-lg border border-slate-700">
          <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold text-slate-400">
            MEMBER FORCE ILD — {ildMember ? `M${ildMember.id}: N${ildMember.nodeA}–N${ildMember.nodeB}` : ''}
          </div>
          <div className="px-2 pt-1 pb-0 text-xs text-slate-500">Unit load traverses bottom chord nodes</div>
          <div className="p-2">
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={ildData} margin={{ top: 4, right: 10, left: 40, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Load position (m)', position: 'insideBottom', offset: -2, fontSize: 9, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={36} />
                <Tooltip content={<IldTip />} />
                <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="#38bdf820" strokeWidth={2} dot={{ r: 4, fill: '#38bdf8', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
