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
  const [view, setView] = useState('2d'); // '2d' | '3d'

  const handleAnalyze = (ildPoint, ildTypeArg) => {
    try {
      setError(null);
      const results = solveBeam(beam);
      if (!results) throw new Error('Could not solve — check supports and loads.');
      setBeamResults(results);
      const type = ildTypeArg || beam.ildType || 'shear';
      setIldTypeState(type);
      const ild = computeILD(beam, ildPoint, type);
      setIldData(ild);
      setIldX(ildPoint);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden">
      {/* Left pane */}
      <div className="w-72 flex-shrink-0 bg-slate-950 border-r border-slate-700 overflow-y-auto">
        <BeamInputPanel onAnalyze={handleAnalyze} />
      </div>

      {/* Right pane */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-4 flex flex-col gap-4">
        {error && (
          <div className="bg-red-950 border border-red-700 text-red-300 rounded px-4 py-3 text-sm">{error}</div>
        )}

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Visualization:</span>
          {['2d', '3d'].map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                view === v
                  ? 'bg-blue-900 border-blue-500 text-blue-300'
                  : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
            >
              {v.toUpperCase()} View
            </button>
          ))}
        </div>

        {view === '2d'
          ? <Beam2DVisualizer beam={beam} />
          : <Beam3DVisualizer beam={beam} results={beamResults} />
        }

        {beamResults ? (
          <DiagramCharts results={beamResults} ildData={ildData} ildX={ildX} ildType={ildType} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm py-12">
            Configure beam parameters and click{' '}
            <span className="text-blue-400 mx-1 font-semibold">Analyze Beam</span> to see results.
          </div>
        )}
      </div>
    </div>
  );
}
