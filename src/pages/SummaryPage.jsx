import { useStore } from '../store/useStore';

function fmtN(v) {
  if (v === null || v === undefined) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${(v / 1e6).toFixed(3)} MN`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(3)} kN`;
  return `${v.toFixed(1)} N`;
}
function fmtNm(v) {
  if (v === null || v === undefined) return '—';
  const abs = Math.abs(v);
  if (abs >= 1e6) return `${(v / 1e6).toFixed(3)} MN·m`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(3)} kN·m`;
  return `${v.toFixed(1)} N·m`;
}
function fmtMm(v) {
  if (v === null || v === undefined) return '—';
  return `${(v * 1000).toFixed(4)} mm`;
}

function StatCard({ label, value, color = 'text-slate-100' }) {
  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-lg font-mono font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function Table({ headers, rows, emptyMsg }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            {headers.map((h) => (
              <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="py-6 text-center text-slate-600 text-sm">
                {emptyMsg}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-800 hover:bg-slate-800 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="py-2 px-3 text-slate-300 font-mono text-xs">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function SummaryPage() {
  const { beam, beamResults, truss, trussResults } = useStore();
  const tResults = truss.results || trussResults;

  const handlePrint = () => window.print();

  const handleExport = () => {
    const data = {
      beam: {
        span: beam.span,
        E: beam.E,
        I: beam.I,
        results: beamResults
          ? {
              reactions: beamResults.reactions,
              maxShear: beamResults.maxShear,
              maxMoment: beamResults.maxMoment,
              maxDeflection: beamResults.maxDeflection,
            }
          : null,
      },
      truss: {
        type: truss.type,
        span: truss.span,
        height: truss.height,
        bays: truss.bays,
        results: tResults
          ? { memberForces: tResults.memberForces.map((m) => ({ nodeA: m.nodeA, nodeB: m.nodeB, force: m.force, L: m.L })) }
          : null,
      },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'structural-analysis-results.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const beamReactionRows = beamResults
    ? beamResults.reactions.map((r) => [
        `x = ${r.x} m`,
        fmtN(r.reaction),
        r.reaction > 0 ? '↑ Upward' : '↓ Downward',
      ])
    : [];

  const trussForceRows = tResults?.memberForces
    ? tResults.memberForces.map((m) => [
        `N${m.nodeA} – N${m.nodeB}`,
        `${m.L.toFixed(3)} m`,
        fmtN(m.force),
        Math.abs(m.force) < 1 ? 'Zero' : m.force > 0 ? 'Tension' : 'Compression',
      ])
    : [];

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-48px)] p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-100">Analysis Summary</h1>
            <p className="text-sm text-slate-500 mt-1">Complete results from beam and truss analysis</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded transition-colors"
            >
              Export JSON
            </button>
            <button
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded transition-colors"
            >
              Print / PDF
            </button>
          </div>
        </div>

        {/* Beam Summary */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">
            Beam Analysis
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Span" value={`${beam.span} m`} />
            <StatCard label="EI" value={`${(beam.E * beam.I).toExponential(2)} N·m²`} />
            <StatCard
              label="Max Shear Force"
              value={beamResults ? fmtN(beamResults.maxShear) : '—'}
              color="text-yellow-400"
            />
            <StatCard
              label="Max Bending Moment"
              value={beamResults ? fmtNm(beamResults.maxMoment) : '—'}
              color="text-green-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard
              label="Max Deflection"
              value={beamResults ? fmtMm(beamResults.maxDeflection) : '—'}
              color="text-purple-400"
            />
            <StatCard
              label="Loads Applied"
              value={`${beam.pointLoads.length} point + ${beam.udls.length} UDL + ${beam.moments.length} moment`}
            />
          </div>

          <div className="bg-slate-900 rounded-lg border border-slate-700">
            <div className="px-4 py-2 border-b border-slate-700 text-xs font-semibold text-slate-400">
              SUPPORT REACTIONS
            </div>
            <Table
              headers={['Location', 'Reaction Force', 'Direction']}
              rows={beamReactionRows}
              emptyMsg="Run beam analysis to see reactions"
            />
          </div>
        </section>

        {/* Truss Summary */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-emerald-400 uppercase tracking-widest mb-3 border-b border-slate-700 pb-2">
            Truss Analysis — {truss.type.charAt(0).toUpperCase() + truss.type.slice(1)} Truss
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Span" value={`${truss.span} m`} />
            <StatCard label="Height" value={`${truss.height} m`} />
            <StatCard label="Bays" value={truss.bays} />
            <StatCard label="Members" value={truss.members.length || '—'} />
          </div>

          {tResults && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <StatCard
                  label="Max Tension"
                  value={fmtN(Math.max(...tResults.memberForces.filter((m) => m.force > 0).map((m) => m.force), 0))}
                  color="text-blue-400"
                />
                <StatCard
                  label="Max Compression"
                  value={fmtN(Math.abs(Math.min(...tResults.memberForces.filter((m) => m.force < 0).map((m) => m.force), 0)))}
                  color="text-red-400"
                />
                <StatCard
                  label="Total Members"
                  value={tResults.memberForces.length}
                />
              </div>
            </>
          )}

          <div className="bg-slate-900 rounded-lg border border-slate-700">
            <div className="px-4 py-2 border-b border-slate-700 text-xs font-semibold text-slate-400">
              MEMBER FORCES
            </div>
            <Table
              headers={['Members', 'Length', 'Axial Force', 'Type']}
              rows={trussForceRows}
              emptyMsg="Generate and analyze a truss to see member forces"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
