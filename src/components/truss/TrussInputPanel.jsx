import { useStore } from '../../store/useStore';
import { generateTruss } from '../../utils/trussSolver';

let nid = 200;
const uid = () => ++nid;

function Sec({ title, color = 'text-emerald-400' }) {
  return (
    <div className={`text-xs font-semibold ${color} uppercase tracking-widest mb-2 mt-4 border-b border-slate-700 pb-1`}>
      {title}
    </div>
  );
}

function Row({ children }) {
  return <div className="flex gap-2 items-end mb-2">{children}</div>;
}

function Field({ label, value, onChange, step, min, max, className = '' }) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-slate-400 ${className}`}>
      {label}
      <input type="number" value={value} step={step} min={min} max={max}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-400 w-full"
      />
    </label>
  );
}

function NodeSelect({ label, value, onChange, nodes }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-400 flex-1">
      {label}
      <select value={value ?? ''} onChange={(e) => onChange(parseInt(e.target.value))}
        className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-400">
        {nodes.map((n) => (
          <option key={n.id} value={n.id}>N{n.id} ({n.x.toFixed(1)}, {n.y.toFixed(1)})</option>
        ))}
      </select>
    </label>
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
    // Default pin = leftmost bottom, roller = rightmost bottom
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

  return (
    <div className="p-4 overflow-y-auto h-full text-sm">
      <Sec title="Truss Type" />
      <label className="flex flex-col gap-1 text-xs text-slate-400 mb-3">
        Template
        <select value={truss.type} onChange={(e) => update('type', e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-400">
          <option value="pratt">Pratt Truss</option>
          <option value="howe">Howe Truss</option>
          <option value="warren">Warren Truss</option>
        </select>
      </label>

      <Sec title="Geometry" />
      <Row>
        <Field label="Span (m)" value={truss.span} onChange={(v) => update('span', v)} step={1} min={2} className="flex-1" />
        <Field label="Height (m)" value={truss.height} onChange={(v) => update('height', v)} step={0.5} min={0.5} className="flex-1" />
      </Row>
      <Row>
        <Field label="Bays" value={truss.bays} onChange={(v) => update('bays', Math.max(2, Math.round(v)))} step={1} min={2} max={14} className="flex-1" />
      </Row>

      <Sec title="Material" />
      <Row>
        <Field label="E (Pa)" value={truss.E} onChange={(v) => update('E', v)} step={1e9} min={1e6} className="flex-1" />
        <Field label="A (m²)" value={truss.A} onChange={(v) => update('A', v)} step={0.001} min={0.0001} className="flex-1" />
      </Row>

      <button onClick={handleGenerate}
        className="w-full mt-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2 rounded transition-colors text-sm">
        Generate Truss
      </button>

      {truss.nodes.length > 0 && (
        <>
          {/* Support node selection */}
          <Sec title="Support Nodes" />
          <Row>
            <NodeSelect label="Pin (fix x+y)" value={truss.pinNodeId} onChange={(v) => update('pinNodeId', v)} nodes={truss.nodes} />
            <NodeSelect label="Roller (fix y)" value={truss.rollerNodeId} onChange={(v) => update('rollerNodeId', v)} nodes={truss.nodes} />
          </Row>

          {/* Nodal loads */}
          <Sec title={`Nodal Loads (${truss.nodes.length} nodes)`} />
          {truss.loads.map((l) => (
            <div key={l.id} className="mb-2 bg-slate-800 rounded p-2">
              <Row>
                <label className="flex flex-col gap-1 text-xs text-slate-400 flex-1">
                  Node
                  <select value={l.nodeId} onChange={(e) => updateLoad(l.id, 'nodeId', parseInt(e.target.value))}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-slate-100 text-xs focus:outline-none">
                    {truss.nodes.map((n) => (
                      <option key={n.id} value={n.id}>N{n.id} ({n.x.toFixed(1)},{n.y.toFixed(1)})</option>
                    ))}
                  </select>
                </label>
                <Field label="Fx (N)" value={l.fx} onChange={(v) => updateLoad(l.id, 'fx', v)} step={1000} className="flex-1" />
                <Field label="Fy (N)" value={l.fy} onChange={(v) => updateLoad(l.id, 'fy', v)} step={1000} className="flex-1" />
                <button onClick={() => removeLoad(l.id)} className="text-slate-500 hover:text-red-400 text-xl self-end pb-0.5">×</button>
              </Row>
            </div>
          ))}
          <button onClick={addLoad} className="text-emerald-400 text-xs hover:text-emerald-300 mb-2">+ Add Load</button>

          {/* ILD member selection */}
          <Sec title="Member ILD" color="text-sky-400" />
          <label className="flex flex-col gap-1 text-xs text-slate-400 mb-2">
            Select member for ILD
            <select
              value={truss.ildMemberId ?? ''}
              onChange={(e) => update('ildMemberId', parseInt(e.target.value))}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-sky-400"
            >
              {memberOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </label>
          <p className="text-xs text-slate-600 mb-3">Unit load traverses bottom chord nodes → member force ILD</p>

          <button onClick={onAnalyze}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded transition-colors">
            Analyze Truss
          </button>

          <div className="mt-3 text-xs text-slate-600">{truss.nodes.length} nodes · {truss.members.length} members</div>
        </>
      )}
    </div>
  );
}
