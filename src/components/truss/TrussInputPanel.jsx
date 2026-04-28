import { useStore } from '../../store/useStore';
import { generateTruss } from '../../utils/trussSolver';

let nid = 200;
const uid = () => ++nid;

function SectionHeader({ title }) {
  return (
    <div className="text-xs font-semibold text-emerald-400 uppercase tracking-widest mb-2 mt-4 border-b border-slate-700 pb-1">
      {title}
    </div>
  );
}

function Row({ children }) {
  return <div className="flex gap-2 items-end mb-2">{children}</div>;
}

function Field({ label, value, onChange, type = 'number', step, min, max, className = '' }) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-slate-400 ${className}`}>
      {label}
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-400 w-full"
      />
    </label>
  );
}

export default function TrussInputPanel({ onGenerate, onAnalyze }) {
  const { truss, setTruss } = useStore();

  const update = (key, val) => setTruss({ [key]: val });

  const handleGenerate = () => {
    const { nodes, members } = generateTruss(truss.type, truss.span, truss.height, truss.bays);
    // Default load: -50kN at midspan top nodes
    const midIdx = Math.floor(nodes.length / 2);
    const topNodes = nodes.filter((n) => n.y === truss.height);
    const midTop = topNodes[Math.floor(topNodes.length / 2)];
    const defaultLoads = midTop
      ? [{ id: uid(), nodeId: midTop.id, fx: 0, fy: -50000 }]
      : [];
    setTruss({ nodes, members, loads: defaultLoads, results: null });
    onGenerate && onGenerate();
  };

  const addLoad = () => {
    if (!truss.nodes.length) return;
    setTruss({
      loads: [...truss.loads, { id: uid(), nodeId: truss.nodes[0].id, fx: 0, fy: -10000 }],
    });
  };

  const updateLoad = (id, field, val) =>
    setTruss({ loads: truss.loads.map((l) => (l.id === id ? { ...l, [field]: val } : l)) });
  const removeLoad = (id) =>
    setTruss({ loads: truss.loads.filter((l) => l.id !== id) });

  return (
    <div className="p-4 overflow-y-auto h-full text-sm">
      <SectionHeader title="Truss Type" />
      <label className="flex flex-col gap-1 text-xs text-slate-400 mb-3">
        Template
        <select
          value={truss.type}
          onChange={(e) => update('type', e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-400"
        >
          <option value="pratt">Pratt Truss</option>
          <option value="howe">Howe Truss</option>
          <option value="warren">Warren Truss</option>
        </select>
      </label>

      <SectionHeader title="Geometry" />
      <Row>
        <Field label="Span (m)" value={truss.span} onChange={(v) => update('span', v)} step={1} min={2} className="flex-1" />
        <Field label="Height (m)" value={truss.height} onChange={(v) => update('height', v)} step={0.5} min={0.5} className="flex-1" />
      </Row>
      <Row>
        <Field label="Bays" value={truss.bays} onChange={(v) => update('bays', Math.max(2, Math.round(v)))} step={1} min={2} max={12} className="flex-1" />
      </Row>

      <SectionHeader title="Material" />
      <Row>
        <Field label="E (Pa)" value={200e9} onChange={() => {}} className="flex-1" />
        <Field label="A (m²)" value={0.01} onChange={() => {}} className="flex-1" />
      </Row>

      <button
        onClick={handleGenerate}
        className="w-full mt-3 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold py-2 rounded transition-colors text-sm"
      >
        Generate Truss
      </button>

      {truss.nodes.length > 0 && (
        <>
          <SectionHeader title={`Nodal Loads (${truss.nodes.length} nodes)`} />
          {truss.loads.map((l) => (
            <div key={l.id} className="mb-2 bg-slate-800 rounded p-2">
              <Row>
                <label className="flex flex-col gap-1 text-xs text-slate-400 flex-1">
                  Node
                  <select
                    value={l.nodeId}
                    onChange={(e) => updateLoad(l.id, 'nodeId', parseInt(e.target.value))}
                    className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-slate-100 text-xs focus:outline-none"
                  >
                    {truss.nodes.map((n) => (
                      <option key={n.id} value={n.id}>
                        N{n.id} ({n.x.toFixed(1)},{n.y.toFixed(1)})
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Fx (N)" value={l.fx} onChange={(v) => updateLoad(l.id, 'fx', v)} step={1000} className="flex-1" />
                <Field label="Fy (N)" value={l.fy} onChange={(v) => updateLoad(l.id, 'fy', v)} step={1000} className="flex-1" />
                <button
                  onClick={() => removeLoad(l.id)}
                  className="text-slate-500 hover:text-red-400 text-xl self-end pb-0.5"
                >×</button>
              </Row>
            </div>
          ))}
          <button onClick={addLoad} className="text-emerald-400 text-xs hover:text-emerald-300 mb-2">
            + Add Load
          </button>

          <button
            onClick={onAnalyze}
            className="w-full mt-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded transition-colors"
          >
            Analyze Truss
          </button>

          <div className="mt-4 text-xs text-slate-500">
            <div>{truss.nodes.length} nodes · {truss.members.length} members</div>
          </div>
        </>
      )}
    </div>
  );
}
