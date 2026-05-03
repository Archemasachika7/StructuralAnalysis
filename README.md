<div align="center">

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║    ███████╗████████╗██████╗ ██╗   ██╗ ██████╗████████╗   ║
║    ██╔════╝╚══██╔══╝██╔══██╗██║   ██║██╔════╝╚══██╔══╝   ║
║    ███████╗   ██║   ██████╔╝██║   ██║██║        ██║      ║
║    ╚════██║   ██║   ██╔══██╗██║   ██║██║        ██║      ║
║    ███████║   ██║   ██║  ██║╚██████╔╝╚██████╗   ██║      ║
║    ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝  ╚═════╝   ╚═╝      ║
║                                                           ║
║          A N A L Y S I S   ·   S U I T E                 ║
╚═══════════════════════════════════════════════════════════╝
```

**A web-based structural engineering tool — SFD, BMD, ILD, 3D visualization, parametric trusses.**

[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-000000?style=for-the-badge&logo=threedotjs&logoColor=white)](https://docs.pmnd.rs/react-three-fiber)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Zustand](https://img.shields.io/badge/Zustand-State-433E38?style=for-the-badge)](https://zustand-demo.pmnd.rs)
[![Recharts](https://img.shields.io/badge/Recharts-Charts-22b5bf?style=for-the-badge)](https://recharts.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

</div>

## What is this?

StructAnalysis is a **browser-based structural analysis SPA** that lets you:

- Solve beams with arbitrary loading, supports, and internal hinges using **Macaulay's method**
- Generate parametric Pratt / Howe / Warren trusses and solve them with the **Matrix Stiffness Method**
- Plot **Shear Force**, **Bending Moment**, and **Deflection** diagrams with live Recharts charts
- Compute **Influence Line Diagrams** (ILD) for beams (SF or BM) and truss members
- Visualize everything in **interactive 3D** with React Three Fiber + OrbitControls
- Export results as **JSON** or **print to PDF** from the Summary page

---

## Feature Matrix

| Module | Feature | Status |
|--------|---------|--------|
| **Beam** | Pin / Roller / Fixed supports | ✅ |
| | Point loads, UDLs, moments | ✅ |
| | Triangular & trapezoidal loads | ✅ |
| | Custom w(x) function (JS expr) | ✅ |
| | Internal hinges (moment release) | ✅ |
| | SFD · BMD · Deflection via Macaulay | ✅ |
| | ILD — Shear Force or Bending Moment | ✅ |
| | Hinge-aware ILD | ✅ |
| | 2D SVG diagram | ✅ |
| | 3D React Three Fiber model | ✅ |
| **Truss** | Pratt · Howe · Warren templates | ✅ |
| | Configurable bays, span, height | ✅ |
| | Pin + Roller node selection | ✅ |
| | Matrix Stiffness Method solver | ✅ |
| | Member forces (T/C color-coded) | ✅ |
| | Node displacement table (δx, δy) | ✅ |
| | Member ILD (unit load traverses bottom chord) | ✅ |
| | 2D SVG diagram | ✅ |
| | 3D React Three Fiber model | ✅ |
| **UI** | Glassmorphism dark theme | ✅ |
| | Dot-grid animated backgrounds | ✅ |
| | Staggered fade-in animations | ✅ |
| | Shimmer text effects | ✅ |
| | Gradient-border cards | ✅ |
| **Summary** | Stat cards with animations | ✅ |
| | Reaction + force tables | ✅ |
| | JSON export | ✅ |
| | Print / PDF | ✅ |

---

## Screenshots

```
┌─────────────────────────────────────────────────────────────────┐
│  StructAnalysis  [Beam Analyzer●] [Truss Generator] [Summary]   │
├──────────┬──────────────────────────────────────────────────────┤
│          │                                                      │
│  Beam    │   ┌──────── 2D Diagram ──────────┐                  │
│  Config  │   │   ↓20kN           ↓15kN      │                  │
│          │   │   ·               ·           │                  │
│  Span L  │   │===●═══════════════●═══════●  │                  │
│  E / I   │   │   △              ▽            │                  │
│          │   └─────────────────────────────┘                  │
│  ┄ Sup.  │                                                      │
│  ⊙ Hinge │   ┌── SFD ──┐  ┌── BMD ──┐  ┌── δ ──┐            │
│  ↓ Loads │   │▓▓▓▓▓░░░░│  │░▓▓▓▓▓░░░│  │░░▓▓▓░░│            │
│  ≋ UDL   │   └─────────┘  └─────────┘  └───────┘            │
│  △ Tri   │                                                      │
│  ƒ(x) Fn │   ┌── Influence Line (Shear at x=5m) ──────────┐   │
│  ↻ Mom.  │   │     /\        ___/\                         │   │
│  ≈ ILD   │   │____/  \______/    \____                     │   │
│          │   └─────────────────────────────────────────────┘   │
│ [Analyze]│                                                      │
└──────────┴──────────────────────────────────────────────────────┘
```

---

## Architecture

```
src/
├── pages/
│   ├── BeamPage.jsx          # Beam tab orchestrator
│   ├── TrussPage.jsx         # Truss tab orchestrator
│   └── SummaryPage.jsx       # Export + stat overview
│
├── components/
│   ├── shared/
│   │   └── Navbar.jsx        # Tab bar with glassmorphic styling
│   ├── beam/
│   │   ├── BeamInputPanel.jsx   # All beam parameters + ILD config
│   │   ├── Beam2DVisualizer.jsx # SVG: supports, loads, hinges
│   │   ├── Beam3DVisualizer.jsx # R3F 3D model + controls panel
│   │   └── DiagramCharts.jsx    # SFD / BMD / Deflection / ILD charts
│   └── truss/
│       ├── TrussInputPanel.jsx  # Template, geometry, loads, ILD
│       ├── TrussVisualizer.jsx  # SVG + force/displacement tables
│       └── Truss3DVisualizer.jsx # R3F 3D truss + controls panel
│
├── utils/
│   ├── beamSolver.js         # Macaulay integration, ILD, hinge logic
│   └── trussSolver.js        # Matrix stiffness, Gaussian elim, ILD
│
└── store/
    └── useStore.js           # Zustand global state
```

### Solver Flow

```
beamSolver.js                    trussSolver.js
─────────────────────            ─────────────────────────────
solveBeam(beam)                  solveTruss(nodes, members, loads,
  │                                         A, E, pinId, rollerId)
  ├─ build load functions          │
  ├─ compute reactions (ΣM=0)      ├─ assemble global K (2N×2N)
  ├─ Macaulay integrate V(x)       ├─ apply BCs (pin=2 DOF, roller=1)
  ├─ integrate M(x)                ├─ Gaussian elimination w/ pivoting
  └─ double-integrate δ(x)         ├─ recover displacements
                                   └─ back-calc member forces
computeILD(beam, x0, type)
  └─ slide unit load p: 0→L       computeTrussILD(nodes, members, id...)
     └─ Ra=(L-p)/L, Rb=p/L          └─ unit load at each bottom node
        shear/moment at x0               → record force in member id
```

---

## Getting Started

```bash
# 1. Clone
git clone https://github.com/archemasachika7/structuralanalysis.git
cd structuralanalysis

# 2. Install
npm install

# 3. Dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Build for production

```bash
npm run build
npm run preview
```

---

## Usage Guide

### Beam Analyzer

1. Set **Span**, **E** (elastic modulus), and **I** (moment of inertia)
2. Add **supports** — pin, roller, or fixed — at any position
3. Add **loads**:
   - Point loads (negative = downward)
   - Uniform distributed loads (UDL) over a range
   - Triangular/trapezoidal loads (w₁ at x₁ → w₂ at x₂)
   - Custom `w(x)` using a JavaScript expression (e.g. `-2000*Math.sin(Math.PI*x/10)`)
   - Applied moments (positive = counterclockwise)
4. Optionally add **internal hinges** for moment release
5. Configure **ILD** — choose section position and SF or BM
6. Click **Analyze Beam** → SFD, BMD, deflection, and ILD charts appear
7. Toggle **2D / 3D** views at the top

### Truss Generator

1. Pick a **template** (Pratt / Howe / Warren)
2. Set **span**, **height**, **bays**, **E**, and **A**
3. Click **Generate Truss**
4. Assign **pin** and **roller** support nodes from the dropdowns
5. Add or edit **nodal loads** (Fx, Fy per node)
6. Select a **member** for ILD computation
7. Click **Analyze Truss** → member forces, node displacements, and ILD appear
8. Toggle **2D / 3D** views

### 3D Controls (both modules)

- **Orbit** — click + drag
- **Zoom** — scroll wheel
- **Pan** — right-click + drag
- **Settings panel** — adjust member thickness, arrow scale, node size, deflection scale, background, labels, grid

---

## Tech Stack

| Tool | Version | Role |
|------|---------|------|
| [React](https://react.dev) | 18 | UI framework |
| [Vite](https://vitejs.dev) | 6 | Build tool + HMR |
| [Tailwind CSS](https://tailwindcss.com) | v4 (Vite plugin) | Styling |
| [Zustand](https://zustand-demo.pmnd.rs) | 5 | Global state |
| [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) | 9 | 3D WebGL renderer |
| [@react-three/drei](https://github.com/pmndrs/drei) | 9 | R3F helpers (OrbitControls, Line) |
| [Recharts](https://recharts.org) | 2 | SFD / BMD / ILD charts |

---

## Key Engineering Notes

**Macaulay's Method** — shear, moment, and deflection are computed by numerical Macaulay integration over 1000 points. Supports form the boundary conditions; reactions are solved by ΣM = 0 and ΣF = 0.

**Triangular loads** — decomposed into uniform + linear parts for analytic shear/moment contributions.

**Internal hinge** — right-segment moment equilibrium gives `Rb = -M_right(xh) / (b - xh)`, then `Ra = -ΣF - Rb`. The ILD is hinge-aware: for `p > x_hinge`, `Rb = (p - x_hinge) / (b - x_hinge)`.

**Matrix Stiffness (truss)** — local stiffness assembled into global K, boundary conditions applied by DOF deletion, solved with partial-pivot Gaussian elimination. Node displacements back-calculated; member forces via `F = (EA/L) * [cos θ, sin θ] · Δu`.

**ILD sign convention** — Müller-Breslau: `Ra = (b-p)/L`, `Rb = (p-a)/L` for a unit downward load at p. Shear ordinate at x₀: `Ra − (1 if p < x₀)`.

---

## Contributing

1. Fork the repo
2. Create your branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a pull request

---

## License

MIT © 2025
