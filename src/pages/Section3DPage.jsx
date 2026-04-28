import { useStore } from '../store/useStore';
import BeamSection3D from '../components/beam/BeamSection3D';
import TrussSection3D from '../components/truss/TrussSection3D';

export default function Section3DPage() {
  const { beam, truss } = useStore();

  return (
    <div className="bg-slate-950 min-h-[calc(100vh-48px)] p-4">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3">
          <h1 className="text-slate-100 text-lg font-semibold">3D Section Visualiser</h1>
          <p className="text-slate-400 text-sm mt-1">
            Conceptual 3D previews derived from your current beam and truss inputs.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <BeamSection3D beam={beam} />
          <TrussSection3D truss={truss} />
        </div>
      </div>
    </div>
  );
}
