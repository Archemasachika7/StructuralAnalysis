import { useStore } from '../../store/useStore';
import { generateTruss } from '../../utils/trussSolver';

let nid = 200;
const uid = () => ++nid;

function SectionHeader({ title, icon, accent = 'emerald' }) {
  const colorMap = {
    emerald:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    sky:    'text-sky-400 bg-sky-500/10 border-sky-500/20',
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    amber:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
    rose:   'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };
  const c = colorMap[accent] || colorMap.emerald;
  return (
    <div className="flex items-center gap-2 mt-5 mb-3">
      <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 border ${c}`}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${c.split(' ')[0]}`}>{title}</span>
      <div className="flex-1 h-px bg-white/[0.05]" />
    </div>
  );
}

function Field({ label, value, onChange, step, min, max, className = '', accent = 'emerald' }) {
  const ring = accent === 'blue' ? 'focus:border-blue-400 focus:ring-blue-400/20'
             : accent === 'sky'  ? 'focus:border-sky-400 focus:ring-sky-400/20'
             : 'focus:border-emerald-400 focus:ring-emerald-400/20';
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] text-slate-500 font-medium tracking-wide">{label}</span>
      <input type="number" value={value} step={step} min={min} max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className={`bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:ring-1 w-full transition-colors ${ring}`}
      />
    </label>
  );
}

function NodeSelect({ label, value, onChange, nodes, accent = 'emerald' }) {
  const ring = accent === 'sky' ? 'focus:border-sky-400' : 'focus:border-emerald-400';
  return (
    <label className="flex flex-col gap-1 flex-1">
      <span className="text-[10px] text-slate-500 font-medium tracking-wide">{label}</span>
      <select value={value ?? ''} onChange={(e) => onChange(parseInt(e.target.value))}
        className={`bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none ${ring} transition-colors`}>
        {nodes.map((n) => (
          <option key={n.id} value={n.id}>N{n.id} ({n.x.toFixed(1)}, {n.y.toFixed(1)})</option>
        ))}
      </select>
    </label>
  );
}

function ItemCard({ children }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 mb-2 space-y-2">
      {children}
    </div>
  );
}

function AddBtn({ onClick, label, accent = 'emerald' }) {
  const c = accent === 'rose'    ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
          : accent === 'sky'     ? 'text-sky-400 hover:text-sky-300 hover:bg-sky-500/10'
          : accent === 'blue'    ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
          : 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10';
  return (
    <button onClick={onClick}
      className={`text-[11px] font-medium px-2.5 py-1 rounded-md border border-transparent hover:border-current/20 transition-all mb-1 ${c}`}>
      + {label}
    </button>
  );
}

export default function TrussInputPanel({ onAnalyze }) {
  const { truss, setTruss } = useStore();
  const update = (key, val) => setTruss({ [key]: val });

  const handleGenerate = () => {
    const { nodes, members } = generateTruss(truss.type, truss.span, truss.height, truss.bays);
    const bottomNodes = nodes.filter((n) => n.y === 0).sort((a, b) => a.x - b.x);
    const topNodes = nodes.filter((n) => n.y === truss.height);
    const midTop = topNodes[Math.floor(topNodes.length / 2)];
    const defaultLoads = midTop ? [{ id: uid(), nodeId: midTop.id, fx: 0, fy: -50000 }] : [];
    setTruss({
      nodes, members, loads: defaultLoads, results: null,
      pinNodeId: bottomNodes[0]?.id ?? null,
      rollerNodeId: bottomNodes[bottomNodes.length - 1]?.id ?? null,
      ildMemberId: members[0]?.id ?? null,
    });
  };

  const addLoad = () => {
    if (!truss.nodes.length) return;
    setTruss({ loads: [...truss.loads, { id: uid(), nodeId: truss.nodes[0].id, fx: 0, fy: -10000 }] });
  };
  const updateLoad = (id, field, val) =>
    setTruss({ loads: truss.loads.map((l) => l.id === id ? { ...l, [field]: val } : l) });
  const removeLoad = (id) =>
    setTruss({ loads: truss.loads.filter((l) => l.id !== id) });

  const memberOptions = truss.members.map((m) => ({
    id: m.id,
    label: `M${m.id}: N${m.nodeA}–N${m.nodeB}`,
  }));

  const templateIcons = {
    pratt:  'M3 17l4-8 2 4 3-6 3 6 2-4 4 8',
    howe:   'M3 17l4-8 2 4 3-6 3 6 2-4 4 8',
    warren: 'M3 17l4.5-10 4.5 10 4.5-10 4.5 10',
  };

  return (
    <div className="p-3.5 overflow-y-auto h-full">

      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3L2 21h20L12 3zm0 3.5l5.5 9H6.5L12 6.5z"/>
          </svg>
        </div>
        <div>
          <div className="text-xs font-bold text-white">Truss Generator</div>
          <div className="text-[10px] text-slate-500">Matrix stiffness method · ILD</div>
        </div>
      </div>

      {/* Template */}
      <SectionHeader title="Template" icon={<path d="M12 3L2 21h20L12 3z"/>} accent="emerald" />
      <div className="grid grid-cols-3 gap-2 mb-3">
        {['pratt', 'howe', 'warren'].map((t) => (
          <button key={t}
            onClick={() => update('type', t)}
            className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border transition-all text-xs font-medium capitalize ${
              truss.type === t
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-lg shadow-emerald-500/20'
                : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
            }`}>
            <svg className="w-10 h-5" viewBox="0 0 40 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              {t === 'pratt'  && <><path d="M2 18L20 4 38 18" /><path d="M10 18V10M20 18V4M30 18V10" /></>}
              {t === 'howe'   && <><path d="M2 18L20 4 38 18" /><path d="M11 11l-2 7M20 4v14M29 11l2 7" /></>}
              {t === 'warren' && <><path d="M2 18L11 4 20 18 29 4 38 18" /><path d="M2 18h36" /></>}
            </svg>
            {t}
          </button>
        ))}
      </div>

      {/* Geometry */}
      <SectionHeader title="Geometry" icon={<path d="M21 3H3v18h18V3zM3 9h18M3 15h18M9 3v18M15 3v18"/>} accent="emerald" />
      <ItemCard>
        <div className="flex gap-2">
          <Field label="Span (m)" value={truss.span} onChange={(v) => update('span', v)} step={1} min={2} className="flex-1" />
          <Field label="Height (m)" value={truss.height} onChange={(v) => update('height', v)} step={0.5} min={0.5} className="flex-1" />
        </div>
        <Field label="Bays" value={truss.bays} onChange={(v) => update('bays', Math.max(2, Math.round(v)))} step={1} min={2} max={14} className="w-full" />
      </ItemCard>

      {/* Material */}
      <SectionHeader title="Material Properties" icon={<path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>} accent="sky" />
      <ItemCard>
        <div className="flex gap-2">
          <Field label="Elastic Modulus E (Pa)" value={truss.E} onChange={(v) => update('E', v)} step={1e9} min={1e6} className="flex-1" accent="sky" />
          <Field label="Cross-section A (m²)" value={truss.A} onChange={(v) => update('A', v)} step={0.001} min={0.0001} className="flex-1" accent="sky" />
        </div>
      </ItemCard>

      {/* Generate */}
      <button onClick={handleGenerate}
        className="w-full mt-2 relative overflow-hidden bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 active:scale-[0.98] text-sm tracking-wide">
        <span className="flex items-center justify-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 3L2 21h20L12 3z"/>
          </svg>
          Generate Truss
        </span>
      </button>

      {truss.nodes.length > 0 && (
        <>
          {/* Supports */}
          <SectionHeader title="Support Nodes" icon={<path d="M3 21h18M5 21V9l7-6 7 6v12M10 21V15h4v6"/>} accent="blue" />
          <ItemCard>
            <div className="flex gap-2">
              <NodeSelect label="Pin support (fix x+y)" value={truss.pinNodeId} onChange={(v) => update('pinNodeId', v)} nodes={truss.nodes} />
              <NodeSelect label="Roller support (fix y)" value={truss.rollerNodeId} onChange={(v) => update('rollerNodeId', v)} nodes={truss.nodes} />
            </div>
            <p className="text-[10px] text-slate-600">Pin constrains both DOFs · roller constrains vertical only</p>
          </ItemCard>

          {/* Nodal Loads */}
          <SectionHeader title={`Nodal Loads`} icon={<path d="M12 4v16m-4-4l4 4 4-4"/>} accent="rose" />
          {truss.loads.map((l) => (
            <ItemCard key={l.id}>
              <div className="flex gap-2 items-end">
                <label className="flex flex-col gap-1 flex-1">
                  <span className="text-[10px] text-slate-500 font-medium tracking-wide">Node</span>
                  <select value={l.nodeId} onChange={(e) => updateLoad(l.id, 'nodeId', parseInt(e.target.value))}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-rose-400 transition-colors">
                    {truss.nodes.map((n) => (
                      <option key={n.id} value={n.id}>N{n.id} ({n.x.toFixed(1)},{n.y.toFixed(1)})</option>
                    ))}
                  </select>
                </label>
                <Field label="Fx (N)" value={l.fx} onChange={(v) => updateLoad(l.id, 'fx', v)} step={1000} className="flex-1" accent="sky" />
                <Field label="Fy (N) ↓neg" value={l.fy} onChange={(v) => updateLoad(l.id, 'fy', v)} step={1000} className="flex-1" accent="sky" />
                <button onClick={() => removeLoad(l.id)}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-white/[0.03] border border-white/[0.06] text-slate-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all text-base leading-none self-end">
                  ×
                </button>
              </div>
            </ItemCard>
          ))}
          <AddBtn onClick={addLoad} label="Add Nodal Load" accent="rose" />

          {/* ILD */}
          <SectionHeader title="Member ILD" icon={<path d="M3 3v18h18M7 16l4-4 2 2 4-6"/>} accent="sky" />
          <ItemCard>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">Member for influence line</span>
              <select
                value={truss.ildMemberId ?? ''}
                onChange={(e) => update('ildMemberId', parseInt(e.target.value))}
                className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-sky-400 transition-colors">
                {memberOptions.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </label>
            <p className="text-[10px] text-slate-600">Unit load traverses bottom chord nodes → member force ILD</p>
          </ItemCard>

          {/* Stats bar */}
          <div className="flex items-center gap-3 mt-2 mb-4 px-2">
            <span className="text-[10px] text-slate-600">{truss.nodes.length} nodes</span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="text-[10px] text-slate-600">{truss.members.length} members</span>
          </div>

          {/* Analyze CTA */}
          <button onClick={onAnalyze}
            className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] text-sm tracking-wide">
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
              Analyze Truss
            </span>
          </button>
        </>
      )}
    </div>
  );
}
