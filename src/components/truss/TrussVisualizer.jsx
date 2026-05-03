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
  if (Math.abs(force) < 0.5) return 'rgba(71,85,105,0.8)';
  const t = Math.min(Math.abs(force) / (maxForce || 1), 1);
  if (force > 0) return `rgba(${Math.round(56+t*30)},${Math.round(130+t*80)},${Math.round(220+t*35)},1)`;
  return `rgba(${Math.round(220+t*35)},${Math.round(60-t*40)},${Math.round(60-t*40)},1)`;
}

const IldTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-0.5">x = <span className="text-white font-mono">{parseFloat(label).toFixed(2)} m</span></div>
      <div className="text-sky-300 font-semibold">{payload[0].value.toFixed(5)}</div>
    </div>
  );
};

export default function TrussVisualizer({ nodes, members, loads, results, ildData, ildMemberId }) {
  const [hoveredMember, setHoveredMember] = useState(null);

  if (!nodes.length) {
    return (
      <div className="glass rounded-2xl h-56 flex flex-col items-center justify-center gap-3 animate-fade-in">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 3L2 21h20L12 3z"/>
          </svg>
        </div>
        <p className="text-slate-600 text-sm">Generate a truss to see the 2D diagram</p>
      </div>
    );
  }

  const PAD = 54;
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

  const ildMember = members.find((m) => m.id === ildMemberId);

  return (
    <div className="flex flex-col gap-4">

      {/* SVG 2D diagram */}
      <div className="glass rounded-2xl overflow-hidden animate-fade-in">
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-5 h-5 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3L2 21h20L12 3z"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">2D Truss Diagram</span>
          {results && (
            <div className="ml-auto flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-6 h-2 rounded-sm bg-blue-400 opacity-80"/>
                <span className="text-slate-500">Tension</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-6 h-2 rounded-sm bg-red-500 opacity-80"/>
                <span className="text-slate-500">Compression</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-6 h-2 rounded-sm bg-sky-400 opacity-60" style={{ borderTop: '2px dashed #38bdf8', background: 'none' }}/>
                <span className="text-slate-500">ILD member</span>
              </span>
            </div>
          )}
        </div>

        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: 'block' }} onMouseLeave={() => setHoveredMember(null)}>
          {/* Grid lines */}
          <line x1={PAD} y1={SVG_H-PAD-28} x2={SVG_W-PAD} y2={SVG_H-PAD-28} stroke="rgba(51,65,85,0.4)" strokeWidth="1"/>

          {members.map((m) => {
            const ni = nodeMap[m.nodeA], nj = nodeMap[m.nodeB];
            if (!ni || !nj) return null;
            const mf = mfArr.find((f) => f.id === m.id);
            const color = mf ? forceColor(mf.force, maxForce) : 'rgba(71,85,105,0.8)';
            const isH = hoveredMember === m.id;
            const mx = (tx(ni.x)+tx(nj.x))/2, my = (ty(ni.y)+ty(nj.y))/2;
            return (
              <g key={m.id}>
                <line x1={tx(ni.x)} y1={ty(ni.y)} x2={tx(nj.x)} y2={ty(nj.y)}
                  stroke={color} strokeWidth={isH ? 5 : 2.5} strokeLinecap="round"
                  style={{ cursor: 'pointer', filter: isH ? 'drop-shadow(0 0 4px currentColor)' : 'none' }}
                  onMouseEnter={() => setHoveredMember(m.id)}
                />
                {isH && mf && (
                  <g>
                    <rect x={mx-38} y={my-20} width={76} height={16} rx={4} fill="rgba(15,23,42,0.9)" />
                    <text x={mx} y={my-9} textAnchor="middle" fontSize={10} fill="#f1f5f9" fontWeight="600" style={{ pointerEvents: 'none' }}>
                      {fmtF(mf.force)}
                    </text>
                  </g>
                )}
                {m.id === ildMemberId && (
                  <line x1={tx(ni.x)} y1={ty(ni.y)} x2={tx(nj.x)} y2={ty(nj.y)}
                    stroke="#38bdf8" strokeWidth={2} strokeDasharray="5 3" opacity={0.7}
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
            const len = 32;
            return l.fy ? (
              <g key={l.id}>
                {(() => {
                  const isDown = l.fy < 0;
                  const y1 = isDown ? ny - len : ny + len;
                  const hd = isDown ? 1 : -1;
                  return <>
                    <line x1={nx} y1={y1} x2={nx} y2={ny} stroke="#f87171" strokeWidth={2} />
                    <polygon points={`${nx},${ny} ${nx-5},${ny-8*hd} ${nx+5},${ny-8*hd}`} fill="#f87171" />
                    <rect x={nx-18} y={y1-(isDown?16:-2)} width={36} height={12} rx={2} fill="rgba(127,29,29,0.7)" />
                    <text x={nx} y={y1-(isDown?7:7)} textAnchor="middle" fontSize={9} fill="#fca5a5" fontWeight="600">
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
            const isPin = n.id === (results ? undefined : n.id);
            return (
              <g key={n.id}>
                <circle cx={nx} cy={ny} r={4.5} fill="#0f172a" stroke="#475569" strokeWidth={1.5} />
                <circle cx={nx} cy={ny} r={2} fill="#64748b" />
                <text x={nx} y={ny-9} textAnchor="middle" fontSize={8} fill="#475569">N{n.id}</text>
              </g>
            );
          })}

          {/* Support symbols from pinNodeId / rollerNodeId passed via results or from sorted */}
          {nodes.map((n) => {
            const nx = tx(n.x), ny = ty(n.y);
            return null;
          })}
        </svg>
      </div>

      {/* Member forces + Node displacements */}
      {results && (
        <div className="grid grid-cols-2 gap-4 animate-fade-in-up">
          {/* Member forces */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14"/>
                </svg>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Member Forces</span>
            </div>
            <div className="overflow-auto max-h-56">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left py-2 px-3 text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Member</th>
                    <th className="text-right px-3 text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Force</th>
                    <th className="text-right px-3 text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {mfArr.map((m, i) => (
                    <tr key={m.id}
                      className={`border-t border-white/[0.03] transition-colors cursor-pointer ${
                        hoveredMember === m.id ? 'bg-white/[0.05]' : i % 2 === 0 ? 'bg-white/[0.01]' : ''
                      }`}
                      onMouseEnter={() => setHoveredMember(m.id)}
                      onMouseLeave={() => setHoveredMember(null)}>
                      <td className="py-1.5 px-3 text-slate-400 font-mono text-[10px]">N{m.nodeA}–N{m.nodeB}</td>
                      <td className={`text-right px-3 font-mono font-bold text-[10px] ${
                        m.force > 0 ? 'text-blue-400' : m.force < 0 ? 'text-red-400' : 'text-slate-600'
                      }`}>
                        {Math.abs(m.force) < 1 ? '≈0' : fmtF(m.force).split(' (')[0]}
                      </td>
                      <td className={`text-right px-3 text-[10px] font-bold ${
                        m.force > 0 ? 'text-blue-400' : m.force < 0 ? 'text-red-400' : 'text-slate-600'
                      }`}>
                        {Math.abs(m.force) < 1 ? '—' : m.force > 0 ? 'T' : 'C'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Node displacements */}
          <div className="glass rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 19V5m-7 7l7-7 7 7"/>
                </svg>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Node Displacements</span>
            </div>
            <div className="overflow-auto max-h-56">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    <th className="text-left py-2 px-3 text-[10px] text-slate-600 font-semibold uppercase tracking-wide">Node</th>
                    <th className="text-right px-3 text-[10px] text-slate-600 font-semibold uppercase tracking-wide">δx</th>
                    <th className="text-right px-3 text-[10px] text-slate-600 font-semibold uppercase tracking-wide">δy</th>
                  </tr>
                </thead>
                <tbody>
                  {ndArr.map((d, i) => (
                    <tr key={d.nodeId} className={`border-t border-white/[0.03] ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                      <td className="py-1.5 px-3 text-slate-400 font-mono text-[10px]">
                        N{d.nodeId} <span className="text-slate-700">({d.x.toFixed(1)},{d.y.toFixed(1)})</span>
                      </td>
                      <td className="text-right px-3 font-mono text-[10px] text-orange-300">{fmtMm(d.ux)}</td>
                      <td className="text-right px-3 font-mono text-[10px] text-purple-300">{fmtMm(d.uy)}</td>
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
        <div className="glass rounded-2xl overflow-hidden animate-fade-in-up">
          <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-5 h-5 rounded-md bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <svg className="w-3 h-3 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18M7 16l4-4 2 2 4-6"/>
              </svg>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Member Force ILD</div>
              {ildMember && (
                <div className="text-[9px] text-slate-600 mt-0.5">
                  M{ildMember.id}: N{ildMember.nodeA}–N{ildMember.nodeB} · unit load traverses bottom chord
                </div>
              )}
            </div>
          </div>
          <div className="p-3">
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={ildData} margin={{ top: 4, right: 10, left: 40, bottom: 16 }}>
                <defs>
                  <linearGradient id="tildGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#475569' }}
                  label={{ value: 'Load position (m)', position: 'insideBottom', offset: -8, fontSize: 9, fill: '#475569' }} />
                <YAxis tick={{ fontSize: 10, fill: '#475569' }} width={36} />
                <Tooltip content={<IldTip />} />
                <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 2" />
                <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="url(#tildGrad)" strokeWidth={2}
                  dot={{ r: 4, fill: '#38bdf8', stroke: '#0f172a', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
