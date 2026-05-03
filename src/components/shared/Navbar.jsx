import { useStore } from '../../store/useStore';

const tabs = [
  {
    id: 'beam',
    label: 'Beam Analyzer',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
        <path d="M6 14a1 1 0 01-1-1V7a1 1 0 012 0v6a1 1 0 01-1 1zM14 14a1 1 0 01-1-1V7a1 1 0 012 0v6a1 1 0 01-1 1z"/>
      </svg>
    ),
    accent: 'blue',
  },
  {
    id: 'truss',
    label: 'Truss Generator',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M10 3L2 17h16L10 3zm0 3.5l5.5 9H4.5L10 6.5z"/>
      </svg>
    ),
    accent: 'emerald',
  },
  {
    id: 'summary',
    label: 'Summary',
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path d="M2 4a1 1 0 011-1h14a1 1 0 010 2H3a1 1 0 01-1-1zm0 5a1 1 0 011-1h14a1 1 0 010 2H3a1 1 0 01-1-1zm0 5a1 1 0 011-1h7a1 1 0 010 2H3a1 1 0 01-1-1z"/>
      </svg>
    ),
    accent: 'purple',
  },
];

const accentMap = {
  blue:    { active: 'text-blue-400 bg-blue-500/10 border-blue-500/60',    dot: 'bg-blue-400',    ring: 'shadow-blue-500/20' },
  emerald: { active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/60', dot: 'bg-emerald-400', ring: 'shadow-emerald-500/20' },
  purple:  { active: 'text-purple-400 bg-purple-500/10 border-purple-500/60',  dot: 'bg-purple-400',  ring: 'shadow-purple-500/20' },
};

export default function Navbar() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <nav className="glass border-b border-white/[0.06] px-4 h-14 flex items-center gap-1 relative z-50">
      {/* logo */}
      <div className="flex items-center gap-2.5 pr-5 mr-3 border-r border-white/[0.08]">
        <div className="relative w-8 h-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg opacity-80" />
          <svg viewBox="0 0 24 24" fill="none" className="relative w-5 h-5 text-white" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div>
          <div className="text-white font-bold text-sm leading-none tracking-tight">StructAnalysis</div>
          <div className="text-slate-500 text-[10px] leading-none mt-0.5">FEM · SFD · BMD · ILD</div>
        </div>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          const a = accentMap[t.accent];
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border ${
                isActive
                  ? `${a.active} shadow-lg ${a.ring}`
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {isActive && (
                <span className={`absolute -top-px left-1/2 -translate-x-1/2 w-8 h-px ${a.dot} rounded-full opacity-80`} />
              )}
              <span className={isActive ? '' : 'opacity-60'}>{t.icon}</span>
              {t.label}
              {isActive && <span className={`w-1.5 h-1.5 rounded-full ${a.dot} animate-pulse ml-0.5`} />}
            </button>
          );
        })}
      </div>

      {/* right side badge */}
      <div className="ml-auto flex items-center gap-2 text-xs text-slate-600">
        <span className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/[0.06]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          React Three Fiber · Recharts · Zustand
        </span>
      </div>
    </nav>
  );
}
