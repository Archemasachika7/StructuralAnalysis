import React, { useState } from 'react';
import { Activity, Triangle, FileBarChart } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('beams');

  return (
    <div className="flex flex-col h-screen bg-slate-100">
      {/* Top Navigation Bar */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Activity className="h-6 w-6 text-blue-400" />
              <span className="font-bold text-xl">Structalyze 3D</span>
            </div>
            <nav className="flex space-x-4">
              <TabButton id="beams" current={activeTab} setTab={setActiveTab} icon={<Activity size={18} />} label="Beams (SFD/BMD)" />
              <TabButton id="trusses" current={activeTab} setTab={setActiveTab} icon={<Triangle size={18} />} label="Truss Generator" />
              <TabButton id="summary" current={activeTab} setTab={setActiveTab} icon={<FileBarChart size={18} />} label="Summary" />
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Workspace (Split Pane) */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Pane: Inputs */}
        <section className="w-1/3 min-w-[350px] bg-white border-r border-slate-200 overflow-y-auto p-6">
          <h2 className="text-2xl font-bold mb-4 capitalize">{activeTab} Parameters</h2>
          
          {activeTab === 'beams' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-500">Inputs for Span, Supports, and Loads will go here.</p>
              </div>
            </div>
          )}

          {activeTab === 'trusses' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-500">Parametric controls (Bays, Height, Standard Types) will go here.</p>
              </div>
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-500">Global reaction and force summary tables will render here.</p>
            </div>
          )}
        </section>

        {/* Right Pane: 3D Visualization and 2D Charts */}
        <section className="flex-1 bg-slate-50 flex flex-col relative">
          {activeTab !== 'summary' ? (
             <>
               {/* 3D Canvas Area */}
               <div className="flex-1 border-b border-slate-200 bg-gradient-to-b from-slate-200 to-slate-100 flex items-center justify-center relative">
                 <span className="text-slate-400 font-medium">React Three Fiber Canvas Goes Here</span>
                 <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded shadow text-xs font-mono">
                   3D Visualizer Active
                 </div>
               </div>

               {/* 2D Diagram Area (SFD/BMD/Deflection) */}
               <div className="h-1/3 bg-white p-4 overflow-y-auto">
                 <h3 className="font-semibold text-slate-700 mb-2">Analysis Diagrams</h3>
                 <div className="w-full h-32 border-2 border-dashed border-slate-200 rounded flex items-center justify-center">
                    <span className="text-slate-400 text-sm">Recharts Area (SFD, BMD, ILD)</span>
                 </div>
               </div>
             </>
          ) : (
            <div className="flex-1 p-8 flex items-center justify-center">
              <h2 className="text-slate-400 text-xl">Select a structure to view the exportable summary reports.</h2>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// Helper component for navigation tabs
function TabButton({ id, current, setTab, icon, label }) {
  const isActive = current === id;
  return (
    <button
      onClick={() => setTab(id)}
      className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
