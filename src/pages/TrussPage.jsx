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
  const [view, setView] = useState('2d');

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
      if (truss.ildMemberId != null) {
        setIldData(computeTrussILD(
          truss.nodes, truss.members, truss.ildMemberId,
          truss.A || 0.01, truss.E || 200e9,
          truss.pinNodeId, truss.rollerNodeId,
        ));
      }
    } catch (e) {
      setError(e.message);
    }
  };

  const results = truss.results;

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      {/* ── left panel ── */}
      <div className="w-72 flex-shrink-0 border-r border-white/[0.06] overflow-y-auto"
        style={{ background: 'linear-gradient(180deg,#021a0f 0%,#020817 100%)' }}>
        <TrussInputPanel onAnalyze={handleAnalyze} />
      </div>

      {/* ── right panel ── */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 dot-grid"
        style={{ background: 'linear-gradient(135deg,#020817 0%,#03120a 100%)' }}>

        {error && (
          <div className="animate-fade-in flex items-start gap-3 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl px-4 py-3 text-sm">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            {error}
          </div>
        )}

        {truss.nodes.length > 0 && (
          <div className="flex items-center gap-3 animate-fade-in">
            <span className="text-xs text-slate-600 font-medium uppercase tracking-widest">View</span>
            <div className="flex rounded-lg overflow-hidden border border-white/[0.08] bg-white/[0.03]">
              {[['2d','2D Diagram'],['3d','3D Model']].map(([v, label]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
                    view === v
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            {results && (
              <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 animate-fade-in">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {truss.nodes.length} nodes · {truss.members.length} members solved
              </div>
            )}
          </div>
        )}

        <div className="animate-fade-in-up">
          {view === '3d' && truss.nodes.length > 0
            ? <Truss3DVisualizer nodes={truss.nodes} members={truss.members} loads={truss.loads}
                results={results} pinNodeId={truss.pinNodeId} rollerNodeId={truss.rollerNodeId} />
            : <TrussVisualizer nodes={truss.nodes} members={truss.members} loads={truss.loads}
                results={results} ildData={ildData} ildMemberId={truss.ildMemberId} />
          }
        </div>

        {!truss.nodes.length && (
          <div className="flex-1 flex flex-col items-center justify-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-emerald-400/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 3L2 21h20L12 3zM12 8v5M12 16h.01"/>
              </svg>
            </div>
            <p className="text-slate-600 text-sm">Select a truss template and configure geometry</p>
            <p className="text-slate-700 text-xs mt-1">
              click <span className="text-emerald-400 font-medium">Generate Truss</span> then{' '}
              <span className="text-blue-400 font-medium">Analyze Truss</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
