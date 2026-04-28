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

function Field({ label, value, onChange, type = 'number', step, min, className = '' }) {
  return (
    <label className={`flex flex-col gap-1 text-xs text-slate-400 ${className}`}>
      {label}
      <input
        type={type}
        value={value}
        step={step}
        min={min}
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
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function DeleteBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-slate-500 hover:text-red-400 text-lg leading-none pb-0.5 flex-shrink-0"
      title="Remove"
    >
      ×
    </button>
  );
}

export default function BeamInputPanel({ onAnalyze }) {
  const { beam, setBeam } = useStore();
  const [ildX, setIldX] = useState(beam.ildPoint || beam.span / 2);

  const update = (key, val) => setBeam({ [key]: val });

  // Supports
  const addSupport = () =>
    setBeam({ supports: [...beam.supports, { id: uid(), x: beam.span / 2, type: 'pin' }] });
  const updateSupport = (id, field, val) =>
    setBeam({ supports: beam.supports.map((s) => (s.id === id ? { ...s, [field]: val } : s)) });
  const removeSupport = (id) =>
    setBeam({ supports: beam.supports.filter((s) => s.id !== id) });

  // Point loads
  const addPointLoad = () =>
    setBeam({ pointLoads: [...beam.pointLoads, { id: uid(), x: beam.span / 2, magnitude: -10000 }] });
  const updatePL = (id, field, val) =>
    setBeam({ pointLoads: beam.pointLoads.map((p) => (p.id === id ? { ...p, [field]: val } : p)) });
  const removePL = (id) =>
    setBeam({ pointLoads: beam.pointLoads.filter((p) => p.id !== id) });

  // UDLs
  const addUDL = () =>
    setBeam({ udls: [...beam.udls, { id: uid(), x1: 0, x2: beam.span, magnitude: -5000 }] });
  const updateUDL = (id, field, val) =>
    setBeam({ udls: beam.udls.map((u) => (u.id === id ? { ...u, [field]: val } : u)) });
  const removeUDL = (id) =>
    setBeam({ udls: beam.udls.filter((u) => u.id !== id) });

  // Moments
  const addMoment = () =>
    setBeam({ moments: [...beam.moments, { id: uid(), x: beam.span / 2, magnitude: 5000 }] });
  const updateMom = (id, field, val) =>
    setBeam({ moments: beam.moments.map((m) => (m.id === id ? { ...m, [field]: val } : m)) });
  const removeMom = (id) =>
    setBeam({ moments: beam.moments.filter((m) => m.id !== id) });

  const handleAnalyze = () => {
    setBeam({ ildPoint: ildX });
    onAnalyze(ildX);
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
          <Select
            label="Type"
            value={s.type}
            onChange={(v) => updateSupport(s.id, 'type', v)}
            options={[
              { value: 'pin', label: 'Pin' },
              { value: 'roller', label: 'Roller' },
              { value: 'fixed', label: 'Fixed' },
            ]}
          />
          <div className="flex items-end pb-1"><DeleteBtn onClick={() => removeSupport(s.id)} /></div>
        </Row>
      ))}
      <button onClick={addSupport} className="text-blue-400 text-xs hover:text-blue-300 mb-1">+ Add Support</button>

      <SectionHeader title="Point Loads (N, negative = down)" />
      {beam.pointLoads.map((p) => (
        <Row key={p.id}>
          <Field label="x (m)" value={p.x} onChange={(v) => updatePL(p.id, 'x', v)} step={0.5} className="flex-1" />
          <Field label="F (N)" value={p.magnitude} onChange={(v) => updatePL(p.id, 'magnitude', v)} step={1000} className="flex-1" />
          <div className="flex items-end pb-1"><DeleteBtn onClick={() => removePL(p.id)} /></div>
        </Row>
      ))}
      <button onClick={addPointLoad} className="text-blue-400 text-xs hover:text-blue-300 mb-1">+ Add Point Load</button>

      <SectionHeader title="UDL (N/m)" />
      {beam.udls.map((u) => (
        <Row key={u.id}>
          <Field label="x₁ (m)" value={u.x1} onChange={(v) => updateUDL(u.id, 'x1', v)} step={0.5} className="flex-1" />
          <Field label="x₂ (m)" value={u.x2} onChange={(v) => updateUDL(u.id, 'x2', v)} step={0.5} className="flex-1" />
          <Field label="w (N/m)" value={u.magnitude} onChange={(v) => updateUDL(u.id, 'magnitude', v)} step={500} className="flex-1" />
          <div className="flex items-end pb-1"><DeleteBtn onClick={() => removeUDL(u.id)} /></div>
        </Row>
      ))}
      <button onClick={addUDL} className="text-blue-400 text-xs hover:text-blue-300 mb-1">+ Add UDL</button>

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
        <Field label="ILD at x (m)" value={ildX} onChange={setIldX} step={0.5} min={0} className="flex-1" />
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
