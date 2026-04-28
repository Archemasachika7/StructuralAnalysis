/**
 * Beam solver: Macaulay / numerical integration approach.
 * Supports: UDL, point loads, triangular loads, custom function loads,
 *           applied moments, internal hinges.
 */

// ---------------------------------------------------------------------------
// Distributed load helpers
// ---------------------------------------------------------------------------

/** Cumulative shear (integral of w from 0 to x) for a triangular load [x1,x2,w1,w2] */
function triShearAt(x, x1, x2, w1, w2) {
  if (x <= x1) return 0;
  const dx = x2 - x1;
  if (x >= x2) return (w1 + w2) / 2 * dx;
  const t = x - x1;
  return w1 * t + (w2 - w1) * t * t / (2 * dx);
}

/** Moment of triangular load about point 'a' (for reaction calculation) */
function triMomentAbout(a, x1, x2, w1, w2) {
  const dx = x2 - x1;
  const totalForce = (w1 + w2) / 2 * dx;
  let centroid;
  if (Math.abs(w1 + w2) < 1e-12) {
    centroid = (x1 + x2) / 2;
  } else {
    centroid = x1 + dx * (2 * w2 + w1) / (3 * (w1 + w2));
  }
  return totalForce * (centroid - a);
}

/** Evaluate a custom load expression safely */
function evalCustomLoad(expr, x) {
  try {
    // eslint-disable-next-line no-new-func
    return new Function('x', `"use strict"; try { return (${expr}); } catch(e){ return 0; }`)(x);
  } catch {
    return 0;
  }
}

/** Cumulative shear for a custom load from x1 to x using N-point trapezoidal */
function customShearAt(x, x1, x2, expr, N = 200) {
  if (x <= x1) return 0;
  const upper = Math.min(x, x2);
  const n = Math.max(4, Math.round(N * (upper - x1) / (x2 - x1 || 1)));
  const h = (upper - x1) / n;
  let sum = (evalCustomLoad(expr, x1) + evalCustomLoad(expr, upper)) / 2;
  for (let i = 1; i < n; i++) sum += evalCustomLoad(expr, x1 + i * h);
  return sum * h;
}

function customMomentAbout(a, x1, x2, expr, N = 200) {
  const n = N;
  const h = (x2 - x1) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const xi = x1 + i * h;
    const w = (i === 0 || i === n) ? 0.5 : 1;
    sum += w * evalCustomLoad(expr, xi) * (xi - a);
  }
  return sum * h;
}

// ---------------------------------------------------------------------------
// Reaction solver
// ---------------------------------------------------------------------------

/**
 * Solve reactions for a beam with 2 supports + optional internal hinge.
 * hinge: { x } — position of internal hinge (moment release).
 * With a hinge, we split the beam at xh and use ΣM=0 on the shorter segment.
 */
function solveReactions(supports, pointLoads, udls, triLoads, customLoads, moments, hinge) {
  const sorted = [...supports].sort((a, b) => a.x - b.x);
  const supA = sorted[0];
  const supB = sorted[sorted.length - 1];
  const a = supA.x;
  const b = supB.x;
  const L = b - a;
  if (L < 1e-10) throw new Error('Support span too small');

  // Helper: net vertical load between positions left and right
  const loadsBetween = (left, right) => {
    let V = 0;
    for (const pl of pointLoads) {
      if (pl.x > left && pl.x <= right) V += pl.magnitude;
    }
    for (const u of udls) {
      const s = Math.max(u.x1, left), e = Math.min(u.x2, right);
      if (e > s) V += u.magnitude * (e - s);
    }
    for (const tl of triLoads) {
      const s = Math.max(tl.x1, left), e = Math.min(tl.x2, right);
      if (e > s) {
        const t1 = (s - tl.x1) / (tl.x2 - tl.x1 || 1);
        const t2 = (e - tl.x1) / (tl.x2 - tl.x1 || 1);
        const w1e = tl.w1 + (tl.w2 - tl.w1) * t1;
        const w2e = tl.w1 + (tl.w2 - tl.w1) * t2;
        V += (w1e + w2e) / 2 * (e - s);
      }
    }
    for (const cl of customLoads) {
      const s = Math.max(cl.x1, left), e = Math.min(cl.x2, right);
      if (e > s) V += customShearAt(e, s, e, cl.expr);
    }
    return V;
  };

  // Moment about point 'pivot' of all loads
  const momentAbout = (pivot) => {
    let M = 0;
    for (const pl of pointLoads) M += pl.magnitude * (pl.x - pivot);
    for (const u of udls) {
      const s = Math.max(u.x1, a), e = Math.min(u.x2, b);
      if (e > s) {
        const len = e - s;
        M += u.magnitude * len * ((s + e) / 2 - pivot);
      }
    }
    for (const tl of triLoads) M += triMomentAbout(pivot, tl.x1, tl.x2, tl.w1, tl.w2);
    for (const cl of customLoads) M += customMomentAbout(pivot, cl.x1, cl.x2, cl.expr);
    for (const m of moments) M += m.magnitude;
    return M;
  };

  let Ra, Rb;

  if (hinge) {
    const xh = hinge.x;
    // Moment of all loads on [xh, b] about xh = Rb*(b-xh)  →  Rb = that moment / (b-xh)
    const momentRightAboutHinge = (() => {
      let M = 0;
      for (const pl of pointLoads) {
        if (pl.x > xh && pl.x <= b) M += pl.magnitude * (pl.x - xh);
      }
      for (const u of udls) {
        const s = Math.max(u.x1, xh), e = Math.min(u.x2, b);
        if (e > s) M += u.magnitude * (e - s) * ((s + e) / 2 - xh);
      }
      for (const tl of triLoads) {
        const s = Math.max(tl.x1, xh), e = Math.min(tl.x2, b);
        if (e > s) M += triMomentAbout(xh, s, e, tl.w1, tl.w2);
      }
      for (const cl of customLoads) {
        const s = Math.max(cl.x1, xh), e = Math.min(cl.x2, b);
        if (e > s) M += customMomentAbout(xh, s, e, cl.expr);
      }
      // Applied moments on right segment
      for (const m of moments) {
        if (m.x > xh) M += m.magnitude;
      }
      return M;
    })();
    Rb = -momentRightAboutHinge / (b - xh);
    // Global ΣFy = 0
    const totalLoad = loadsBetween(-Infinity, Infinity);
    Ra = -totalLoad - Rb;
  } else {
    Rb = -momentAbout(a) / L;
    const totalLoad = loadsBetween(-Infinity, Infinity);
    Ra = -totalLoad - Rb;
  }

  return [
    { id: supA.id, x: a, reaction: Ra },
    { id: supB.id, x: b, reaction: Rb },
  ];
}

// ---------------------------------------------------------------------------
// Main solver
// ---------------------------------------------------------------------------

export function solveBeam(beam) {
  const {
    span, E, I, supports,
    pointLoads = [], udls = [], triangularLoads = [],
    customLoads = [], moments = [], hinges = [],
  } = beam;
  if (!supports || supports.length < 2) return null;

  const hinge = hinges.length > 0 ? hinges[0] : null;

  let reactions;
  try {
    reactions = solveReactions(supports, pointLoads, udls, triangularLoads, customLoads, moments, hinge);
  } catch {
    return null;
  }

  const N = 500;
  const dx = span / N;
  const xArr = Array.from({ length: N + 1 }, (_, i) => +(i * dx).toFixed(6));

  const shear = new Array(N + 1).fill(0);
  const moment = new Array(N + 1).fill(0);

  for (let i = 0; i <= N; i++) {
    const x = xArr[i];
    let V = 0;

    for (const r of reactions) if (x >= r.x) V += r.reaction;
    for (const pl of pointLoads) if (x > pl.x) V += pl.magnitude;
    for (const u of udls) {
      const covered = Math.min(x, u.x2) - Math.min(x, u.x1);
      if (covered > 0) V += u.magnitude * covered;
    }
    for (const tl of triangularLoads) V += triShearAt(x, tl.x1, tl.x2, tl.w1, tl.w2);
    for (const cl of customLoads) V += customShearAt(x, cl.x1, cl.x2, cl.expr);

    shear[i] = V;
  }

  for (let i = 1; i <= N; i++) {
    moment[i] = moment[i - 1] + 0.5 * (shear[i - 1] + shear[i]) * dx;
    for (const m of moments) {
      if (xArr[i - 1] < m.x && m.x <= xArr[i]) moment[i] += m.magnitude;
    }
    // Enforce hinge: M = 0 just after hinge position
    if (hinge && xArr[i - 1] < hinge.x && hinge.x <= xArr[i]) {
      moment[i] = 0;
    }
  }

  const EI = E * I;
  const slope = new Array(N + 1).fill(0);
  const deflection = new Array(N + 1).fill(0);

  for (let i = 1; i <= N; i++) {
    slope[i] = slope[i - 1] + 0.5 * (moment[i - 1] + moment[i]) * dx;
  }

  const sortedSupports = [...supports].sort((a, b) => a.x - b.x);
  const leftX = sortedSupports[0].x;
  const rightX = sortedSupports[sortedSupports.length - 1].x;
  const iLeft = Math.round(leftX / dx);
  const iRight = Math.round(rightX / dx);

  for (let i = 1; i <= N; i++) {
    deflection[i] = deflection[i - 1] + 0.5 * (slope[i - 1] + slope[i]) * dx;
  }
  const C1 = -deflection[iLeft];
  for (let i = 0; i <= N; i++) deflection[i] += C1;
  const slopeCorrection = -deflection[iRight] / (rightX - leftX || 1);
  for (let i = 0; i <= N; i++) deflection[i] += slopeCorrection * (xArr[i] - leftX);

  const deflArr = deflection.map((d) => d / EI);

  const data = xArr.map((x, i) => ({
    x: +x.toFixed(4),
    shear: +shear[i].toFixed(4),
    moment: +moment[i].toFixed(4),
    deflection: +deflArr[i].toFixed(8),
  }));

  return {
    reactions,
    data,
    maxShear: Math.max(...shear.map(Math.abs)),
    maxMoment: Math.max(...moment.map(Math.abs)),
    maxDeflection: Math.max(...deflArr.map(Math.abs)),
  };
}

// ---------------------------------------------------------------------------
// ILD solver — supports internal hinge
// ---------------------------------------------------------------------------

export function computeILD(beam, x0, ildType = 'shear') {
  const {
    span, supports,
    udls = [], triangularLoads = [], customLoads = [], moments = [],
    hinges = [],
  } = beam;

  const sortedSupports = [...supports].sort((a, b) => a.x - b.x);
  const a = sortedSupports[0].x;
  const b = sortedSupports[sortedSupports.length - 1].x;
  const L = b - a;
  const hinge = hinges.length > 0 ? hinges[0] : null;

  const N = 300;
  const dx = span / N;
  const result = [];

  for (let i = 0; i <= N; i++) {
    const p = i * dx; // unit load position

    let Ra, Rb;

    if (hinge) {
      const xh = hinge.x;
      // Moment of unit load on right segment about hinge
      const unitOnRight = p > xh && p <= b ? -(p - xh) : 0;
      Rb = -unitOnRight / (b - xh);
      Ra = -1 - Rb;
    } else {
      Rb = -(p - a) / L;
      Ra = -1 - Rb;
    }

    // Value at x0 from left
    let val;
    if (ildType === 'shear') {
      let V = Ra;
      if (p < x0) V += -1;
      val = V;
    } else {
      let M = Ra * (x0 - a);
      if (p < x0) M += -(x0 - p);
      val = M;
    }

    result.push({ x: +p.toFixed(4), value: +val.toFixed(6) });
  }

  return result;
}
