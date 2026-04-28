import { useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Html, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';

const BEAM_W = 0.18;
const BEAM_D = 0.22;

/* ── helpers ── */
function fmtN(v) {
  const a = Math.abs(v);
  if (a >= 1e3) return `${(v/1e3).toFixed(1)}kN`;
  return `${v.toFixed(0)}N`;
}

/* ── sub-components ── */

function BeamBox({ span }) {
  return (
    <mesh position={[span / 2, 0, 0]} castShadow>
      <boxGeometry args={[span, BEAM_W, BEAM_D]} />
      <meshStandardMaterial color="#334155" metalness={0.3} roughness={0.7} />
    </mesh>
  );
}

function BeamEdges({ span }) {
  const hs = span / 2;
  const hw = BEAM_W / 2;
  const hd = BEAM_D / 2;
  const corners = [
    [0, hw, hd], [span, hw, hd],
    [0, hw, -hd], [span, hw, -hd],
    [0, -hw, hd], [span, -hw, hd],
    [0, -hw, -hd], [span, -hw, -hd],
  ];
  const edges = [
    [0,1],[2,3],[4,5],[6,7],[0,2],[1,3],[4,6],[5,7],[0,4],[1,5],[2,6],[3,7],
  ];
  return (
    <>
      {edges.map(([a, b], i) => (
        <Line key={i} points={[corners[a], corners[b]]} color="#60a5fa" lineWidth={1} />
      ))}
    </>
  );
}

function PinSupport({ x }) {
  const h = 0.5;
  return (
    <group position={[x, -BEAM_W / 2 - h / 2, 0]}>
      {/* tetrahedron approximated as cone */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.25, h, 4, 1]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* base plate */}
      <mesh position={[0, -h / 2 - 0.02, 0]}>
        <boxGeometry args={[0.6, 0.04, 0.5]} />
        <meshStandardMaterial color="#1e40af" />
      </mesh>
    </group>
  );
}

function RollerSupport({ x }) {
  const h = 0.35;
  return (
    <group position={[x, -BEAM_W / 2 - h / 2, 0]}>
      <mesh rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.22, h, 4, 1]} />
        <meshStandardMaterial color="#10b981" metalness={0.4} roughness={0.5} />
      </mesh>
      {/* rollers */}
      {[-0.15, 0.15].map((dz, i) => (
        <mesh key={i} position={[0, -h / 2 - 0.07, dz]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.28, 12]} />
          <meshStandardMaterial color="#064e3b" />
        </mesh>
      ))}
    </group>
  );
}

function FixedSupport({ x }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[-0.12, 0, 0]}>
        <boxGeometry args={[0.12, BEAM_W + 0.3, BEAM_D + 0.1]} />
        <meshStandardMaterial color="#d97706" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* hatch lines */}
      {[-0.22, -0.11, 0, 0.11, 0.22].map((dy, i) => (
        <mesh key={i} position={[-0.22, dy, 0]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.02, 0.18, 0.02]} />
          <meshStandardMaterial color="#92400e" />
        </mesh>
      ))}
    </group>
  );
}

function LoadArrow({ x, fy, label }) {
  const isDown = fy < 0;
  const len = 0.9;
  const shaftL = len * 0.65;
  const headL = len * 0.35;
  const color = isDown ? '#f87171' : '#4ade80';
  const dir = isDown ? -1 : 1;
  const baseY = (BEAM_W / 2 + len) * dir;

  return (
    <group position={[x, isDown ? BEAM_W / 2 + len : -BEAM_W / 2 - len, 0]}>
      {/* shaft */}
      <mesh position={[0, (-dir * shaftL) / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.03, shaftL, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* head */}
      <mesh position={[0, -dir * (shaftL + headL / 2), 0]} rotation={[isDown ? 0 : Math.PI, 0, 0]}>
        <coneGeometry args={[0.1, headL, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Html position={[0, 0.1, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 10, color, whiteSpace: 'nowrap', textShadow: '0 0 4px #000' }}>{label}</div>
      </Html>
    </group>
  );
}

function UDLArrows3D({ x1, x2, w, span }) {
  const isDown = w < 0;
  const color = '#a78bfa';
  const count = Math.max(3, Math.round((x2 - x1) / (span / 12)));
  const arrowLen = 0.55;
  const dir = isDown ? -1 : 1;
  return (
    <group>
      {/* top cap line */}
      <Line
        points={[[x1, (BEAM_W / 2 + arrowLen) * dir, 0], [x2, (BEAM_W / 2 + arrowLen) * dir, 0]]}
        color={color} lineWidth={2}
      />
      {Array.from({ length: count }, (_, i) => {
        const px = x1 + (i / (count - 1)) * (x2 - x1);
        const tipY = isDown ? BEAM_W / 2 : -BEAM_W / 2;
        return (
          <group key={i} position={[px, (BEAM_W / 2 + arrowLen) * dir, 0]}>
            <mesh position={[0, (-dir * arrowLen * 0.65) / 2, 0]}>
              <cylinderGeometry args={[0.02, 0.02, arrowLen * 0.65, 6]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, -dir * (arrowLen * 0.65 + arrowLen * 0.2), 0]} rotation={[isDown ? 0 : Math.PI, 0, 0]}>
              <coneGeometry args={[0.07, arrowLen * 0.25, 6]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );
      })}
      <Html position={[(x1 + x2) / 2, (BEAM_W / 2 + arrowLen + 0.2) * dir, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 10, color, whiteSpace: 'nowrap', textShadow: '0 0 4px #000' }}>
          {(w / 1000).toFixed(1)} kN/m
        </div>
      </Html>
    </group>
  );
}

function TriArrows3D({ x1, x2, w1, w2, span }) {
  const color = '#fcd34d';
  const count = Math.max(3, Math.round((x2 - x1) / (span / 12)));
  const maxW = Math.max(Math.abs(w1), Math.abs(w2));
  const isDown = (w1 + w2) < 0;
  const maxLen = 0.6;
  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const t = i / Math.max(count - 1, 1);
        const px = x1 + t * (x2 - x1);
        const wt = w1 + (w2 - w1) * t;
        if (Math.abs(wt) < 0.01) return null;
        const len = (Math.abs(wt) / (maxW || 1)) * maxLen;
        const dir = wt < 0 ? -1 : 1;
        return (
          <group key={i} position={[px, (BEAM_W / 2 + len) * dir, 0]}>
            <mesh position={[0, (-dir * len * 0.7) / 2, 0]}>
              <cylinderGeometry args={[0.015, 0.015, len * 0.7, 6]} />
              <meshStandardMaterial color={color} />
            </mesh>
            <mesh position={[0, -dir * (len * 0.7 + len * 0.2), 0]} rotation={[wt < 0 ? 0 : Math.PI, 0, 0]}>
              <coneGeometry args={[0.06, len * 0.25, 6]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );
      })}
      <Html position={[(x1 + x2) / 2, (BEAM_W / 2 + maxLen + 0.2) * (isDown ? -1 : 1), 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 10, color, whiteSpace: 'nowrap', textShadow: '0 0 4px #000' }}>
          {(w1/1000).toFixed(1)}→{(w2/1000).toFixed(1)} kN/m
        </div>
      </Html>
    </group>
  );
}

function MomentArrow({ x, magnitude }) {
  const color = '#fbbf24';
  const r = 0.22;
  const pts = useMemo(() => {
    const points = [];
    const segs = 24;
    for (let i = 0; i <= segs; i++) {
      const angle = (i / segs) * Math.PI * 1.6 - Math.PI * 0.8;
      points.push([x + r * Math.cos(angle), r * Math.sin(angle) + BEAM_W / 2 + r, 0]);
    }
    return points;
  }, [x, r]);
  return (
    <>
      <Line points={pts} color={color} lineWidth={2.5} />
      <Html position={[x, BEAM_W / 2 + r * 2.1, 0]} center style={{ pointerEvents: 'none' }}>
        <div style={{ fontSize: 10, color, whiteSpace: 'nowrap', textShadow: '0 0 4px #000' }}>
          {magnitude > 0 ? '↺' : '↻'} {(magnitude/1000).toFixed(1)}kN·m
        </div>
      </Html>
    </>
  );
}

function HingeSymbol3D({ x }) {
  return (
    <mesh position={[x, 0, 0]}>
      <sphereGeometry args={[0.14, 12, 12]} />
      <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.3} />
    </mesh>
  );
}

function DeflectedShape({ data, scale }) {
  const pts = useMemo(() => {
    const step = Math.max(1, Math.floor(data.length / 120));
    return data.filter((_, i) => i % step === 0).map((d) => [d.x, d.deflection * scale, 0]);
  }, [data, scale]);

  return <Line points={pts} color="#c084fc" lineWidth={3} />;
}

function Scene({ beam, results }) {
  const { span, supports = [], pointLoads = [], udls = [], triangularLoads = [], customLoads = [], moments = [], hinges = [] } = beam;

  // Auto deflection scale so max visual deflection = ~0.5 units
  const deflScale = useMemo(() => {
    if (!results) return 1;
    const maxD = results.maxDeflection || 1e-6;
    return 0.5 / maxD;
  }, [results]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[span * 0.5, span * 0.6, span * 0.4]} intensity={1.2} castShadow />
      <directionalLight position={[-span * 0.3, span * 0.3, -span * 0.2]} intensity={0.4} />

      {/* Beam */}
      <BeamBox span={span} />
      <BeamEdges span={span} />

      {/* Supports */}
      {supports.map((s) => {
        if (s.type === 'roller') return <RollerSupport key={s.id} x={s.x} />;
        if (s.type === 'fixed') return <FixedSupport key={s.id} x={s.x} />;
        return <PinSupport key={s.id} x={s.x} />;
      })}

      {/* Hinges */}
      {hinges.map((h) => <HingeSymbol3D key={h.id} x={h.x} />)}

      {/* Point loads */}
      {pointLoads.map((pl) => (
        <LoadArrow key={pl.id} x={pl.x} fy={pl.magnitude} label={fmtN(pl.magnitude)} />
      ))}

      {/* UDLs */}
      {udls.map((u) => (
        <UDLArrows3D key={u.id} x1={u.x1} x2={u.x2} w={u.magnitude} span={span} />
      ))}

      {/* Triangular loads */}
      {triangularLoads.map((t) => (
        <TriArrows3D key={t.id} x1={t.x1} x2={t.x2} w1={t.w1} w2={t.w2} span={span} />
      ))}

      {/* Moments */}
      {moments.map((m) => <MomentArrow key={m.id} x={m.x} magnitude={m.magnitude} />)}

      {/* Custom load regions */}
      {customLoads.map((c) => (
        <mesh key={c.id} position={[(c.x1 + c.x2) / 2, 0, 0]}>
          <boxGeometry args={[c.x2 - c.x1, BEAM_W + 0.05, BEAM_D + 0.05]} />
          <meshStandardMaterial color="#22c55e" transparent opacity={0.12} wireframe />
        </mesh>
      ))}

      {/* Deflected shape */}
      {results && <DeflectedShape data={results.data} scale={deflScale} />}

      {/* Grid floor */}
      <gridHelper args={[Math.max(span * 1.5, 10), 20, '#1e293b', '#0f172a']} position={[span / 2, -1.2, 0]} />

      <OrbitControls makeDefault enablePan enableZoom enableRotate />
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport axisColors={['#f87171', '#4ade80', '#60a5fa']} labelColor="white" />
      </GizmoHelper>
    </>
  );
}

export default function Beam3DVisualizer({ beam, results }) {
  const span = beam?.span || 10;
  const camDist = span * 1.2;

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 text-xs text-slate-400 font-semibold flex items-center gap-3">
        3D BEAM VISUALIZER
        <span className="text-slate-600 font-normal">Drag to rotate · Scroll to zoom · Right-drag to pan</span>
        {results && <span className="text-purple-400">— deflected shape shown (auto-scaled)</span>}
      </div>
      <div style={{ height: 340 }}>
        <Canvas
          camera={{ position: [span / 2, camDist * 0.5, camDist * 0.85], fov: 45 }}
          shadows
          gl={{ antialias: true }}
          style={{ background: '#0f172a' }}
        >
          <Scene beam={beam} results={results} />
        </Canvas>
      </div>
    </div>
  );
}
