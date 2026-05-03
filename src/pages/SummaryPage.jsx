import { useStore } from '../store/useStore';

function fmt(v, type) {
  if (v === null || v === undefined) return '—';
  const abs = Math.abs(v);
  if (type === 'force') {
    if (abs >= 1e6) return `${(v/1e6).toFixed(3)} MN`;
    if (abs >= 1e3) return `${(v/1e3).toFixed(3)} kN`;
    return `${v.toFixed(1)} N`;
  }
  if (type === 'moment') {
    if (abs >= 1e6) return `${(v/1e6).toFixed(3)} MN·m`;
    if (abs >= 1e3) return `${(v/1e3).toFixed(3)} kN·m`;
    return `${v.toFixed(1)} N·m`;
  }
  if (type === 'defl') return `${(v*1000).toFixed(4)} mm`;
  return String(v);
}

const STAT_THEMES = {
  blue:    { bg: 'from-blue-600/20 to-blue-900/10',    border: 'border-blue-500/30',  text: 'text-blue-300',    icon: 'text-blue-400',   glow: 'shadow-blue-500/10' },
  yellow:  { bg: 'from-yellow-600/20 to-yellow-900/10', border: 'border-yellow-500/30',text: 'text-yellow-300',  icon: 'text-yellow-400', glow: 'shadow-yellow-500/10' },
  green:   { bg: 'from-green-600/20 to-green-900/10',  border: 'border-green-500/30', text: 'text-green-300',   icon: 'text-green-400',  glow: 'shadow-green-500/10' },
  purple:  { bg: 'from-purple-600/20 to-purple-900/10',border: 'border-purple-500/30',text: 'text-purple-300',  icon: 'text-purple-400', glow: 'shadow-purple-500/10' },
  slate:   { bg: 'from-slate-700/30 to-slate-900/20',  border: 'border-slate-600/30', text: 'text-slate-300',   icon: 'text-slate-400',  glow: 'shadow-slate-500/10' },
  red:     { bg: 'from-red-600/20 to-red-900/10',      border: 'border-red-500/30',   text: 'text-red-300',     icon: 'text-red-400',    glow: 'shadow-red-500/10' },
  emerald: { bg: 'from-emerald-600/20 to-emerald-900/10',border:'border-emerald-500/30',text:'text-emerald-300',icon:'text-emerald-400', glow:'shadow-emerald-500/10' },
};

function StatCard({ label, value, theme = 'slate', icon, delay = '0' }) {
  const t = STAT_THEMES[theme];
  return (
    <div className={`animate-count-up delay-${delay} relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${t.bg} border ${t.border} shadow-lg ${t.glow}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-slate-500 font-medium uppercase tracking-widest leading-tight">{label}</span>
        <span className={`${t.icon} opacity-70`}>{icon}</span>
      </div>
      <div className={`text-xl font-bold font-mono ${t.text} leading-none`}>{value}</div>
    </div>
  );
}

function SectionTitle({ children, accent = 'blue', icon }) {
  const colors = {
    blue:    'from-blue-400 to-blue-600',
    emerald: 'from-emerald-400 to-emerald-600',
    purple:  'from-purple-400 to-purple-600',
  };
  return (
    <div className="flex items-center gap-3 mb-4">
      {icon && (
        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${colors[accent]} flex items-center justify-center flex-shrink-0 opacity-80`}>
          {icon}
        </div>
      )}
      <h2 className={`text-sm font-bold bg-gradient-to-r ${colors[accent]} bg-clip-text text-transparent uppercase tracking-widest`}>
        {children}
      </h2>
      <div className={`flex-1 h-px bg-gradient-to-r ${colors[accent]} opacity-20`} />
    </div>
  );
}

function DataTable({ headers, rows, emptyMsg }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.07] bg-white/[0.02]">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/[0.07]">
            {headers.map((h) => (
              <th key={h} className="text-left py-2.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="py-10 text-center text-slate-700 text-sm">
                {emptyMsg}
              </td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors">
              {row.map((cell, j) => (
                <td key={j} className="py-2.5 px-4 text-xs font-mono text-slate-300">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SummaryPage() {
  const { beam, beamResults, truss, trussResults } = useStore();
  const tr = truss.results || trussResults;

  const handleExport = () => {
    const data = {
      beam: { span: beam.span, E: beam.E, I: beam.I,
        results: beamResults ? { reactions: beamResults.reactions, maxShear: beamResults.maxShear,
          maxMoment: beamResults.maxMoment, maxDeflection: beamResults.maxDeflection } : null },
      truss: { type: truss.type, span: truss.span, height: truss.height, bays: truss.bays,
        results: tr ? { memberForces: tr.memberForces.map((m) => ({ nodeA: m.nodeA, nodeB: m.nodeB, force: m.force, L: m.L })) } : null },
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'structural-analysis.json' });
    a.click(); URL.revokeObjectURL(a.href);
  };

  const beamReactionRows = beamResults
    ? beamResults.reactions.map((r) => [
        `x = ${r.x} m`,
        fmt(r.reaction, 'force'),
        r.reaction > 0 ? '↑ Upward' : '↓ Downward',
      ])
    : [];

  const trussForceRows = tr?.memberForces
    ? tr.memberForces.map((m) => [
        `N${m.nodeA}–N${m.nodeB}`,
        `${m.L.toFixed(3)} m`,
        fmt(m.force, 'force'),
        <span className={`font-semibold ${Math.abs(m.force)<1?'text-slate-500':m.force>0?'text-blue-400':'text-red-400'}`}>
          {Math.abs(m.force)<1?'Zero':m.force>0?'Tension':'Compression'}
        </span>,
      ])
    : [];

  const maxTension = tr ? Math.max(...tr.memberForces.filter(m=>m.force>0).map(m=>m.force), 0) : 0;
  const maxComp   = tr ? Math.abs(Math.min(...tr.memberForces.filter(m=>m.force<0).map(m=>m.force), 0)) : 0;

  return (
    <div className="min-h-[calc(100vh-56px)] dot-grid"
      style={{ background: 'linear-gradient(135deg,#020817 0%,#050d1a 100%)' }}>
      <div className="max-w-5xl mx-auto p-6">

        {/* ── page header ── */}
        <div className="animate-fade-in-up flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold shimmer-text mb-1">Analysis Summary</h1>
            <p className="text-slate-600 text-sm">Consolidated results from beam and truss solvers</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-300 text-sm hover:bg-white/[0.08] transition-all duration-200 hover:border-white/[0.15]">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
              Export JSON
            </button>
            <button onClick={() => window.print()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-500 hover:to-blue-600 transition-all duration-200 shadow-lg shadow-blue-500/25">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v6a2 2 0 002 2h1v1a1 1 0 001 1h8a1 1 0 001-1v-1h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a1 1 0 00-1-1H6a1 1 0 00-1 1zm2 0h6v3H7V4zm-1 9a1 1 0 100 2 1 1 0 000-2zm9 0a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"/>
              </svg>
              Print / PDF
            </button>
          </div>
        </div>

        {/* ── beam section ── */}
        <section className="mb-10 animate-fade-in-up delay-50">
          <SectionTitle accent="blue" icon={
            <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
            </svg>
          }>
            Beam Analysis
          </SectionTitle>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard label="Span" value={`${beam.span} m`} theme="slate" delay="50"
              icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 5h14M3 15h14M3 10h14"/></svg>}/>
            <StatCard label="Flexural Rigidity EI" value={`${(beam.E*beam.I).toExponential(2)} N·m²`} theme="slate" delay="100"
              icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9zM4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5z"/></svg>}/>
            <StatCard label="Max Shear" value={beamResults ? fmt(beamResults.maxShear,'force') : '—'} theme="yellow" delay="150"
              icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M3 3l14 14M17 3L3 17"/></svg>}/>
            <StatCard label="Max Moment" value={beamResults ? fmt(beamResults.maxMoment,'moment') : '—'} theme="green" delay="200"
              icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd"/></svg>}/>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            <StatCard label="Max Deflection" value={beamResults ? fmt(beamResults.maxDeflection,'defl') : '—'} theme="purple" delay="250"
              icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/></svg>}/>
            <StatCard label="Supports" value={beam.supports.length} theme="slate" delay="300"
              icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V9h1a1 1 0 100-2H8z"/></svg>}/>
            <StatCard
              label="Load types"
              value={`${beam.pointLoads.length}PL · ${beam.udls.length}UDL · ${(beam.triangularLoads||[]).length}TL`}
              theme="slate" delay="350"
              icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"/></svg>}/>
          </div>

          <DataTable
            headers={['Location', 'Reaction Force', 'Direction']}
            rows={beamReactionRows}
            emptyMsg="Run beam analysis to see support reactions"
          />
        </section>

        {/* ── truss section ── */}
        <section className="mb-8 animate-fade-in-up delay-200">
          <SectionTitle accent="emerald" icon={
            <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2L2 18h16L10 2z"/>
            </svg>
          }>
            Truss Analysis — {truss.type.charAt(0).toUpperCase()+truss.type.slice(1)} Truss
          </SectionTitle>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatCard label="Span" value={`${truss.span} m`} theme="slate" delay="200"/>
            <StatCard label="Height" value={`${truss.height} m`} theme="slate" delay="250"/>
            <StatCard label="Bays" value={truss.bays} theme="slate" delay="300"/>
            <StatCard label="Members" value={truss.members.length || '—'} theme="emerald" delay="350"/>
          </div>

          {tr && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <StatCard label="Max Tension" value={fmt(maxTension,'force')} theme="blue" delay="400"
                icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 10a1 1 0 011-1h4V5a1 1 0 112 0v4h4a1 1 0 110 2h-4v4a1 1 0 11-2 0v-4H6a1 1 0 01-1-1z"/></svg>}/>
              <StatCard label="Max Compression" value={fmt(maxComp,'force')} theme="red" delay="450"
                icon={<svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor"><path d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"/></svg>}/>
              <StatCard label="Total Members" value={tr.memberForces.length} theme="slate" delay="500"/>
            </div>
          )}

          <DataTable
            headers={['Members', 'Length', 'Axial Force', 'Type']}
            rows={trussForceRows}
            emptyMsg="Generate and analyze a truss to see member forces"
          />
        </section>
      </div>
    </div>
  );
}
