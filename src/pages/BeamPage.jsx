import { useState } from 'react';
import { useStore } from '../store/useStore';
import { solveBeam, computeILD } from '../utils/beamSolver';
import BeamInputPanel from '../components/beam/BeamInputPanel';
import Beam2DVisualizer from '../components/beam/Beam2DVisualizer';
import DiagramCharts from '../components/beam/DiagramCharts';

export default function BeamPage() {
  const { beam, setBeamResults, beamResults } = useStore();
  const [ildResults, setIldResults] = useState(null);
  const [ildX, setIldX] = useState(null);
  const [error, setError] = useState(null);

  const handleAnalyze = (ildPoint) => {
    try {
      setError(null);
      const results = solveBeam(beam);
      if (!results) throw new Error('Could not solve — check supports and loads.');
      setBeamResults(results);
      const ild = computeILD(beam, ildPoint);
      setIldResults(ild);
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
          <div className="bg-red-950 border border-red-700 text-red-300 rounded px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <Beam2DVisualizer beam={beam} />

        {beamResults ? (
          <DiagramCharts results={beamResults} ildResults={ildResults} ildX={ildX} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
            Configure beam parameters and click <span className="text-blue-400 mx-1 font-semibold">Analyze Beam</span> to see results.
          </div>
        )}
      </div>
    </div>
  );
}
