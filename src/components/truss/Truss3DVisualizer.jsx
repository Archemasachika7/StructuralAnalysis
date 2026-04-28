import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Html, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';

function tensionColor(force, maxForce) {
  if (Math.abs(force) < 0.5) return new THREE.Color('#475569');
  const t = Math.min(Math.abs(force) / (maxForce || 1), 1);
  if (force > 0) return new THREE.Color(0.1 + 0.1 * t, 0.4 + 0.5 * t, 0.8 + 0.2 * t);
  return new THREE.Color(0.8 + 0.2 * t, 0.1, 0.1);
}

function fmtF(v) {
  const a = Math.abs(v);
  const s = v > 0 ? 'T' : 'C';
  if (a >= 1e6) return `${(a/1e6).toFixed(2)}MN (${s})`;
  if (a >= 1e3) return `${(a/1e3).toFixed(2)}kN (${s})`;
  return `${a.toFixed(0)}N (${s})`;
}

function Member({ ni, nj, force, maxForce, isHovered, onHover, onLeave, deflected, dispScale }) {
  const [p1, p2] = useMemo(() => {
    if (deflected) {
      return [
        [ni.x + (ni.ux || 0) * dispScale, ni.y + (ni.uy || 0) * dispScale, 0],
        [nj.x + (nj.ux || 0) * dispScale, nj.y + (nj.uy || 0) * dispScale, 0],
      ];
    }
    return [[ni.x, ni.y, 0], [nj.x, nj.y, 0]];
  }, [ni, nj, deflected, dispScale]);

  const color = tensionColor(force, maxForce);
  const width = isHovered ? 5 : 3;

  return (
    <group
      onPointerOver={(e) => { e.stopPropagation(); onHover(); }}
      onPointerOut={onLeave}
    >
      <Line points={[p1, p2]} color={color} lineWidth={width} />
      {isHovered && (
        <Html position={[(p1[0]+p2[0])/2, (p1[1]+p2[1])/2+0.25, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: '#1e293b', border: '1px solid #475569', borderRadius: 4,
            padding: '3px 8px', fontSize: 11, color: '#f1f5f9', whiteSpace: 'nowrap',
          }}>
            {fmtF(force)}
          </div>
        </Html>
      )}
    </group>
  );
}

function NodeSphere({ node, isPin, isRoller, disp, dispScale, showDisp }) {
  const pos = showDisp
    ? [node.x + (disp?.ux || 0) * dispScale, node.y + (disp?.uy || 0) * dispScale, 0]
    : [node.x, node.y, 0];

  const color = isPin ? '#3b82f6' : isRoller ? '#10b981' : '#94a3b8';
  const r = 0.12;

  return (
    <group position={pos}>
      <mesh>
        <sphereGeometry args={[r, 10, 10]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.3} />
      </mesh>
      {/* Support symbols */}
      {isPin && (
        <mesh position={[0, -r - 0.28, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.22, 0.5, 4]} />
          <meshStandardMaterial color="#3b82f6" metalness={0.4} />
        </mesh>
      )}
      {isRoller && (
        <group position={[0, -r - 0.22, 0]} rotation={[Math.PI, 0, 0]}>
          <mesh>
            <coneGeometry args={[0.2, 0.4, 4]} />
            <meshStandardMaterial color="#10b981" metalness={0.4} />
          </mesh>
          {[-0.12, 0.12].map((dz, i) => (
            <mesh key={i} position={[0, -0.3, dz]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.06, 0.22, 10]} />
              <meshStandardMaterial color="#065f46" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function LoadArrow3D({ node, fx, fy }) {
  const elements = [];
  const len = 0.75;

  if (fy) {
    const isDown = fy < 0;
    const color = '#f87171';
    const dir = isDown ? -1 : 1;
    elements.push(
      <group key="fy" position={[node.x, node.y + (isDown ? len : -len), 0]}>
        <mesh position={[0, (-dir * len * 0.65) / 2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, len * 0.65, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[0, -dir * len * 0.82, 0]} rotation={[isDown ? 0 : Math.PI, 0, 0]}>
          <coneGeometry args={[0.1, len * 0.25, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <Html position={[0, 0.1, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{ fontSize: 10, color, whiteSpace: 'nowrap', textShadow: '0 0 4px #000' }}>
            {(Math.abs(fy) / 1000).toFixed(1)}kN
          </div>
        </Html>
      </group>
    );
  }

  if (fx) {
    const isRight = fx > 0;
    const color = '#fb923c';
    const dir = isRight ? -1 : 1;
    elements.push(
      <group key="fx" position={[node.x + (isRight ? len : -len), node.y, 0]}>
        <mesh position={[(-dir * len * 0.65) / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, 0.03, len * 0.65, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
        <mesh position={[-dir * len * 0.82, 0, 0]} rotation={[0, 0, isRight ? Math.PI / 2 : -Math.PI / 2]}>
          <coneGeometry args={[0.1, len * 0.25, 8]} />
          <meshStandardMaterial color={color} />
        </mesh>
      </group>
    );
  }

  return <>{elements}</>;
}

function Scene({ nodes, members, loads, results, showDeflected, dispScale }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (!nodes.length) return null;

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;

  const nodeMap = {};
  nodes.forEach((n) => { nodeMap[n.id] = n; });

  const sortedByX = [...nodes].sort((a, b) => a.x - b.x);
  const pinNode = sortedByX[0];
  const rollerNode = sortedByX[sortedByX.length - 1];

  const memberForces = results?.memberForces || [];
  const nodeDisp = results?.nodeDisplacements || [];
  const dispMap = {};
  nodeDisp.forEach((d) => { dispMap[d.nodeId] = d; });

  const maxForce = memberForces.length ? Math.max(...memberForces.map((m) => Math.abs(m.force))) : 1;

  const span = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys) || 1;

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[cx + span * 0.5, height * 3, span * 0.5]} intensity={1.3} castShadow />
      <directionalLight position={[cx - span * 0.3, height * 2, -span * 0.3]} intensity={0.4} />

      {/* Members */}
      {members.map((m) => {
        const ni = nodeMap[m.nodeA];
        const nj = nodeMap[m.nodeB];
        if (!ni || !nj) return null;
        const mf = memberForces.find((f) => f.id === m.id);
        const niDisp = dispMap[m.nodeA];
        const njDisp = dispMap[m.nodeB];
        const niD = { ...ni, ux: niDisp?.ux || 0, uy: niDisp?.uy || 0 };
        const njD = { ...nj, ux: njDisp?.ux || 0, uy: njDisp?.uy || 0 };
        return (
          <Member
            key={m.id}
            ni={niD} nj={njD}
            force={mf?.force || 0}
            maxForce={maxForce}
            isHovered={hoveredId === m.id}
            onHover={() => setHoveredId(m.id)}
            onLeave={() => setHoveredId(null)}
            deflected={showDeflected && !!results}
            dispScale={dispScale}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n) => (
        <NodeSphere
          key={n.id}
          node={n}
          isPin={n.id === pinNode.id}
          isRoller={n.id === rollerNode.id}
          disp={dispMap[n.id]}
          dispScale={dispScale}
          showDisp={showDeflected && !!results}
        />
      ))}

      {/* Loads */}
      {loads.map((l) => {
        const n = nodeMap[l.nodeId];
        if (!n) return null;
        return <LoadArrow3D key={l.id} node={n} fx={l.fx} fy={l.fy} />;
      })}

      {/* Deflected shape overlay (ghost) */}
      {showDeflected && results && members.map((m) => {
        const ni = nodeMap[m.nodeA], nj = nodeMap[m.nodeB];
        if (!ni || !nj) return null;
        const diA = dispMap[m.nodeA], diB = dispMap[m.nodeB];
        if (!diA || !diB) return null;
        return (
          <Line
            key={`def-${m.id}`}
            points={[
              [ni.x + diA.ux * dispScale, ni.y + diA.uy * dispScale, 0],
              [nj.x + diB.ux * dispScale, nj.y + diB.uy * dispScale, 0],
            ]}
            color="#c084fc" lineWidth={2}
          />
        );
      })}

      <gridHelper
        args={[Math.max(span * 1.8, 10), 20, '#1e293b', '#0f172a']}
        position={[cx, -0.5, 0]}
        rotation={[0, 0, 0]}
      />

      <OrbitControls makeDefault enablePan enableZoom enableRotate />
      <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
        <GizmoViewport axisColors={['#f87171', '#4ade80', '#60a5fa']} labelColor="white" />
      </GizmoHelper>
    </>
  );
}

export default function Truss3DVisualizer({ nodes, members, loads, results }) {
  const [showDeflected, setShowDeflected] = useState(false);

  const dispScale = useMemo(() => {
    if (!results?.nodeDisplacements?.length) return 1;
    const maxU = Math.max(...results.nodeDisplacements.map((d) => Math.max(Math.abs(d.ux), Math.abs(d.uy))));
    const span = nodes.length ? Math.max(...nodes.map((n) => n.x)) - Math.min(...nodes.map((n) => n.x)) : 10;
    return maxU > 1e-10 ? (span * 0.08) / maxU : 1;
  }, [results, nodes]);

  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const cx = nodes.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
  const span = nodes.length ? Math.max(...xs) - Math.min(...xs) : 10;
  const height = nodes.length ? Math.max(...ys) - Math.min(...ys) : 3;

  if (!nodes.length) {
    return (
      <div className="bg-slate-900 rounded-lg border border-slate-700 h-64 flex items-center justify-center text-slate-600 text-sm">
        Generate a truss to see 3D visualization
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-700 text-xs text-slate-400 font-semibold flex items-center gap-4 flex-wrap">
        3D TRUSS VISUALIZER
        <span className="text-slate-600 font-normal">Drag to rotate · Scroll to zoom</span>
        {results && (
          <button
            onClick={() => setShowDeflected((v) => !v)}
            className={`px-2 py-0.5 rounded text-xs border transition-colors ${showDeflected ? 'bg-purple-900 border-purple-500 text-purple-300' : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'}`}
          >
            {showDeflected ? '✓ Deflected shape' : 'Show deflected shape'}
          </button>
        )}
        <div className="flex items-center gap-3 ml-auto text-xs">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-blue-400" /> Tension</span>
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-red-500" /> Compression</span>
          {results && <span className="flex items-center gap-1"><span className="inline-block w-3 h-2 rounded-sm bg-purple-400" /> Deflected</span>}
        </div>
      </div>
      <div style={{ height: 380 }}>
        <Canvas
          camera={{ position: [cx, height * 2.5, span * 1.1], fov: 45, up: [0, 1, 0] }}
          gl={{ antialias: true }}
          style={{ background: '#0f172a' }}
        >
          <Scene
            nodes={nodes}
            members={members}
            loads={loads}
            results={results}
            showDeflected={showDeflected}
            dispScale={dispScale}
          />
        </Canvas>
      </div>
    </div>
  );
}
