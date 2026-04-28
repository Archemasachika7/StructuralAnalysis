import { useStore } from '../../store/useStore';

const tabs = [
  { id: 'beam', label: 'Beam Analyzer', icon: '━' },
  { id: 'truss', label: 'Truss Generator', icon: '△' },
  { id: 'summary', label: 'Summary', icon: '⊞' },
  { id: 'section3d', label: '3D Visualiser', icon: '◫' },
];

export default function Navbar() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-4 py-0 flex items-center gap-0">
      <div className="flex items-center gap-2 pr-6 border-r border-slate-700 mr-4">
        <span className="text-blue-400 text-xl font-bold">⬡</span>
        <span className="text-white font-semibold text-sm">StructAnalysis</span>
      </div>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          className={`px-5 py-4 text-sm font-medium transition-colors border-b-2 ${
            activeTab === t.id
              ? 'border-blue-400 text-blue-400 bg-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <span className="mr-2">{t.icon}</span>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
