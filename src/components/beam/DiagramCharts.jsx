import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

const H = 155;

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
    <div className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200">
      <div>x = {parseFloat(label).toFixed(3)} m</div>
      <div>{fmt(payload[0].value)}</div>
    </div>
  );
};

function downsample(data, n = 250) {
  if (!data || data.length <= n) return data || [];
  const step = Math.ceil(data.length / n);
  return data.filter((_, i) => i % step === 0);
}

function Card({ title, children }) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700">
      <div className="px-3 py-1.5 border-b border-slate-700 text-xs font-semibold text-slate-400">{title}</div>
      <div className="p-2">{children}</div>
    </div>
  );
}

export default function DiagramCharts({ results, ildData, ildX, ildType }) {
  if (!results) return null;
  const data = downsample(results.data);

  return (
    <div className="flex flex-col gap-3">
      {/* Reactions */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 px-4 py-3">
        <div className="text-xs font-semibold text-slate-400 mb-2">SUPPORT REACTIONS</div>
        <div className="flex gap-6 flex-wrap">
          {results.reactions.map((r) => (
            <div key={r.id} className="text-sm">
              <span className="text-slate-400">x={r.x}m: </span>
              <span className="text-blue-300 font-mono">{fmtN(r.reaction)}</span>
              <span className="text-slate-500 ml-1">↑</span>
            </div>
          ))}
        </div>
        <div className="flex gap-6 mt-2 flex-wrap text-xs text-slate-500">
          <span>Max |V|: <span className="text-yellow-400">{fmtN(results.maxShear)}</span></span>
          <span>Max |M|: <span className="text-green-400">{fmtNm(results.maxMoment)}</span></span>
          <span>Max |δ|: <span className="text-purple-400">{fmtMm(results.maxDeflection)}</span></span>
        </div>
      </div>

      {/* SFD */}
      <Card title={`SHEAR FORCE DIAGRAM  (max = ${fmtN(results.maxShear)})`}>
        <ResponsiveContainer width="100%" height={H}>
          <AreaChart data={data} margin={{ top: 4, right: 10, left: 56, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={fmtN} width={54} />
            <Tooltip content={<Tip fmt={fmtN} />} />
            <ReferenceLine y={0} stroke="#475569" />
            <Area type="stepAfter" dataKey="shear" stroke="#facc15" fill="#facc1520" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* BMD */}
      <Card title={`BENDING MOMENT DIAGRAM  (max = ${fmtNm(results.maxMoment)})`}>
        <ResponsiveContainer width="100%" height={H}>
          <AreaChart data={data} margin={{ top: 4, right: 10, left: 56, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={fmtNm} width={54} />
            <Tooltip content={<Tip fmt={fmtNm} />} />
            <ReferenceLine y={0} stroke="#475569" />
            <Area type="monotone" dataKey="moment" stroke="#4ade80" fill="#4ade8020" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Deflection */}
      <Card title={`DEFLECTION CURVE  (max = ${fmtMm(results.maxDeflection)})`}>
        <ResponsiveContainer width="100%" height={H}>
          <AreaChart data={data} margin={{ top: 4, right: 10, left: 66, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={fmtMm} width={62} />
            <Tooltip content={<Tip fmt={fmtMm} />} />
            <ReferenceLine y={0} stroke="#475569" />
            <Area type="monotone" dataKey="deflection" stroke="#a78bfa" fill="#a78bfa20" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* ILD — single chart, type from ildType */}
      {ildData && ildData.length > 0 && (
        <Card title={`INFLUENCE LINE — ${ildType === 'moment' ? 'Bending Moment' : 'Shear Force'} at x = ${ildX} m`}>
          <div className="text-xs text-slate-500 px-1 mb-1">
            Unit downward load traverses span → ordinate = {ildType === 'moment' ? 'moment (m)' : 'shear force'} at x={ildX}
          </div>
          <ResponsiveContainer width="100%" height={H}>
            <AreaChart data={downsample(ildData, 300)} margin={{ top: 4, right: 10, left: 40, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#64748b' }} label={{ value: 'Unit load position (m)', position: 'insideBottom', offset: -2, fontSize: 9, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} width={38} />
              <Tooltip content={<Tip fmt={(v) => v.toFixed(5)} />} />
              <ReferenceLine y={0} stroke="#475569" strokeDasharray="4 2" />
              <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="#38bdf820" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
