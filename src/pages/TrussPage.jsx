import { useState } from 'react';
import { useStore } from '../store/useStore';
import { solveTruss, computeTrussILD } from '../utils/trussSolver';
import TrussInputPanel from '../components/truss/TrussInputPanel';
import TrussVisualizer from '../components/truss/TrussVisualizer';
import Truss3DVisualizer from '../components/truss/Truss3DVisualizer';

export default function TrussPage() {
  const { truss, setTruss, setTrussResults } = useStore();
  const [error, setError] = useState(null);
  const [ildData, setIldData] = useState(null);
  const [view, setView] = useState('2d'); // '2d' | '3d'

  const handleAnalyze = () => {
    if (!truss.nodes.length || !truss.members.length) {
      setError('Please generate a truss first.');
      return;
    }
    try {
      setError(null);
      const results = solveTruss(
        truss.nodes, truss.members, truss.loads,
        truss.A || 0.01, truss.E || 200e9,
        truss.pinNodeId, truss.rollerNodeId,
      );
      setTrussResults(results);
      setTruss({ results });

      // Compute ILD for selected member
      if (truss.ildMemberId != null) {
        const ild = computeTrussILD(
          truss.nodes, truss.members, truss.ildMemberId,
          truss.A || 0.01, truss.E || 200e9,
          truss.pinNodeId, truss.rollerNodeId,
        );
        setIldData(ild);
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const results = truss.results;

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden">
      <div className="w-72 flex-shrink-0 bg-slate-950 border-r border-slate-700 overflow-y-auto">
        <TrussInputPanel onAnalyze={handleAnalyze} />
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-950 p-4 flex flex-col gap-4">
        {error && (
          <div className="bg-red-950 border border-red-700 text-red-300 rounded px-4 py-3 text-sm">{error}</div>
        )}

        {/* View toggle */}
        {truss.nodes.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Visualization:</span>
            {['2d', '3d'].map((v) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                  view === v
                    ? 'bg-emerald-900 border-emerald-500 text-emerald-300'
                    : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-slate-500'
                }`}>
                {v.toUpperCase()} View
              </button>
            ))}
          </div>
        )}

        {view === '3d' && truss.nodes.length > 0
          ? <Truss3DVisualizer nodes={truss.nodes} members={truss.members} loads={truss.loads} results={results}
              pinNodeId={truss.pinNodeId} rollerNodeId={truss.rollerNodeId} />
          : <TrussVisualizer
              nodes={truss.nodes}
              members={truss.members}
              loads={truss.loads}
              results={results}
              ildData={ildData}
              ildMemberId={truss.ildMemberId}
            />
        }

        {!truss.nodes.length && (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm py-12">
            Select a truss type and click{' '}
            <span className="text-emerald-400 mx-1 font-semibold">Generate Truss</span>, then{' '}
            <span className="text-blue-400 mx-1 font-semibold">Analyze Truss</span>.
          </div>
        )}
      </div>
    </div>
  );
}
