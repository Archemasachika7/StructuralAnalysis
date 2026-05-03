import { useState } from 'react';
import { useStore } from '../../store/useStore';

let nextId = 100;
const uid = () => ++nextId;

const sectionIcons = {
  props:    <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"/>,
  supports: <path d="M3 21h18M5 21V9l7-6 7 6v12M10 21V15h4v6"/>,
  loads:    <path d="M12 4v1m0 14v1M4 12h1m14 0h1m-2.636-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707M17.657 17.657l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z"/>,
  udl:      <path d="M3 6h18M3 10h18M7 14h10M10 18h4"/>,
  moment:   <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM12 5v.01M12 19v.01M5 12H4M20 12h-1M7.05 7.05l-.707-.707M17.657 17.657l-.707-.707M7.05 16.95l-.707.707M17.657 6.343l-.707.707"/>,
  hinge:    <circle cx="12" cy="12" r="4"/>,
  ild:      <path d="M3 3v18h18M7 16l4-4 2 2 4-6"/>,
};

function SectionHeader({ title, icon, accent = 'blue' }) {
  const colorMap = {
    blue:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
    violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
    amber:  'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald:'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose:   'text-rose-400 bg-rose-500/10 border-rose-500/20',
    sky:    'text-sky-400 bg-sky-500/10 border-sky-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  const c = colorMap[accent] || colorMap.blue;
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

function Field({ label, value, onChange, type = 'number', step, min, className = '', placeholder, accent = 'blue' }) {
  const ring = accent === 'emerald' ? 'focus:border-emerald-400 focus:ring-emerald-400/20'
             : accent === 'amber'   ? 'focus:border-amber-400 focus:ring-amber-400/20'
             : 'focus:border-blue-400 focus:ring-blue-400/20';
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="text-[10px] text-slate-500 font-medium tracking-wide">{label}</span>
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        placeholder={placeholder}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className={`bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none focus:ring-1 w-full transition-colors ${ring}`}
      />
    </label>
  );
}

function Select({ label, value, onChange, options, accent = 'blue' }) {
  const ring = accent === 'emerald' ? 'focus:border-emerald-400' : accent === 'sky' ? 'focus:border-sky-400' : 'focus:border-blue-400';
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] text-slate-500 font-medium tracking-wide">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-slate-100 text-xs focus:outline-none ${ring} transition-colors`}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Row({ children }) {
  return <div className="flex gap-2 items-end mb-2">{children}</div>;
}

function DeleteBtn({ onClick }) {
  return (
    <button onClick={onClick}
      className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-white/[0.03] border border-white/[0.06] text-slate-600 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all text-base leading-none"
      title="Remove">
      ×
    </button>
  );
}

function AddBtn({ onClick, label, accent = 'blue' }) {
  const c = accent === 'emerald' ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10'
          : accent === 'amber'   ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
          : accent === 'violet'  ? 'text-violet-400 hover:text-violet-300 hover:bg-violet-500/10'
          : accent === 'rose'    ? 'text-rose-400 hover:text-rose-300 hover:bg-rose-500/10'
          : accent === 'sky'     ? 'text-sky-400 hover:text-sky-300 hover:bg-sky-500/10'
          : 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10';
  return (
    <button onClick={onClick}
      className={`text-[11px] font-medium px-2.5 py-1 rounded-md border border-transparent hover:border-current/20 transition-all mb-1 ${c}`}>
      + {label}
    </button>
  );
}

function ItemCard({ children }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-2.5 mb-2 space-y-2">
      {children}
    </div>
  );
}

export default function BeamInputPanel({ onAnalyze }) {
  const { beam, setBeam } = useStore();
  const [ildX, setIldX] = useState(beam.ildPoint ?? beam.span / 2);

  const update = (key, val) => setBeam({ [key]: val });

  const addSupport    = () => setBeam({ supports: [...beam.supports, { id: uid(), x: beam.span / 2, type: 'roller' }] });
  const updateSupport = (id, f, v) => setBeam({ supports: beam.supports.map((s) => s.id === id ? { ...s, [f]: v } : s) });
  const removeSupport = (id)        => setBeam({ supports: beam.supports.filter((s) => s.id !== id) });

  const addPL    = () => setBeam({ pointLoads: [...beam.pointLoads, { id: uid(), x: beam.span / 2, magnitude: -10000 }] });
  const updatePL = (id, f, v) => setBeam({ pointLoads: beam.pointLoads.map((p) => p.id === id ? { ...p, [f]: v } : p) });
  const removePL = (id)        => setBeam({ pointLoads: beam.pointLoads.filter((p) => p.id !== id) });

  const addUDL    = () => setBeam({ udls: [...beam.udls, { id: uid(), x1: 0, x2: beam.span, magnitude: -5000 }] });
  const updateUDL = (id, f, v) => setBeam({ udls: beam.udls.map((u) => u.id === id ? { ...u, [f]: v } : u) });
  const removeUDL = (id)        => setBeam({ udls: beam.udls.filter((u) => u.id !== id) });

  const addTri    = () => setBeam({ triangularLoads: [...(beam.triangularLoads || []), { id: uid(), x1: 0, x2: beam.span, w1: 0, w2: -5000 }] });
  const updateTri = (id, f, v) => setBeam({ triangularLoads: (beam.triangularLoads || []).map((t) => t.id === id ? { ...t, [f]: v } : t) });
  const removeTri = (id)        => setBeam({ triangularLoads: (beam.triangularLoads || []).filter((t) => t.id !== id) });

  const addCustom    = () => setBeam({ customLoads: [...(beam.customLoads || []), { id: uid(), x1: 0, x2: beam.span, expr: '-2000*Math.sin(Math.PI*x/10)' }] });
  const updateCustom = (id, f, v) => setBeam({ customLoads: (beam.customLoads || []).map((c) => c.id === id ? { ...c, [f]: v } : c) });
  const removeCustom = (id)        => setBeam({ customLoads: (beam.customLoads || []).filter((c) => c.id !== id) });

  const addMoment    = () => setBeam({ moments: [...beam.moments, { id: uid(), x: beam.span / 2, magnitude: 5000 }] });
  const updateMom    = (id, f, v) => setBeam({ moments: beam.moments.map((m) => m.id === id ? { ...m, [f]: v } : m) });
  const removeMom    = (id)        => setBeam({ moments: beam.moments.filter((m) => m.id !== id) });

  const addHinge    = () => setBeam({ hinges: [...(beam.hinges || []), { id: uid(), x: beam.span / 2 }] });
  const updateHinge = (id, v) => setBeam({ hinges: (beam.hinges || []).map((h) => h.id === id ? { ...h, x: v } : h) });
  const removeHinge = (id)    => setBeam({ hinges: (beam.hinges || []).filter((h) => h.id !== id) });

  const handleAnalyze = () => {
    setBeam({ ildPoint: ildX });
    onAnalyze(ildX, beam.ildType || 'shear');
  };

  return (
    <div className="p-3.5 overflow-y-auto h-full">

      {/* Header badge */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/[0.06]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M13 3h8m0 0v8m0-8L11 13"/>
          </svg>
        </div>
        <div>
          <div className="text-xs font-bold text-white">Beam Configuration</div>
          <div className="text-[10px] text-slate-500">Macaulay's method · ILD</div>
        </div>
      </div>

      {/* Beam Properties */}
      <SectionHeader title="Beam Properties" icon={sectionIcons.props} accent="blue" />
      <ItemCard>
        <Row>
          <Field label="Span L (m)" value={beam.span} onChange={(v) => update('span', v)} min={0.1} step={0.5} className="flex-1" />
        </Row>
        <Row>
          <Field label="Elastic Modulus E (Pa)" value={beam.E} onChange={(v) => update('E', v)} step={1e9} className="flex-1" />
          <Field label="Moment of Inertia I (m⁴)" value={beam.I} onChange={(v) => update('I', v)} step={1e-5} className="flex-1" />
        </Row>
      </ItemCard>

      {/* Supports */}
      <SectionHeader title="Supports" icon={sectionIcons.supports} accent="blue" />
      {beam.supports.map((s) => (
        <ItemCard key={s.id}>
          <div className="flex gap-2 items-end">
            <Field label="Position x (m)" value={s.x} onChange={(v) => updateSupport(s.id, 'x', v)} step={0.5} className="flex-1" />
            <Select label="Type" value={s.type} onChange={(v) => updateSupport(s.id, 'type', v)}
              options={[{ value: 'pin', label: 'Pin ↕↔' }, { value: 'roller', label: 'Roller ↕' }, { value: 'fixed', label: 'Fixed ↕↔↻' }]} />
            <DeleteBtn onClick={() => removeSupport(s.id)} />
          </div>
        </ItemCard>
      ))}
      <AddBtn onClick={addSupport} label="Add Support" accent="blue" />

      {/* Internal Hinges */}
      <SectionHeader title="Internal Hinges" icon={sectionIcons.hinge} accent="amber" />
      {(beam.hinges || []).map((h) => (
        <ItemCard key={h.id}>
          <div className="flex gap-2 items-end">
            <Field label="Position x (m)" value={h.x} onChange={(v) => updateHinge(h.id, v)} step={0.5} min={0} className="flex-1" />
            <span className="text-amber-400/70 text-[10px] pb-2 font-medium tracking-wide">⊙ moment release</span>
            <DeleteBtn onClick={() => removeHinge(h.id)} />
          </div>
        </ItemCard>
      ))}
      <AddBtn onClick={addHinge} label="Add Hinge" accent="amber" />

      {/* Point Loads */}
      <SectionHeader title="Point Loads" icon={sectionIcons.loads} accent="rose" />
      {beam.pointLoads.map((p) => (
        <ItemCard key={p.id}>
          <div className="flex gap-2 items-end">
            <Field label="x (m)" value={p.x} onChange={(v) => updatePL(p.id, 'x', v)} step={0.5} className="flex-1" />
            <Field label="Force F (N) ↓neg" value={p.magnitude} onChange={(v) => updatePL(p.id, 'magnitude', v)} step={1000} className="flex-1" />
            <DeleteBtn onClick={() => removePL(p.id)} />
          </div>
        </ItemCard>
      ))}
      <AddBtn onClick={addPL} label="Add Point Load" accent="rose" />

      {/* UDL */}
      <SectionHeader title="Uniform Distributed Load" icon={sectionIcons.udl} accent="violet" />
      {beam.udls.map((u) => (
        <ItemCard key={u.id}>
          <Row>
            <Field label="x₁ (m)" value={u.x1} onChange={(v) => updateUDL(u.id, 'x1', v)} step={0.5} className="flex-1" />
            <Field label="x₂ (m)" value={u.x2} onChange={(v) => updateUDL(u.id, 'x2', v)} step={0.5} className="flex-1" />
            <DeleteBtn onClick={() => removeUDL(u.id)} />
          </Row>
          <Field label="Intensity w (N/m) ↓neg" value={u.magnitude} onChange={(v) => updateUDL(u.id, 'magnitude', v)} step={500} className="w-full" />
        </ItemCard>
      ))}
      <AddBtn onClick={addUDL} label="Add UDL" accent="violet" />

      {/* Triangular */}
      <SectionHeader title="Triangular / Trapezoidal Load" icon={sectionIcons.udl} accent="sky" />
      {(beam.triangularLoads || []).map((t) => (
        <ItemCard key={t.id}>
          <Row>
            <Field label="x₁ (m)" value={t.x1} onChange={(v) => updateTri(t.id, 'x1', v)} step={0.5} className="flex-1" />
            <Field label="x₂ (m)" value={t.x2} onChange={(v) => updateTri(t.id, 'x2', v)} step={0.5} className="flex-1" />
            <DeleteBtn onClick={() => removeTri(t.id)} />
          </Row>
          <Row>
            <Field label="w₁ at x₁ (N/m)" value={t.w1} onChange={(v) => updateTri(t.id, 'w1', v)} step={500} className="flex-1" />
            <Field label="w₂ at x₂ (N/m)" value={t.w2} onChange={(v) => updateTri(t.id, 'w2', v)} step={500} className="flex-1" />
          </Row>
          <p className="text-[10px] text-slate-600">w₁=0 for pure triangular · same sign for trapezoidal</p>
        </ItemCard>
      ))}
      <AddBtn onClick={addTri} label="Add Tri / Trap Load" accent="sky" />

      {/* Custom Load */}
      <SectionHeader title="Custom Load w(x)" icon={sectionIcons.loads} accent="emerald" />
      {(beam.customLoads || []).map((c) => (
        <ItemCard key={c.id}>
          <Row>
            <Field label="x₁ (m)" value={c.x1} onChange={(v) => updateCustom(c.id, 'x1', v)} step={0.5} className="flex-1" />
            <Field label="x₂ (m)" value={c.x2} onChange={(v) => updateCustom(c.id, 'x2', v)} step={0.5} className="flex-1" />
            <DeleteBtn onClick={() => removeCustom(c.id)} />
          </Row>
          <label className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">Expression w(x) — JS syntax</span>
            <input
              type="text"
              value={c.expr}
              onChange={(e) => updateCustom(c.id, 'expr', e.target.value)}
              placeholder="-2000*Math.sin(Math.PI*x/10)"
              className="bg-emerald-950/30 border border-emerald-500/20 rounded-lg px-2.5 py-1.5 text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-400 transition-colors"
            />
          </label>
          <p className="text-[10px] text-slate-600">Available: <code className="text-emerald-400">Math.sin, Math.cos, Math.pow, Math.PI, x</code></p>
        </ItemCard>
      ))}
      <AddBtn onClick={addCustom} label="Add Custom Load" accent="emerald" />

      {/* Moments */}
      <SectionHeader title="Applied Moments" icon={sectionIcons.moment} accent="purple" />
      {beam.moments.map((m) => (
        <ItemCard key={m.id}>
          <div className="flex gap-2 items-end">
            <Field label="x (m)" value={m.x} onChange={(v) => updateMom(m.id, 'x', v)} step={0.5} className="flex-1" />
            <Field label="M (N·m) ↻pos" value={m.magnitude} onChange={(v) => updateMom(m.id, 'magnitude', v)} step={500} className="flex-1" />
            <DeleteBtn onClick={() => removeMom(m.id)} />
          </div>
        </ItemCard>
      ))}
      <AddBtn onClick={addMoment} label="Add Moment" accent="purple" />

      {/* ILD */}
      <SectionHeader title="Influence Line Diagram" icon={sectionIcons.ild} accent="sky" />
      <ItemCard>
        <Row>
          <Field label="Section x (m)" value={ildX} onChange={setIldX} step={0.5} min={0} className="flex-1" />
          <Select
            label="ILD type"
            value={beam.ildType || 'shear'}
            onChange={(v) => update('ildType', v)}
            options={[{ value: 'shear', label: 'Shear Force' }, { value: 'moment', label: 'Bending Moment' }]}
            accent="sky"
          />
        </Row>
      </ItemCard>

      {/* CTA */}
      <button
        onClick={handleAnalyze}
        className="w-full mt-4 relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] text-sm tracking-wide"
      >
        <span className="relative flex items-center justify-center gap-2">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Analyze Beam
        </span>
      </button>
    </div>
  );
}
