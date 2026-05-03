import { useState } from 'react';
import { useStore } from '../store/useStore';
import { solveBeam, computeILD } from '../utils/beamSolver';
import BeamInputPanel from '../components/beam/BeamInputPanel';
import Beam2DVisualizer from '../components/beam/Beam2DVisualizer';
import Beam3DVisualizer from '../components/beam/Beam3DVisualizer';
import DiagramCharts from '../components/beam/DiagramCharts';

export default function BeamPage() {
  const { beam, setBeamResults, beamResults } = useStore();
  const [ildData, setIldData] = useState(null);
  const [ildX, setIldX] = useState(null);
  const [ildType, setIldTypeState] = useState('shear');
  const [error, setError] = useState(null);
  const [view, setView] = useState('2d');

  const handleAnalyze = (ildPoint, ildTypeArg) => {
    try {
      setError(null);
      const results = solveBeam(beam);
      if (!results) throw new Error('Could not solve — check supports and loads.');
      setBeamResults(results);
      const type = ildTypeArg || beam.ildType || 'shear';
      setIldTypeState(type);
      setIldData(computeILD(beam, ildPoint, type));
      setIldX(ildPoint);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ── left panel ── */}
      <div className="w-72 flex-shrink-0 border-r border-white/[0.06] overflow-y-auto"
        style={{ background: 'linear-gradient(180deg,#030c1a 0%,#020817 100%)' }}>
        <BeamInputPanel onAnalyze={handleAnalyze} />
      </div>

      {/* ── right panel ── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 dot-grid"
        style={{ background: 'linear-gradient(135deg,#020817 0%,#050d1a 100%)' }}>

        {error && (
          <div className="animate-fade-in flex items-start gap-3 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 text-sm backdrop-blur-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {/* view toggle */}
        <div className="flex items-center gap-3 animate-fade-in">
          <span className="text-xs text-slate-600 font-medium uppercase tracking-widest">View</span>
          <div className="flex rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.03]">
            {[['2d','2D Diagram'],['3d','3D Model']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                  view === v
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}>
                {label}
              </button>
            ))}
          </div>
          {beamResults && (
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Analysis complete
            </div>
          )}
        </div>

        <div className="animate-fade-in-up">
          {view === '2d'
            ? <Beam2DVisualizer beam={beam} />
            : <Beam3DVisualizer beam={beam} results={beamResults} />
          }
        </div>

        {beamResults ? (
          <div className="animate-fade-in-up delay-100">
            <DiagramCharts results={beamResults} ildData={ildData} ildX={ildX} ildType={ildType} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M13 3h8m0 0v8m0-8L11 13"/>
              </svg>
            </div>
            <p className="text-slate-600 text-sm">Configure beam parameters in the left panel</p>
            <p className="text-slate-700 text-xs mt-1">then click <span className="text-blue-400 font-medium">Analyze Beam</span> to compute results</p>
          </div>
        )}
      </div>
    </div>
  );
}
