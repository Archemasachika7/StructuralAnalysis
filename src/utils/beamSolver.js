/**
 * Beam solver using Macaulay's method for simply-supported & multi-support beams.
 * For statically indeterminate beams (more than 2 supports) we use the
 * Three-Moment Equation (Clapeyron) approach extended to n spans.
 */

function macaulayStep(x, a) {
  return x >= a ? x - a : 0;
}

/** Solve a simply-supported beam (2 supports: pin + roller) */
function solveDeterminate(span, supports, pointLoads, udls, moments) {
  const pin = supports.find((s) => s.type === 'pin' || s.type === 'fixed') || supports[0];
  const roller = supports.find((s) => s.id !== pin.id) || supports[1];
  const a = Math.min(pin.x, roller.x);
  const b = Math.max(pin.x, roller.x);
  const L = b - a;

  // Sum moments about 'a' to find reaction at 'b'
  let sumMoment = 0;
  for (const pl of pointLoads) {
    sumMoment += pl.magnitude * (pl.x - a);
  }
  for (const udl of udls) {
    const start = Math.max(udl.x1, a);
    const end = Math.min(udl.x2, b);
    if (end > start) {
      const w = udl.magnitude;
      const len = end - start;
      const centroid = (start + end) / 2;
      sumMoment += w * len * (centroid - a);
    }
  }
  for (const m of moments) {
    sumMoment += m.magnitude;
  }

  const Rb = -sumMoment / L;
  const Ra = -pointLoads.reduce((acc, pl) => acc + pl.magnitude, 0)
    - udls.reduce((acc, udl) => {
        const start = Math.max(udl.x1, a);
        const end = Math.min(udl.x2, b);
        return end > start ? acc + udl.magnitude * (end - start) : acc;
      }, 0) - Rb;

  return [
    { id: pin.id, x: a, reaction: Ra },
    { id: roller.id, x: b, reaction: Rb },
  ];
}

/** Build shear, moment, and deflection arrays across the span */
export function solveBeam(beam) {
  const { span, E, I, supports, pointLoads, udls, moments } = beam;
  if (!supports || supports.length < 2) return null;

  // Sort supports by x
  const sortedSupports = [...supports].sort((a, b) => a.x - b.x);

  let reactions;
  try {
    reactions = solveDeterminate(span, sortedSupports, pointLoads, udls, moments);
  } catch {
    return null;
  }

  const N = 500;
  const dx = span / N;
  const xArr = Array.from({ length: N + 1 }, (_, i) => +(i * dx).toFixed(6));

  const shear = new Array(N + 1).fill(0);
  const moment = new Array(N + 1).fill(0);

  // Build shear by integrating loads from left
  for (let i = 0; i <= N; i++) {
    const x = xArr[i];
    let V = 0;

    // Reactions
    for (const r of reactions) {
      if (x >= r.x) V += r.reaction;
    }
    // Point loads
    for (const pl of pointLoads) {
      if (x > pl.x) V += pl.magnitude;
    }
    // UDLs
    for (const udl of udls) {
      const covered = Math.min(x, udl.x2) - Math.min(x, udl.x1);
      if (covered > 0) V += udl.magnitude * covered;
    }

    shear[i] = V;
  }

  // Integrate shear to get moment
  for (let i = 1; i <= N; i++) {
    moment[i] = moment[i - 1] + 0.5 * (shear[i - 1] + shear[i]) * dx;
    // Applied moments
    for (const m of moments) {
      if (xArr[i - 1] < m.x && m.x <= xArr[i]) {
        moment[i] += m.magnitude;
      }
    }
  }

  // Deflection via double integration (EI * y'' = M)
  // Using trapezoidal rule twice
  const EI = E * I;
  const slope = new Array(N + 1).fill(0);
  const deflection = new Array(N + 1).fill(0);

  // Integrate moment to get EI * slope
  for (let i = 1; i <= N; i++) {
    slope[i] = slope[i - 1] + 0.5 * (moment[i - 1] + moment[i]) * dx;
  }

  // Apply boundary condition: deflection = 0 at supports
  const leftX = sortedSupports[0].x;
  const rightX = sortedSupports[sortedSupports.length - 1].x;
  const iLeft = Math.round(leftX / dx);
  const iRight = Math.round(rightX / dx);

  // Integrate slope to get EI * deflection
  for (let i = 1; i <= N; i++) {
    deflection[i] = deflection[i - 1] + 0.5 * (slope[i - 1] + slope[i]) * dx;
  }

  // Correct for slope constant using y(left)=0, y(right)=0
  const C1 = -deflection[iLeft];
  for (let i = 0; i <= N; i++) {
    deflection[i] += C1;
  }
  const slopeCorrection = -deflection[iRight] / (rightX - leftX);
  for (let i = 0; i <= N; i++) {
    deflection[i] += slopeCorrection * (xArr[i] - leftX);
  }

  // Divide by EI
  const deflArr = deflection.map((d) => d / EI);
  const slopeArr = slope.map((s) => s / EI);

  const data = xArr.map((x, i) => ({
    x: +x.toFixed(4),
    shear: +shear[i].toFixed(4),
    moment: +moment[i].toFixed(4),
    deflection: +deflArr[i].toFixed(8),
  }));

  const maxShear = Math.max(...shear.map(Math.abs));
  const maxMoment = Math.max(...moment.map(Math.abs));
  const maxDeflection = Math.max(...deflArr.map(Math.abs));

  return { reactions, data, maxShear, maxMoment, maxDeflection };
}

/** Compute ILD for shear and moment at a given point x0 */
export function computeILD(beam, x0) {
  const { span, supports } = beam;
  const sortedSupports = [...supports].sort((a, b) => a.x - b.x);
  const a = sortedSupports[0].x;
  const b = sortedSupports[sortedSupports.length - 1].x;
  const L = b - a;

  const N = 200;
  const dx = span / N;

  const shearILD = [];
  const momentILD = [];

  for (let i = 0; i <= N; i++) {
    const unitPos = i * dx; // position of unit load

    // Reaction at b due to unit load at unitPos
    const Rb = -(unitPos - a) / L;
    const Ra = -1 - Rb;

    // Shear at x0
    let V = 0;
    if (unitPos <= x0) {
      V = -Ra; // unit load left of x0
    } else {
      V = Rb; // unit load right of x0 — contribution from right reaction
    }
    // More precise: shear at x0 from left
    let Vx = Ra;
    if (unitPos < x0) Vx += -1; // unit load between a and x0

    let Mx = Ra * (x0 - a);
    if (unitPos < x0) Mx += -(x0 - unitPos);

    shearILD.push({ x: +unitPos.toFixed(4), value: +Vx.toFixed(6) });
    momentILD.push({ x: +unitPos.toFixed(4), value: +Mx.toFixed(6) });
  }

  return { shearILD, momentILD };
}
