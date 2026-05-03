import { useMemo, useState, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─── ui helpers ───────────────────────────────────────────────────────────────

function Slider({ label, value, min, max, step, onChange }) {
  return (
    <label className="flex flex-col gap-0.5 text-xs text-slate-400">
      <div className="flex justify-between">
        <span>{label}</span>
        <span className="text-slate-300 font-mono">{typeof value === 'number' ? value.toFixed(step < 0.1 ? 2 : 1) : value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="accent-emerald-500 w-full" />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between text-xs text-slate-400 cursor-pointer select-none">
      {label}
      <div onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-colors relative ${checked ? 'bg-emerald-600' : 'bg-slate-600'}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${checked ? 'left-4' : 'left-0.5'}`} />
      </div>
    </label>
  );
}

const BG_COLORS = { dark: '#0f172a', navy: '#0c1a2e', slate: '#1a1f2e' };

// ─── colour mapping ───────────────────────────────────────────────────────────

function forceToColor(force, maxForce) {
  if (Math.abs(force) < 0.5) return new THREE.Color('#475569');
  const t = Math.min(Math.abs(force) / (maxForce || 1), 1);
  if (force > 0) return new THREE.Color(0.1 + 0.08 * t, 0.38 + 0.52 * t, 0.8 + 0.2 * t);
  return new THREE.Color(0.78 + 0.22 * t, 0.08 + 0.02 * (1 - t), 0.08);
}

function fmtF(v) {
  const a = Math.abs(v), s = v > 0 ? 'T' : 'C';
  if (a >= 1e6) return `${(a / 1e6).toFixed(2)} MN (${s})`;
  if (a >= 1e3) return `${(a / 1e3).toFixed(2)} kN (${s})`;
  return `${a.toFixed(0)} N (${s})`;
}

// ─── hit-box member (invisible cylinder for hover detection) ──────────────────

function MemberHitBox({ p1, p2, onOver, onOut }) {
  const mid = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, (p1[2] + p2[2]) / 2];
  const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
  const len = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  return (
    <mesh
      position={mid}
      rotation={[0, 0, angle]}
      onPointerOver={(e) => { e.stopPropagation(); onOver(); }}
      onPointerOut={onOut}
    >
      <boxGeometry args={[len, 0.18, 0.18]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

// ─── single member ────────────────────────────────────────────────────────────

function Member({ ni, nj, force, maxForce, lineWidth, hovered, onOver, onOut }) {
  const color = forceToColor(force, maxForce);
  const p1 = [ni.x, ni.y, 0], p2 = [nj.x, nj.y, 0];
  const mid = [(ni.x + nj.x) / 2, (ni.y + nj.y) / 2 + 0.22, 0];

  return (
    <>
      <Line points={[p1, p2]} color={color} lineWidth={hovered ? lineWidth + 2 : lineWidth} />
      <MemberHitBox p1={p1} p2={p2} onOver={onOver} onOut={onOut} />
      {hovered && (
        <Html position={mid} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: 5,
            padding: '4px 10px', fontSize: 11, color: '#f1f5f9',
            whiteSpace: 'nowrap', boxShadow: '0 2px 8px #000a',
          }}>
            {fmtF(force)}
          </div>
        </Html>
      )}
    </>
  );
}

// ─── deflected member overlay ─────────────────────────────────────────────────

function DeflectedMember({ ni, nj, diA, diB, dispScale }) {
  const p1 = [ni.x + diA.ux * dispScale, ni.y + diA.uy * dispScale, 0];
  const p2 = [nj.x + diB.ux * dispScale, nj.y + diB.uy * dispScale, 0];
  return <Line points={[p1, p2]} color="#c084fc" lineWidth={2} />;
}

// ─── node sphere ─────────────────────────────────────────────────────────────

function NodeSphere({ node, isPin, isRoller, nodeRadius, disp, dispScale, showDefl, showLabels }) {
  const pos = showDefl && disp
    ? [node.x + disp.ux * dispScale, node.y + disp.uy * dispScale, 0]
    : [node.x, node.y, 0];
  const r = nodeRadius;
  const color = isPin ? '#3b82f6' : isRoller ? '#10b981' : '#64748b';

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[r, 12, 12]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>
      {isPin && (
        <group position={[0, -r, 0]}>
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[r * 1.6, r * 3.5, 4]} />
            <meshStandardMaterial color="#2563eb" metalness={0.35} />
          </mesh>
          <mesh position={[0, -r * 2.2, 0]}>
            <boxGeometry args={[r * 4, r * 0.3, r * 3]} />
            <meshStandardMaterial color="#1d4ed8" />
          </mesh>
        </group>
      )}
      {isRoller && (
        <group position={[0, -r, 0]}>
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[r * 1.5, r * 3, 4]} />
            <meshStandardMaterial color="#059669" />
          </mesh>
          {[-r * 0.9, r * 0.9].map((dz, i) => (
            <mesh key={i} position={[0, -r * 2.2, dz]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[r * 0.5, r * 0.5, r * 1.5, 12]} />
              <meshStandardMaterial color="#065f46" />
            </mesh>
          ))}
        </group>
      )}
      {showLabels && (
        <Html position={[0, r + 0.18, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: 9, color: '#94a3b8', textShadow: '0 0 4px #000' }}>N{node.id}</div>
        </Html>
      )}
    </group>
  );
}

// ─── load arrows ─────────────────────────────────────────────────────────────

function LoadArrow3D({ node, fx, fy, arrowScale, showLabels }) {
  const len = arrowScale;
  const shaft = len * 0.68, head = len * 0.32;
  const elems = [];

  if (fy) {
    const isDown = fy < 0, dir = isDown ? -1 : 1, color = '#f87171';
    const startY = node.y + dir * len;
    elems.push(
      <group key="fy">
        <mesh position={[node.x, startY - dir * shaft * 0.5, 0]}>
          <cylinderGeometry args={[0.04, 0.04, shaft, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[node.x, startY - dir * (shaft + head * 0.5), 0]} rotation={[isDown ? 0 : Math.PI, 0, 0]}>
          <coneGeometry args={[0.12, head, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {showLabels && (
          <Html position={[node.x, startY + dir * 0.18, 0]} center style={{ pointerEvents: 'none' }}>
            <div style={{ fontSize: 11, color, whiteSpace: 'nowrap', textShadow: '0 0 5px #000', fontWeight: 600 }}>
              {(Math.abs(fy) / 1000).toFixed(1)} kN
            </div>
          </Html>
        )}
      </group>
    );
  }

  if (fx) {
    const isRight = fx > 0, dir = isRight ? 1 : -1, color = '#fb923c';
    const startX = node.x + dir * len;
    elems.push(
      <group key="fx">
        <mesh position={[startX - dir * shaft * 0.5, node.y, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, shaft, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[startX - dir * (shaft + head * 0.5), node.y, 0]} rotation={[0, 0, isRight ? -Math.PI / 2 : Math.PI / 2]}>
          <coneGeometry args={[0.12, head, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  }

  return <>{elems}</>;
}

// ─── camera reset helper ─────────────────────────────────────────────────────

function CameraReset({ target, distance, triggerReset }) {
  const { camera } = useThree();
  const orbitRef = useRef();
  useMemo(() => {
    if (!triggerReset) return;
    camera.position.set(target[0], target[1] + distance * 0.5, distance);
    camera.lookAt(...target);
  }, [triggerReset]);
  return null;
}

// ─── scene ────────────────────────────────────────────────────────────────────

function Scene({ nodes, members, loads, results, ctrl, resetTrigger }) {
  const [hoveredId, setHoveredId] = useState(null);

  const nodeMap = useMemo(() => {
    const m = {};
    nodes.forEach((n) => { m[n.id] = n; });
    return m;
  }, [nodes]);

  const dispMap = useMemo(() => {
    const m = {};
    (results?.nodeDisplacements || []).forEach((d) => { m[d.nodeId] = d; });
    return m;
  }, [results]);

  const mfArr = results?.memberForces || [];
  const maxForce = mfArr.length ? Math.max(...mfArr.map((m) => Math.abs(m.force))) : 1;

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const span = xs.length ? Math.max(...xs) - Math.min(...xs) : 10;
  const cx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
  const cy = ys.length ? (Math.min(...ys) + Math.max(...ys)) / 2 : 0;

  const sortedByX = [...nodes].sort((a, b) => a.x - b.x);
  const pinNode = ctrl.pinNodeId != null
    ? nodes.find((n) => n.id === ctrl.pinNodeId) || sortedByX[0]
    : sortedByX[0];
  const rollerNode = ctrl.rollerNodeId != null
    ? nodes.find((n) => n.id === ctrl.rollerNodeId) || sortedByX[sortedByX.length - 1]
    : sortedByX[sortedByX.length - 1];

  const autoDispScale = useMemo(() => {
    if (!results?.nodeDisplacements?.length) return 1;
    const maxU = Math.max(...results.nodeDisplacements.map((d) => Math.max(Math.abs(d.ux), Math.abs(d.uy))));
    return maxU > 1e-10 ? (span * 0.07) / maxU : 1;
  }, [results, span]);
  const dispScale = ctrl.autoDeflScale ? autoDispScale : ctrl.deflScale;

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[cx + span * 0.5, span * 1.2, span * 0.6]} intensity={1.3} castShadow />
      <directionalLight position={[cx - span * 0.3, span * 0.5, -span * 0.4]} intensity={0.4} />

      {/* original members */}
      {members.map((m) => {
        const ni = nodeMap[m.nodeA], nj = nodeMap[m.nodeB];
        if (!ni || !nj) return null;
        const mf = mfArr.find((f) => f.id === m.id);
        return (
          <Member
            key={m.id}
            ni={ni} nj={nj}
            force={mf?.force ?? 0}
            maxForce={maxForce}
            lineWidth={ctrl.memberSize * 2.5}
            hovered={hoveredId === m.id}
            onOver={() => setHoveredId(m.id)}
            onOut={() => setHoveredId(null)}
          />
        );
      })}

      {/* deflected overlay */}
      {ctrl.showDeflected && results && members.map((m) => {
        const ni = nodeMap[m.nodeA], nj = nodeMap[m.nodeB];
        const diA = dispMap[m.nodeA], diB = dispMap[m.nodeB];
        if (!ni || !nj || !diA || !diB) return null;
        return <DeflectedMember key={`d-${m.id}`} ni={ni} nj={nj} diA={diA} diB={diB} dispScale={dispScale} />;
      })}

      {/* nodes */}
      {nodes.map((n) => (
        <NodeSphere
          key={n.id} node={n}
          isPin={n.id === pinNode?.id}
          isRoller={n.id === rollerNode?.id}
          nodeRadius={ctrl.nodeSize * 0.12}
          disp={dispMap[n.id]}
          dispScale={dispScale}
          showDefl={ctrl.showDeflected && !!results}
          showLabels={ctrl.showLabels}
        />
      ))}

      {/* loads */}
      {loads.map((l) => {
        const n = nodeMap[l.nodeId];
        if (!n) return null;
        return <LoadArrow3D key={l.id} node={n} fx={l.fx} fy={l.fy} arrowScale={ctrl.arrowScale} showLabels={ctrl.showLabels} />;
      })}

      {ctrl.showGrid && (
        <gridHelper args={[Math.max(span * 2, 12), 24, '#1e293b', '#0f172a']} position={[cx, -0.6, 0]} />
      )}

      <CameraReset target={[cx, cy, 0]} distance={span * 1.1} triggerReset={resetTrigger} />
      <OrbitControls makeDefault target={[cx, cy * 0.5, 0]} enablePan enableZoom enableRotate />
    </>
  );
}

// ─── main export ─────────────────────────────────────────────────────────────

export default function Truss3DVisualizer({ nodes, members, loads, results, pinNodeId, rollerNodeId }) {
  const [open, setOpen] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [ctrl, setCtrl] = useState({
    memberSize: 1,
    nodeSize: 1,
    arrowScale: 0.75,
    showLabels: true,
    showGrid: true,
    showDeflected: false,
    autoDeflScale: true,
    deflScale: 50,
    bg: 'dark',
    pinNodeId: null,
    rollerNodeId: null,
  });

  // Sync support nodes from parent (generated truss sets defaults)
  useMemo(() => {
    if (pinNodeId != null || rollerNodeId != null) {
      setCtrl((c) => ({ ...c, pinNodeId, rollerNodeId }));
    }
  }, [pinNodeId, rollerNodeId]);

  const upd = (k, v) => setCtrl((c) => ({ ...c, [k]: v }));

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const span = xs.length ? Math.max(...xs) - Math.min(...xs) : 10;
  const h = ys.length ? Math.max(...ys) - Math.min(...ys) : 3;
  const cx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;

  if (!nodes.length) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-700 h-64 flex items-center justify-center text-slate-600 text-sm">
        Generate a truss to see 3D visualization
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 flex items-center gap-3 flex-wrap text-xs">
        <span className="font-semibold text-slate-400">3D TRUSS VISUALIZER</span>
        <span className="text-slate-600">Drag · Scroll · Right-drag pan</span>
        {/* legend */}
        <div className="flex items-center gap-3 ml-2">
          <span className="flex items-center gap-1 text-blue-400"><span className="inline-block w-4 h-1.5 rounded bg-blue-400"/>Tension</span>
          <span className="flex items-center gap-1 text-red-400"><span className="inline-block w-4 h-1.5 rounded bg-red-400"/>Compression</span>
          {results && <span className="flex items-center gap-1 text-purple-400"><span className="inline-block w-4 h-1.5 rounded bg-purple-400"/>Deflected</span>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setResetTrigger((v) => v + 1)}
            className="px-2.5 py-1 rounded text-xs border bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500 transition-colors">
            ⟳ Reset camera
          </button>
          <button onClick={() => setOpen((v) => !v)}
            className={`px-2.5 py-1 rounded text-xs border transition-colors ${open ? 'bg-slate-700 border-slate-500 text-slate-200' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
            ⚙ Controls
          </button>
        </div>
      </div>

      {/* Controls panel */}
      {open && (
        <div className="bg-slate-800 border-b border-slate-700 px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-3">
          <Slider label="Member thickness" value={ctrl.memberSize} min={0.4} max={3} step={0.1} onChange={(v) => upd('memberSize', v)} />
          <Slider label="Node size" value={ctrl.nodeSize} min={0.4} max={2.5} step={0.1} onChange={(v) => upd('nodeSize', v)} />
          <Slider label="Arrow scale" value={ctrl.arrowScale} min={0.2} max={2} step={0.1} onChange={(v) => upd('arrowScale', v)} />
          <Toggle label="Show labels" checked={ctrl.showLabels} onChange={(v) => upd('showLabels', v)} />
          <Toggle label="Show grid" checked={ctrl.showGrid} onChange={(v) => upd('showGrid', v)} />
          <Toggle label="Show deflected shape" checked={ctrl.showDeflected} onChange={(v) => upd('showDeflected', v)} />
          <Toggle label="Auto deflection scale" checked={ctrl.autoDeflScale} onChange={(v) => upd('autoDeflScale', v)} />
          {!ctrl.autoDeflScale && (
            <Slider label="Defl. scale ×" value={ctrl.deflScale} min={1} max={500} step={5} onChange={(v) => upd('deflScale', v)} />
          )}
          {/* Override support nodes in 3D */}
          {nodes.length > 0 && (
            <>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Pin node (3D)
                <select value={ctrl.pinNodeId ?? ''} onChange={(e) => upd('pinNodeId', parseInt(e.target.value))}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-100 text-xs">
                  {nodes.map((n) => <option key={n.id} value={n.id}>N{n.id} ({n.x.toFixed(1)},{n.y.toFixed(1)})</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-slate-400">
                Roller node (3D)
                <select value={ctrl.rollerNodeId ?? ''} onChange={(e) => upd('rollerNodeId', parseInt(e.target.value))}
                  className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-100 text-xs">
                  {nodes.map((n) => <option key={n.id} value={n.id}>N{n.id} ({n.x.toFixed(1)},{n.y.toFixed(1)})</option>)}
                </select>
              </label>
            </>
          )}
          <div className="flex flex-col gap-1 text-xs text-slate-400">
            Background
            <div className="flex gap-2">
              {Object.entries(BG_COLORS).map(([k, v]) => (
                <button key={k} onClick={() => upd('bg', k)}
                  className={`w-7 h-5 rounded border transition-all ${ctrl.bg === k ? 'border-emerald-400 scale-110' : 'border-slate-600'}`}
                  style={{ background: v }} title={k} />
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ height: 380 }}>
        <Canvas
          camera={{ position: [cx, h * 2.2, span * 1.05], fov: 46, up: [0, 1, 0] }}
          gl={{ antialias: true }}
          style={{ background: BG_COLORS[ctrl.bg] }}
        >
          <Scene
            nodes={nodes} members={members} loads={loads} results={results}
            ctrl={{ ...ctrl, pinNodeId: ctrl.pinNodeId ?? pinNodeId, rollerNodeId: ctrl.rollerNodeId ?? rollerNodeId }}
            resetTrigger={resetTrigger}
          />
        </Canvas>
      </div>
    </div>
  );
}
