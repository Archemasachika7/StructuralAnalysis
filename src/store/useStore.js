import { create } from 'zustand';

const defaultBeam = {
  span: 10,
  E: 200e9,
  I: 4e-4,
  supports: [
    { id: 1, x: 0, type: 'pin' },
    { id: 2, x: 10, type: 'roller' },
  ],
  pointLoads: [{ id: 1, x: 5, magnitude: -20000 }],
  udls: [],
  triangularLoads: [],
  customLoads: [],
  moments: [],
  hinges: [],
  ildPoint: 5,
  ildType: 'shear', // 'shear' | 'moment'
};

const defaultTruss = {
  type: 'pratt',
  span: 12,
  height: 3,
  bays: 4,
  E: 200e9,
  A: 0.01,
  nodes: [],
  members: [],
  loads: [],
  pinNodeId: null,
  rollerNodeId: null,
  ildMemberId: null,
  results: null,
};

export const useStore = create((set) => ({
  activeTab: 'beam',
  setActiveTab: (tab) => set({ activeTab: tab }),

  beam: defaultBeam,
  setBeam: (updates) => set((s) => ({ beam: { ...s.beam, ...updates } })),
  resetBeam: () => set({ beam: defaultBeam }),

  beamResults: null,
  setBeamResults: (r) => set({ beamResults: r }),

  truss: defaultTruss,
  setTruss: (updates) => set((s) => ({ truss: { ...s.truss, ...updates } })),
  resetTruss: () => set({ truss: defaultTruss }),

  trussResults: null,
  setTrussResults: (r) => set({ trussResults: r }),
}));
