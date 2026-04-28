import { useStore } from './store/useStore';
import Navbar from './components/shared/Navbar';
import BeamPage from './pages/BeamPage';
import TrussPage from './pages/TrussPage';
import SummaryPage from './pages/SummaryPage';

export default function App() {
  const { activeTab } = useStore();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Navbar />
      <main className="flex-1">
        {activeTab === 'beam' && <BeamPage />}
        {activeTab === 'truss' && <TrussPage />}
        {activeTab === 'summary' && <SummaryPage />}
      </main>
    </div>
  );
}
