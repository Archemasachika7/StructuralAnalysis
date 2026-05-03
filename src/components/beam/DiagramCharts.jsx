import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

const H = 160;

function fmtN(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return `${(v/1e6).toFixed(2)} MN`;
  if (a >= 1e3) return `${(v/1e3).toFixed(2)} kN`;
  return `${v.toFixed(0)} N`;
}
function fmtNm(v) {
  const a = Math.abs(v);
  if (a >= 1e6) return `${(v/1e6).toFixed(2)} MN·m`;
  if (a >= 1e3) return `${(v/1e3).toFixed(2)} kN·m`;
  return `${v.toFixed(0)} N·m`;
}
function fmtMm(v) { return `${(v*1000).toFixed(3)} mm`; }

const Tip = ({ active, payload, label, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="text-slate-400 mb-0.5">x = <span className="text-white font-mono">{parseFloat(label).toFixed(3)} m</span></div>
      <div className="text-white font-semibold">{fmt(payload[0].value)}</div>
    </div>
  );
};

function downsample(data, n = 250) {
  if (!data || data.length <= n) return data || [];
  const step = Math.ceil(data.length / n);
  return data.filter((_, i) => i % step === 0);
}

function ChartCard({ title, subtitle, badge, badgeColor, children }) {
  const badgeColors = {
    yellow:  'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    green:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    purple:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
    sky:     'bg-sky-500/10 text-sky-400 border-sky-500/20',
  };
  return (
    <div className="glass rounded-2xl overflow-hidden animate-fade-in-up">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
        <div className="flex-1">
          <div className="text-xs font-bold text-slate-300 tracking-wide">{title}</div>
          {subtitle && <div className="text-[10px] text-slate-600 mt-0.5">{subtitle}</div>}
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColors[badgeColor] || badgeColors.sky}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}

const gridStyle = { stroke: 'rgba(255,255,255,0.04)', strokeDasharray: '0' };
const axisStyle = { fontSize: 10, fill: '#475569' };
const refLine = { stroke: '#334155' };

export default function DiagramCharts({ results, ildData, ildX, ildType }) {
  if (!results) return null;
  const data = downsample(results.data);

  return (
    <div className="flex flex-col gap-4">

      {/* Reactions summary */}
      <div className="glass rounded-2xl px-4 py-3 animate-fade-in">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-md bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M5 21V9l7-6 7 6v12"/>
            </svg>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Support Reactions</span>
        </div>
        <div className="flex gap-4 flex-wrap mb-3">
          {results.reactions.map((r) => (
            <div key={r.id} className="flex items-center gap-2 bg-blue-500/5 border border-blue-500/10 rounded-xl px-3 py-2">
              <span className="text-[10px] text-slate-500">x = {r.x} m</span>
              <span className="text-blue-300 font-mono font-bold text-xs">{fmtN(r.reaction)}</span>
              <span className="text-slate-600 text-xs">↑</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Max Shear',     val: fmtN(results.maxShear),       color: 'text-yellow-400',  bg: 'bg-yellow-500/5 border-yellow-500/10' },
            { label: 'Max Moment',    val: fmtNm(results.maxMoment),      color: 'text-emerald-400', bg: 'bg-emerald-500/5 border-emerald-500/10' },
            { label: 'Max Deflection',val: fmtMm(results.maxDeflection),  color: 'text-purple-400',  bg: 'bg-purple-500/5 border-purple-500/10' },
          ].map(({ label, val, color, bg }) => (
            <div key={label} className={`rounded-xl px-3 py-2 border ${bg}`}>
              <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-0.5">{label}</div>
              <div className={`font-mono font-bold text-xs ${color}`}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SFD */}
      <ChartCard
        title="Shear Force Diagram"
        badge={fmtN(results.maxShear)}
        badgeColor="yellow"
        subtitle="V(x) — positive convention: left face upward">
        <ResponsiveContainer width="100%" height={H}>
          <AreaChart data={data} margin={{ top: 4, right: 10, left: 56, bottom: 4 }}>
            <defs>
              <linearGradient id="sfGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#facc15" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#facc15" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="x" tick={axisStyle} />
            <YAxis tick={axisStyle} tickFormatter={fmtN} width={54} />
            <Tooltip content={<Tip fmt={fmtN} />} />
            <ReferenceLine y={0} {...refLine} />
            <Area type="stepAfter" dataKey="shear" stroke="#facc15" fill="url(#sfGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* BMD */}
      <ChartCard
        title="Bending Moment Diagram"
        badge={fmtNm(results.maxMoment)}
        badgeColor="green"
        subtitle="M(x) — sagging positive">
        <ResponsiveContainer width="100%" height={H}>
          <AreaChart data={data} margin={{ top: 4, right: 10, left: 62, bottom: 4 }}>
            <defs>
              <linearGradient id="bmGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="x" tick={axisStyle} />
            <YAxis tick={axisStyle} tickFormatter={fmtNm} width={60} />
            <Tooltip content={<Tip fmt={fmtNm} />} />
            <ReferenceLine y={0} {...refLine} />
            <Area type="monotone" dataKey="moment" stroke="#4ade80" fill="url(#bmGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Deflection */}
      <ChartCard
        title="Deflection Curve"
        badge={fmtMm(results.maxDeflection)}
        badgeColor="purple"
        subtitle="δ(x) — elastic line (EI integration)">
        <ResponsiveContainer width="100%" height={H}>
          <AreaChart data={data} margin={{ top: 4, right: 10, left: 66, bottom: 4 }}>
            <defs>
              <linearGradient id="defGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02}/>
              </linearGradient>
            </defs>
            <CartesianGrid {...gridStyle} />
            <XAxis dataKey="x" tick={axisStyle} />
            <YAxis tick={axisStyle} tickFormatter={fmtMm} width={64} />
            <Tooltip content={<Tip fmt={fmtMm} />} />
            <ReferenceLine y={0} {...refLine} />
            <Area type="monotone" dataKey="deflection" stroke="#a78bfa" fill="url(#defGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ILD */}
      {ildData && ildData.length > 0 && (
        <ChartCard
          title={`Influence Line — ${ildType === 'moment' ? 'Bending Moment' : 'Shear Force'} at x = ${ildX} m`}
          badge="ILD"
          badgeColor="sky"
          subtitle="Ordinate = response per unit moving downward load (Müller-Breslau)">
          <ResponsiveContainer width="100%" height={H}>
            <AreaChart data={downsample(ildData, 300)} margin={{ top: 4, right: 10, left: 40, bottom: 16 }}>
              <defs>
                <linearGradient id="ildGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid {...gridStyle} />
              <XAxis dataKey="x" tick={axisStyle}
                label={{ value: 'Unit load position (m)', position: 'insideBottom', offset: -8, fontSize: 9, fill: '#475569' }} />
              <YAxis tick={axisStyle} width={38} />
              <Tooltip content={<Tip fmt={(v) => v.toFixed(5)} />} />
              <ReferenceLine y={0} stroke="#334155" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="url(#ildGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
