import { useStore } from '../store/useStore';
import { solveTruss } from '../utils/trussSolver';
import TrussInputPanel from '../components/truss/TrussInputPanel';
import TrussVisualizer from '../components/truss/TrussVisualizer';
import { useState } from 'react';

export default function TrussPage() {
  const { truss, setTruss, setTrussResults, trussResults } = useStore();
  const [error, setError] = useState(null);

  const handleAnalyze = () => {
    if (!truss.nodes.length || !truss.members.length) {
      setError('Please generate a truss first.');
      return;
    }
    try {
      setError(null);
      const results = solveTruss(truss.nodes, truss.members, truss.loads);
      setTrussResults(results);
      setTruss({ results });
    } catch (e) {
      setError(e.message);
    }
  };

  const results = truss.results || trussResults;

  return (
    <div className="flex h-[calc(100vh-48px)] overflow-hidden">
      {/* Left pane */}
      <div className="w-72 flex-shrink-0 bg-slate-950 border-r border-slate-700 overflow-y-auto">
        <TrussInputPanel onAnalyze={handleAnalyze} />
      </div>

      {/* Right pane */}
      <div className="flex-1 overflow-y-auto bg-slate-950 p-4 flex flex-col gap-4">
        {error && (
          <div className="bg-red-950 border border-red-700 text-red-300 rounded px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <TrussVisualizer
          nodes={truss.nodes}
          members={truss.members}
          loads={truss.loads}
          results={results}
        />
        {!truss.nodes.length && (
          <div className="flex-1 flex items-center justify-center text-slate-600 text-sm">
            Select a truss type and click <span className="text-emerald-400 mx-1 font-semibold">Generate Truss</span>, then <span className="text-blue-400 mx-1 font-semibold">Analyze Truss</span>.
          </div>
        )}
      </div>
    </div>
  );
}
