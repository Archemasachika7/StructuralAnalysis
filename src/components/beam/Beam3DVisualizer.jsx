import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── tiny UI helpers ──────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <label className="flex flex-col gap-0.5 text-xs text-slate-400">
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="text-slate-300 font-mono">{typeof value === 'number' ? value.toFixed(step < 0.1 ? 2 : 1) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="accent-blue-500 w-full" />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between text-xs text-slate-400 cursor-pointer select-none">
      {label}
      <div
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-slate-600'}`}
      >
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
      </div>
    </label>
  );
}

// ─── scene components ─────────────────────────────────────────────────────────

const BG_COLORS = { dark: '#0f172a', navy: '#0c1a2e', charcoal: '#1c1c1e' };

function BeamMesh({ span, thickness }) {
  const h = thickness;
  return (
    <mesh position={[span / 2, 0, 0]} castShadow>
      <boxGeometry args={[span, h, h * 1.2]} />
      <meshStandardMaterial color="#334155" metalness={0.35} roughness={0.65} />
    </mesh>
  );
}

function BeamOutline({ span, thickness }) {
  const h = thickness / 2;
  const hd = thickness * 0.6;
  const corners = [
    [0, h, hd], [span, h, hd], [0, h, -hd], [span, h, -hd],
    [0, -h, hd], [span, -h, hd], [0, -h, -hd], [span, -h, -hd],
  ];
  const edges = [[0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7]];
  return (
    <>
      {edges.map(([a, b], i) => (
        <Line key={i} points={[corners[a], corners[b]]} color="#60a5fa" lineWidth={1.2} />
      ))}
    </>
  );
}

function PinSupport({ x, size }) {
  const h = size * 1.8;
  return (
    <group position={[x, -size * 0.5, 0]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[size * 0.9, h, 4, 1]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, -h * 0.5 - 0.025, 0]}>
        <boxGeometry args={[size * 2.2, 0.05, size * 1.8]} />
        <meshStandardMaterial color="#1d4ed8" />
      </mesh>
    </group>
  );
}

function RollerSupport({ x, size }) {
  const h = size * 1.4;
  return (
    <group position={[x, -size * 0.5, 0]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[size * 0.8, h, 4, 1]} />
        <meshStandardMaterial color="#10b981" metalness={0.4} roughness={0.5} />
      </mesh>
      {[-size * 0.5, size * 0.5].map((dz, i) => (
        <mesh key={i} position={[0, -h * 0.5 - size * 0.25, dz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[size * 0.24, size * 0.24, size, 12]} />
          <meshStandardMaterial color="#064e3b" />
        </mesh>
      ))}
    </group>
  );
}

function FixedSupport({ x, size }) {
  const w = size * 0.5;
  const h = size * 3;
  return (
    <group position={[x - w * 0.5, 0, 0]}>
      <mesh>
        <boxGeometry args={[w, h, size * 2]} />
        <meshStandardMaterial color="#d97706" metalness={0.3} roughness={0.6} />
      </mesh>
      {[-h * 0.35, -h * 0.12, h * 0.12, h * 0.35].map((dy, i) => (
        <mesh key={i} position={[-w * 0.7, dy, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.02, w * 1.4, 0.02]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      ))}
    </group>
  );
}

function HingeSymbol({ x, size }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh>
        <sphereGeometry args={[size * 0.55, 14, 14]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh>
        <torusGeometry args={[size * 0.55, 0.025, 8, 24]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
    </group>
  );
}

function LoadArrow({ x, fy, arrowScale, showLabels }) {
  const isDown = fy < 0;
  const len = arrowScale;
  const shaft = len * 0.68, head = len * 0.32;
  const color = isDown ? '#f87171' : '#4ade80';
  const dir = isDown ? -1 : 1;
  const baseY = isDown ? 0.09 : -0.09; // beam surface
  const startY = baseY + dir * len;

  return (
    <group>
      {/* shaft */}
      <mesh position={[x, startY - dir * shaft * 0.5, 0]}>
        <cylinderGeometry args={[0.03, 0.03, shaft, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* head */}
      <mesh position={[x, startY - dir * (shaft + head * 0.5), 0]} rotation={[isDown ? 0 : Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, head, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {showLabels && (
        <Html position={[x, startY + dir * 0.18, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: 11, color, whiteSpace: 'nowrap', textShadow: '0 0 5px #000', fontWeight: 600 }}>
            {(Math.abs(fy) / 1000).toFixed(1)} kN
          </div>
        </Html>
      )}
    </group>
  );
}

function UDLArrows3D({ x1, x2, w, span, arrowScale, showLabels }) {
  const isDown = w < 0;
  const color = '#a78bfa';
  const count = Math.max(3, Math.round((x2 - x1) / (span / 10)));
  const len = arrowScale * 0.8;
  const dir = isDown ? -1 : 1;
  const capY = dir * (0.09 + len);

  return (
    <group>
      <Line points={[[x1, capY, 0], [x2, capY, 0]]} color={color} lineWidth={2.5} />
      {Array.from({ length: count }, (_, i) => {
        const px = x1 + (i / (count - 1)) * (x2 - x1);
        const shaft = len * 0.7, head = len * 0.3;
        return (
          <group key={i} position={[px, capY, 0]}>
            <mesh position={[0, -dir * shaft * 0.5, 0]}>
              <cylinderGeometry args={[0.025, 0.025, shaft, 7]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, -dir * (shaft + head * 0.5), 0]} rotation={[isDown ? 0 : Math.PI, 0, 0]}>
              <coneGeometry args={[0.08, head, 7]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );
      })}
      {showLabels && (
        <Html position={[(x1 + x2) / 2, capY + dir * 0.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: 11, color: '#a78bfa', whiteSpace: 'nowrap', textShadow: '0 0 5px #000' }}>
            {(w / 1000).toFixed(1)} kN/m
          </div>
        </Html>
      )}
    </group>
  );
}

function TriArrows3D({ x1, x2, w1, w2, span, arrowScale, showLabels }) {
  const color = '#fcd34d';
  const count = Math.max(4, Math.round((x2 - x1) / (span / 10)));
  const maxW = Math.max(Math.abs(w1), Math.abs(w2)) || 1;
  const maxLen = arrowScale * 0.85;

  return (
    <group>
      {/* envelope line */}
      <Line
        points={[[x1, ((w1 < 0 ? -1 : 1) * (Math.abs(w1) / maxW) * maxLen + 0.09) * (w1 < 0 ? -1 : 1), 0],
                 [x2, ((w2 < 0 ? -1 : 1) * (Math.abs(w2) / maxW) * maxLen + 0.09) * (w2 < 0 ? -1 : 1), 0]]}
        color={color} lineWidth={1.8}
      />
      {Array.from({ length: count }, (_, i) => {
        const t = count > 1 ? i / (count - 1) : 0;
        const px = x1 + t * (x2 - x1);
        const wt = w1 + (w2 - w1) * t;
        if (Math.abs(wt) < 0.01) return null;
        const dir = wt < 0 ? -1 : 1;
        const len = (Math.abs(wt) / maxW) * maxLen;
        const shaft = len * 0.7, head = len * 0.3;
        const capY = dir * (0.09 + len);
        return (
          <group key={i} position={[px, capY, 0]}>
            <mesh position={[0, -dir * shaft * 0.5, 0]}>
              <cylinderGeometry args={[0.02, 0.02, shaft, 7]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, -dir * (shaft + head * 0.5), 0]} rotation={[wt < 0 ? 0 : Math.PI, 0, 0]}>
              <coneGeometry args={[0.07, head, 7]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );
      })}
      {showLabels && (
        <Html position={[(x1 + x2) / 2, ((w1 + w2) < 0 ? -1 : 1) * (maxLen + 0.3), 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: 11, color, whiteSpace: 'nowrap', textShadow: '0 0 5px #000' }}>
            {(w1 / 1000).toFixed(1)}→{(w2 / 1000).toFixed(1)} kN/m
          </div>
        </Html>
      )}
    </group>
  );
}

function MomentArc({ x, magnitude, size }) {
  const color = '#fbbf24';
  const r = size * 1.1;
  const pts = useMemo(() => {
    return Array.from({ length: 32 }, (_, i) => {
      const angle = (i / 31) * Math.PI * 1.65 - Math.PI * 0.82;
      return [x + r * Math.cos(angle), 0.09 + r + r * Math.sin(angle), 0];
    });
  }, [x, r]);
  const endPt = pts[pts.length - 1];
  return (
    <>
      <Line points={pts} color={color} lineWidth={2.5} />
      {/* arrowhead at end */}
      <mesh position={endPt} rotation={[0, 0, magnitude > 0 ? -0.4 : 0.4]}>
        <coneGeometry args={[0.07, r * 0.35, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </>
  );
}

function CustomLoadBox({ x1, x2, showLabels }) {
  return (
    <group position={[(x1 + x2) / 2, 0, 0]}>
      <mesh>
        <boxGeometry args={[x2 - x1, 0.6, 0.3]} />
        <meshStandardMaterial color="#22c55e" transparent opacity={0.1} wireframe />
      </mesh>
      {showLabels && (
        <Html position={[0, 0.55, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: 11, color: '#4ade80', textShadow: '0 0 5px #000' }}>w(x)</div>
        </Html>
      )}
    </group>
  );
}

function DeflectedBeam({ data, deflScale }) {
  const pts = useMemo(() => {
    const step = Math.max(1, Math.floor(data.length / 150));
    return data.filter((_, i) => i % step === 0).map((d) => [d.x, d.deflection * deflScale, 0]);
  }, [data, deflScale]);
  return <Line points={pts} color="#c084fc" lineWidth={3} />;
}

function Scene({ beam, results, ctrl }) {
  const {
    span = 10, supports = [], pointLoads = [], udls = [],
    triangularLoads = [], customLoads = [], moments = [], hinges = [],
  } = beam;

  const sz = ctrl.memberSize * 0.18; // base thickness
  const arrowScale = ctrl.arrowScale;
  const showLabels = ctrl.showLabels;

  const autoDeflScale = useMemo(() => {
    if (!results) return 1;
    const maxD = results.maxDeflection || 1e-8;
    return (sz * 2) / maxD;
  }, [results, sz]);
  const deflScale = ctrl.autoDeflScale ? autoDeflScale : ctrl.deflScale;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[span * 0.5, span * 0.7, span * 0.5]} intensity={1.3} castShadow />
      <directionalLight position={[-span * 0.4, span * 0.3, -span * 0.3]} intensity={0.4} />

      <BeamMesh span={span} thickness={sz} />
      <BeamOutline span={span} thickness={sz} />

      {supports.map((s) => {
        if (s.type === 'roller') return <RollerSupport key={s.id} x={s.x} size={sz} />;
        if (s.type === 'fixed') return <FixedSupport key={s.id} x={s.x} size={sz} />;
        return <PinSupport key={s.id} x={s.x} size={sz} />;
      })}

      {hinges.map((h) => <HingeSymbol key={h.id} x={h.x} size={sz} />)}

      {pointLoads.map((pl) => (
        <LoadArrow key={pl.id} x={pl.x} fy={pl.magnitude} arrowScale={arrowScale} showLabels={showLabels} />
      ))}
      {udls.map((u) => (
        <UDLArrows3D key={u.id} x1={u.x1} x2={u.x2} w={u.magnitude} span={span} arrowScale={arrowScale} showLabels={showLabels} />
      ))}
      {triangularLoads.map((t) => (
        <TriArrows3D key={t.id} x1={t.x1} x2={t.x2} w1={t.w1} w2={t.w2} span={span} arrowScale={arrowScale} showLabels={showLabels} />
      ))}
      {moments.map((m) => <MomentArc key={m.id} x={m.x} magnitude={m.magnitude} size={sz} />)}
      {customLoads.map((c) => <CustomLoadBox key={c.id} x1={c.x1} x2={c.x2} showLabels={showLabels} />)}

      {results && <DeflectedBeam data={results.data} deflScale={deflScale} />}

      {ctrl.showGrid && (
        <gridHelper
          args={[Math.max(span * 1.8, 12), 24, '#1e293b', '#0f172a']}
          position={[span / 2, -sz * 4, 0]}
        />
      )}

      <OrbitControls makeDefault enablePan enableZoom enableRotate />
    </>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function Beam3DVisualizer({ beam, results }) {
  const span = beam?.span || 10;
  const [open, setOpen] = useState(false);
  const [ctrl, setCtrl] = useState({
    memberSize: 1,
    arrowScale: 0.9,
    showLabels: true,
    showGrid: true,
    autoDeflScale: true,
    deflScale: 200,
    bg: 'dark',
  });
  const upd = (k, v) => setCtrl((c) => ({ ...c, [k]: v }));

  const camPos = useMemo(() => [span / 2, span * 0.45, span * 0.9], [span]);

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold text-slate-400">3D BEAM VISUALIZER</span>
        <span className="text-slate-600 text-xs">Drag · Scroll · Right-drag pan</span>
        {results && <span className="text-purple-400 text-xs">↳ deflected shape shown</span>}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`ml-auto px-2.5 py-1 rounded text-xs border transition-colors ${open ? 'bg-slate-700 border-slate-500 text-slate-200' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}`}
        >
          ⚙ Controls
        </button>
      </div>

      {/* Controls panel */}
      {open && (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-3">
          <Slider label="Member thickness" value={ctrl.memberSize} min={0.4} max={2.5} step={0.1} onChange={(v) => upd('memberSize', v)} />
          <Slider label="Arrow scale" value={ctrl.arrowScale} min={0.3} max={2.5} step={0.1} onChange={(v) => upd('arrowScale', v)} />
          <Toggle label="Show labels" checked={ctrl.showLabels} onChange={(v) => upd('showLabels', v)} />
          <Toggle label="Show grid" checked={ctrl.showGrid} onChange={(v) => upd('showGrid', v)} />
          <Toggle label="Auto deflection scale" checked={ctrl.autoDeflScale} onChange={(v) => upd('autoDeflScale', v)} />
          {!ctrl.autoDeflScale && (
            <Slider label="Defl. scale ×" value={ctrl.deflScale} min={1} max={2000} step={10} onChange={(v) => upd('deflScale', v)} />
          )}
          <div className="flex flex-col gap-1 text-xs text-slate-400">
            Background
            <div className="flex gap-2">
              {Object.entries(BG_COLORS).map(([k, v]) => (
                <button key={k} onClick={() => upd('bg', k)}
                  className={`w-7 h-5 rounded border transition-all ${ctrl.bg === k ? 'border-blue-400 scale-110' : 'border-slate-600'}`}
                  style={{ background: v }} title={k} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 340 }}>
        <Canvas
          camera={{ position: camPos, fov: 45 }}
          shadows
          gl={{ antialias: true }}
          style={{ background: BG_COLORS[ctrl.bg] }}
        >
          <Scene beam={beam} results={results} ctrl={ctrl} />
        </Canvas>
      </div>
    </div>
  );
}
