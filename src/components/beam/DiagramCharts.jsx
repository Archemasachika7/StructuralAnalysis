import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Label,
} from 'recharts';

const CHART_HEIGHT = 160;

function ChartCard({ title, color, children }) {
  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700">
      <div className="px-3 py-2 border-b border-slate-700 text-xs font-semibold text-slate-400">
        {title}
      </div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function fmtN(v) {
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)} MN`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(2)} kN`;
  return `${v.toFixed(0)} N`;
}
function fmtNm(v) {
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${(v / 1e6).toFixed(2)} MN·m`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(2)} kN·m`;
  return `${v.toFixed(0)} N·m`;
}
function fmtMm(v) { return `${(v * 1000).toFixed(3)} mm`; }

const CustomTooltip = ({ active, payload, label, fmt }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200">
      <div>x = {parseFloat(label).toFixed(3)} m</div>
      <div>{fmt(payload[0].value)}</div>
    </div>
  );
};

// Downsample data for performance
function downsample(data, n = 250) {
  if (data.length <= n) return data;
  const step = Math.ceil(data.length / n);
  return data.filter((_, i) => i % step === 0);
}

export default function DiagramCharts({ results, ildResults, ildX }) {
  if (!results) return null;

  const data = downsample(results.data);
  const maxS = results.maxShear;
  const maxM = results.maxMoment;
  const maxD = results.maxDeflection;

  return (
    <div className="flex flex-col gap-3">
      {/* Reactions summary */}
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
          <span>Max |V|: <span className="text-yellow-400">{fmtN(maxS)}</span></span>
          <span>Max |M|: <span className="text-green-400">{fmtNm(maxM)}</span></span>
          <span>Max |δ|: <span className="text-purple-400">{fmtMm(maxD)}</span></span>
        </div>
      </div>

      {/* SFD */}
      <ChartCard title={`SHEAR FORCE DIAGRAM (max = ${fmtN(maxS)})`} color="#facc15">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 55, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => fmtN(v)} width={52} />
            <Tooltip content={<CustomTooltip fmt={fmtN} />} />
            <ReferenceLine y={0} stroke="#475569" />
            <Area type="stepAfter" dataKey="shear" stroke="#facc15" fill="#facc1520" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* BMD */}
      <ChartCard title={`BENDING MOMENT DIAGRAM (max = ${fmtNm(maxM)})`} color="#4ade80">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 55, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => fmtNm(v)} width={52} />
            <Tooltip content={<CustomTooltip fmt={fmtNm} />} />
            <ReferenceLine y={0} stroke="#475569" />
            <Area type="monotone" dataKey="moment" stroke="#4ade80" fill="#4ade8020" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Deflection */}
      <ChartCard title={`DEFLECTION CURVE (max = ${fmtMm(maxD)})`} color="#a78bfa">
        <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 65, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="x" tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => fmtMm(v)} width={62} />
            <Tooltip content={<CustomTooltip fmt={fmtMm} />} />
            <ReferenceLine y={0} stroke="#475569" />
            <Area type="monotone" dataKey="deflection" stroke="#a78bfa" fill="#a78bfa20" strokeWidth={1.5} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ILD */}
      {ildResults && (
        <div className="grid grid-cols-2 gap-3">
          <ChartCard title={`ILD — Shear at x=${ildX}m`} color="#38bdf8">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <AreaChart data={ildResults.shearILD} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="x" tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} width={35} />
                <Tooltip content={<CustomTooltip fmt={(v) => v.toFixed(4)} />} />
                <ReferenceLine y={0} stroke="#475569" />
                <Area type="monotone" dataKey="value" stroke="#38bdf8" fill="#38bdf820" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title={`ILD — Moment at x=${ildX}m`} color="#fb923c">
            <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
              <AreaChart data={ildResults.momentILD} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="x" tick={{ fontSize: 9, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 9, fill: '#64748b' }} width={35} />
                <Tooltip content={<CustomTooltip fmt={(v) => v.toFixed(4)} />} />
                <ReferenceLine y={0} stroke="#475569" />
                <Area type="monotone" dataKey="value" stroke="#fb923c" fill="#fb923c20" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  );
}
