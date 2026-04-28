import { useState } from 'react';
import { useStore } from '../../store/useStore';

let nextId = 100;
const uid = () => ++nextId;

function SectionHeader({ title }) {
  return (
    <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-2 mt-4 border-b border-slate-700 pb-1">
      {title}
    </div>
  );
}

function Row({ children }) {
  return <div className="flex gap-2 items-end mb-2">{children}</div>;
}

function Field({ label, value, onChange, type = 'number', step, min, className = '', placeholder }) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-slate-400 ${className}`}>
      {label}
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        placeholder={placeholder}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-blue-400 w-full"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-400">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-800 border border-slate-600 rounded px-2 py-1.5 text-slate-100 text-sm focus:outline-none focus:border-blue-400"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick} className="text-slate-500 hover:text-red-400 text-lg leading-none pb-0.5 flex-shrink-0" title="Remove">
      ×
    </button>
  );
}

export default function BeamInputPanel({ onAnalyze }) {
  const { beam, setBeam } = useStore();
  const [ildX, setIldX] = useState(beam.ildPoint ?? beam.span / 2);

  const update = (key, val) => setBeam({ [key]: val });

  // Supports
  const addSupport = () => setBeam({ supports: [...beam.supports, { id: uid(), x: beam.span / 2, type: 'roller' }] });
  const updateSupport = (id, f, v) => setBeam({ supports: beam.supports.map((s) => s.id === id ? { ...s, [f]: v } : s) });
  const removeSupport = (id) => setBeam({ supports: beam.supports.filter((s) => s.id !== id) });

  // Point loads
  const addPL = () => setBeam({ pointLoads: [...beam.pointLoads, { id: uid(), x: beam.span / 2, magnitude: -10000 }] });
  const updatePL = (id, f, v) => setBeam({ pointLoads: beam.pointLoads.map((p) => p.id === id ? { ...p, [f]: v } : p) });
  const removePL = (id) => setBeam({ pointLoads: beam.pointLoads.filter((p) => p.id !== id) });

  // UDLs
  const addUDL = () => setBeam({ udls: [...beam.udls, { id: uid(), x1: 0, x2: beam.span, magnitude: -5000 }] });
  const updateUDL = (id, f, v) => setBeam({ udls: beam.udls.map((u) => u.id === id ? { ...u, [f]: v } : u) });
  const removeUDL = (id) => setBeam({ udls: beam.udls.filter((u) => u.id !== id) });

  // Triangular loads
  const addTri = () => setBeam({ triangularLoads: [...(beam.triangularLoads || []), { id: uid(), x1: 0, x2: beam.span, w1: 0, w2: -5000 }] });
  const updateTri = (id, f, v) => setBeam({ triangularLoads: (beam.triangularLoads || []).map((t) => t.id === id ? { ...t, [f]: v } : t) });
  const removeTri = (id) => setBeam({ triangularLoads: (beam.triangularLoads || []).filter((t) => t.id !== id) });

  // Custom loads
  const addCustom = () => setBeam({ customLoads: [...(beam.customLoads || []), { id: uid(), x1: 0, x2: beam.span, expr: '-2000*Math.sin(Math.PI*x/10)' }] });
  const updateCustom = (id, f, v) => setBeam({ customLoads: (beam.customLoads || []).map((c) => c.id === id ? { ...c, [f]: v } : c) });
  const removeCustom = (id) => setBeam({ customLoads: (beam.customLoads || []).filter((c) => c.id !== id) });

  // Moments
  const addMoment = () => setBeam({ moments: [...beam.moments, { id: uid(), x: beam.span / 2, magnitude: 5000 }] });
  const updateMom = (id, f, v) => setBeam({ moments: beam.moments.map((m) => m.id === id ? { ...m, [f]: v } : m) });
  const removeMom = (id) => setBeam({ moments: beam.moments.filter((m) => m.id !== id) });

  // Internal hinges
  const addHinge = () => setBeam({ hinges: [...(beam.hinges || []), { id: uid(), x: beam.span / 2 }] });
  const updateHinge = (id, v) => setBeam({ hinges: (beam.hinges || []).map((h) => h.id === id ? { ...h, x: v } : h) });
  const removeHinge = (id) => setBeam({ hinges: (beam.hinges || []).filter((h) => h.id !== id) });

  const handleAnalyze = () => {
    setBeam({ ildPoint: ildX });
    onAnalyze(ildX, beam.ildType || 'shear');
  };

  return (
    <div className="p-4 overflow-y-auto h-full text-sm">
      <SectionHeader title="Beam Properties" />
      <Row>
        <Field label="Span L (m)" value={beam.span} onChange={(v) => update('span', v)} min={0.1} step={0.5} className="flex-1" />
        <Field label="E (Pa)" value={beam.E} onChange={(v) => update('E', v)} step={1e9} className="flex-1" />
        <Field label="I (m⁴)" value={beam.I} onChange={(v) => update('I', v)} step={1e-5} className="flex-1" />
      </Row>

      <SectionHeader title="Supports" />
      {beam.supports.map((s) => (
        <Row key={s.id}>
          <Field label="x (m)" value={s.x} onChange={(v) => updateSupport(s.id, 'x', v)} step={0.5} className="flex-1" />
          <Select label="Type" value={s.type} onChange={(v) => updateSupport(s.id, 'type', v)}
            options={[{ value: 'pin', label: 'Pin' }, { value: 'roller', label: 'Roller' }, { value: 'fixed', label: 'Fixed' }]} />
          <div className="flex items-end pb-1"><DeleteBtn onClick={() => removeSupport(s.id)} /></div>
        </Row>
      ))}
      <button onClick={addSupport} className="text-blue-400 text-xs hover:text-blue-300 mb-1">+ Add Support</button>

      <SectionHeader title="Internal Hinges (moment release)" />
      {(beam.hinges || []).map((h) => (
        <Row key={h.id}>
          <Field label="x (m)" value={h.x} onChange={(v) => updateHinge(h.id, v)} step={0.5} min={0} className="flex-1" />
          <div className="flex items-end pb-1">
            <span className="text-yellow-400 text-xs mr-2">⊙ hinge</span>
            <DeleteBtn onClick={() => removeHinge(h.id)} />
          </div>
        </Row>
      ))}
      <button onClick={addHinge} className="text-blue-400 text-xs hover:text-blue-300 mb-1">+ Add Internal Hinge</button>

      <SectionHeader title="Point Loads (N, negative = down)" />
      {beam.pointLoads.map((p) => (
        <Row key={p.id}>
          <Field label="x (m)" value={p.x} onChange={(v) => updatePL(p.id, 'x', v)} step={0.5} className="flex-1" />
          <Field label="F (N)" value={p.magnitude} onChange={(v) => updatePL(p.id, 'magnitude', v)} step={1000} className="flex-1" />
          <div className="flex items-end pb-1"><DeleteBtn onClick={() => removePL(p.id)} /></div>
        </Row>
      ))}
      <button onClick={addPL} className="text-blue-400 text-xs hover:text-blue-300 mb-1">+ Add Point Load</button>

      <SectionHeader title="UDL — Uniform (N/m)" />
      {beam.udls.map((u) => (
        <Row key={u.id}>
          <Field label="x₁" value={u.x1} onChange={(v) => updateUDL(u.id, 'x1', v)} step={0.5} className="flex-1" />
          <Field label="x₂" value={u.x2} onChange={(v) => updateUDL(u.id, 'x2', v)} step={0.5} className="flex-1" />
          <Field label="w (N/m)" value={u.magnitude} onChange={(v) => updateUDL(u.id, 'magnitude', v)} step={500} className="flex-1" />
          <div className="flex items-end pb-1"><DeleteBtn onClick={() => removeUDL(u.id)} /></div>
        </Row>
      ))}
      <button onClick={addUDL} className="text-blue-400 text-xs hover:text-blue-300 mb-1">+ Add UDL</button>

      <SectionHeader title="Triangular Load (linearly varying N/m)" />
      {(beam.triangularLoads || []).map((t) => (
        <div key={t.id} className="bg-slate-800 rounded p-2 mb-2">
          <Row>
            <Field label="x₁" value={t.x1} onChange={(v) => updateTri(t.id, 'x1', v)} step={0.5} className="flex-1" />
            <Field label="x₂" value={t.x2} onChange={(v) => updateTri(t.id, 'x2', v)} step={0.5} className="flex-1" />
            <div className="flex items-end pb-1"><DeleteBtn onClick={() => removeTri(t.id)} /></div>
          </Row>
          <Row>
            <Field label="w₁ at x₁ (N/m)" value={t.w1} onChange={(v) => updateTri(t.id, 'w1', v)} step={500} className="flex-1" />
            <Field label="w₂ at x₂ (N/m)" value={t.w2} onChange={(v) => updateTri(t.id, 'w2', v)} step={500} className="flex-1" />
          </Row>
          <div className="text-xs text-slate-500 mt-1">Set w₁=0 for pure triangular; same sign for trapezoidal.</div>
        </div>
      ))}
      <button onClick={addTri} className="text-blue-400 text-xs hover:text-blue-300 mb-1">+ Add Triangular / Trapezoidal Load</button>

      <SectionHeader title="Custom Load Function w(x) (N/m)" />
      {(beam.customLoads || []).map((c) => (
        <div key={c.id} className="bg-slate-800 rounded p-2 mb-2">
          <Row>
            <Field label="x₁" value={c.x1} onChange={(v) => updateCustom(c.id, 'x1', v)} step={0.5} className="flex-1" />
            <Field label="x₂" value={c.x2} onChange={(v) => updateCustom(c.id, 'x2', v)} step={0.5} className="flex-1" />
            <div className="flex items-end pb-1"><DeleteBtn onClick={() => removeCustom(c.id)} /></div>
          </Row>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            w(x) expression
            <input
              type="text"
              value={c.expr}
              onChange={(e) => updateCustom(c.id, 'expr', e.target.value)}
              placeholder="-2000*Math.sin(Math.PI*x/10)"
              className="bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-green-300 font-mono text-xs focus:outline-none focus:border-blue-400"
            />
          </label>
          <div className="text-xs text-slate-500 mt-1">Use JS: <code className="text-green-400">Math.sin, Math.cos, Math.pow(x,2)</code></div>
        </div>
      ))}
      <button onClick={addCustom} className="text-blue-400 text-xs hover:text-blue-300 mb-1">+ Add Custom Load</button>

      <SectionHeader title="Applied Moments (N·m)" />
      {beam.moments.map((m) => (
        <Row key={m.id}>
          <Field label="x (m)" value={m.x} onChange={(v) => updateMom(m.id, 'x', v)} step={0.5} className="flex-1" />
          <Field label="M (N·m)" value={m.magnitude} onChange={(v) => updateMom(m.id, 'magnitude', v)} step={500} className="flex-1" />
          <div className="flex items-end pb-1"><DeleteBtn onClick={() => removeMom(m.id)} /></div>
        </Row>
      ))}
      <button onClick={addMoment} className="text-blue-400 text-xs hover:text-blue-300 mb-1">+ Add Moment</button>

      <SectionHeader title="Influence Line Diagram" />
      <Row>
        <Field label="Section x (m)" value={ildX} onChange={setIldX} step={0.5} min={0} className="flex-1" />
        <Select
          label="ILD for"
          value={beam.ildType || 'shear'}
          onChange={(v) => update('ildType', v)}
          options={[{ value: 'shear', label: 'Shear Force' }, { value: 'moment', label: 'Bending Moment' }]}
        />
      </Row>

      <button
        onClick={handleAnalyze}
        className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded transition-colors"
      >
        Analyze Beam
      </button>
    </div>
  );
}
