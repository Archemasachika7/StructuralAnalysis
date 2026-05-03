/**
 * Beam solver — Macaulay / numerical integration.
 * Sign convention: upward reactions = +, downward loads = −.
 */

// ─────────────────────────────────────────────────────────── distributed loads
function triShearAt(x, x1, x2, w1, w2) {
  if (x <= x1) return 0;
  const dx = x2 - x1;
  if (x >= x2) return (w1 + w2) / 2 * dx;
  const t = x - x1;
  return w1 * t + (w2 - w1) * t * t / (2 * dx);
}

function triMomentAbout(pivot, x1, x2, w1, w2) {
  const dx = x2 - x1;
  const total = (w1 + w2) / 2 * dx;
  const centroid = Math.abs(w1 + w2) < 1e-12
    ? (x1 + x2) / 2
    : x1 + dx * (2 * w2 + w1) / (3 * (w1 + w2));
  return total * (centroid - pivot);
}

function evalExpr(expr, x) {
  try {
    // eslint-disable-next-line no-new-func
    return new Function('x', `"use strict";return (${expr})`)(x) || 0;
  } catch { return 0; }
}

function customShearAt(x, x1, x2, expr) {
  if (x <= x1) return 0;
  const upper = Math.min(x, x2);
  const n = 100;
  const h = (upper - x1) / n;
  let sum = (evalExpr(expr, x1) + evalExpr(expr, upper)) / 2;
  for (let i = 1; i < n; i++) sum += evalExpr(expr, x1 + i * h);
  return sum * h;
}

function customMomentAbout(pivot, x1, x2, expr) {
  const n = 100;
  const h = (x2 - x1) / n;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const xi = x1 + i * h;
    sum += (i === 0 || i === n ? 0.5 : 1) * evalExpr(expr, xi) * (xi - pivot);
  }
  return sum * h;
}

// ─────────────────────────────────────────────────────────── reaction solver
function solveReactions(supports, pointLoads, udls, triLoads, customLoads, moments, hinge) {
  const sorted = [...supports].sort((a, b) => a.x - b.x);
  const supA = sorted[0], supB = sorted[sorted.length - 1];
  const a = supA.x, b = supB.x;
  const L = b - a;
  if (L < 1e-10) throw new Error('Support span too small');

  // Total vertical load (no clipping — loads can be anywhere)
  function totalLoad() {
    let V = 0;
    for (const pl of pointLoads) V += pl.magnitude;
    for (const u of udls) V += u.magnitude * (u.x2 - u.x1);
    for (const tl of triLoads) V += (tl.w1 + tl.w2) / 2 * (tl.x2 - tl.x1);
    for (const cl of customLoads) V += customShearAt(cl.x2, cl.x1, cl.x2, cl.expr);
    return V;
  }

  // Moment of all loads about pivot
  function momentAbout(pivot) {
    let M = 0;
    for (const pl of pointLoads) M += pl.magnitude * (pl.x - pivot);
    for (const u of udls) M += u.magnitude * (u.x2 - u.x1) * ((u.x1 + u.x2) / 2 - pivot);
    for (const tl of triLoads) M += triMomentAbout(pivot, tl.x1, tl.x2, tl.w1, tl.w2);
    for (const cl of customLoads) M += customMomentAbout(pivot, cl.x1, cl.x2, cl.expr);
    for (const m of moments) M += m.magnitude;
    return M;
  }

  // Moment of loads on segment (xh, b) about xh  — used for hinge condition
  function momentRightOfHinge(xh) {
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
    for (const m of moments) {
      if (m.x > xh) M += m.magnitude;
    }
    return M;
  }

  let Ra, Rb;
  if (hinge) {
    // ΣM about hinge for right segment = 0  →  Rb*(b-xh) = −momentRight
    Rb = -momentRightOfHinge(hinge.x) / (b - hinge.x);
    Ra = -totalLoad() - Rb;
  } else {
    // ΣM about A = 0  →  Rb*L = −momentAbout(a)
    Rb = -momentAbout(a) / L;
    Ra = -totalLoad() - Rb;
  }

  return [
    { id: supA.id, x: a, reaction: Ra },
    { id: supB.id, x: b, reaction: Rb },
  ];
}

// ─────────────────────────────────────────────────────────── main beam solver
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
  } catch { return null; }

  const N = 500;
  const dx = span / N;
  const xArr = Array.from({ length: N + 1 }, (_, i) => +(i * dx).toFixed(6));

  // ── shear
  const shear = new Array(N + 1).fill(0);
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

  // ── moment (integrate shear)
  const moment = new Array(N + 1).fill(0);
  for (let i = 1; i <= N; i++) {
    moment[i] = moment[i - 1] + 0.5 * (shear[i - 1] + shear[i]) * dx;
    for (const m of moments) {
      if (xArr[i - 1] < m.x && m.x <= xArr[i]) moment[i] += m.magnitude;
    }
    // Enforce hinge: zero moment just after hinge
    if (hinge && xArr[i - 1] < hinge.x && hinge.x <= xArr[i]) moment[i] = 0;
  }

  // ── deflection (double-integrate moment / EI)
  const EI = E * I;
  const theta = new Array(N + 1).fill(0); // EI·θ
  const defl  = new Array(N + 1).fill(0); // EI·y
  for (let i = 1; i <= N; i++) {
    theta[i] = theta[i - 1] + 0.5 * (moment[i - 1] + moment[i]) * dx;
    defl[i]  = defl[i - 1]  + 0.5 * (theta[i - 1] + theta[i]) * dx;
  }
  const ss = [...supports].sort((a, b) => a.x - b.x);
  const iL = Math.round(ss[0].x / dx);
  const iR = Math.round(ss[ss.length - 1].x / dx);
  const C1 = -defl[iL];
  for (let i = 0; i <= N; i++) defl[i] += C1;
  const slope = -(defl[iR]) / (ss[ss.length - 1].x - ss[0].x || 1);
  for (let i = 0; i <= N; i++) defl[i] += slope * (xArr[i] - ss[0].x);
  const deflArr = defl.map((d) => d / EI);

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

// ─────────────────────────────────────────────────────────── ILD solver
/**
 * Compute ILD for shear or moment at x0.
 * Unit downward load (magnitude = −1) traverses the span from 0 to span.
 * Reactions use proper sign convention:
 *   Ra = (b − p) / L  [upward],  Rb = (p − a) / L  [upward]
 */
export function computeILD(beam, x0, ildType = 'shear') {
  const { span, supports, hinges = [] } = beam;
  const ss = [...supports].sort((a, b) => a.x - b.x);
  const a = ss[0].x;
  const b = ss[ss.length - 1].x;
  const L = b - a;
  const hinge = hinges.length > 0 ? hinges[0] : null;

  const N = 300;
  const dx = span / N;
  const result = [];

  for (let i = 0; i <= N; i++) {
    const p = i * dx; // unit-load position

    let Ra, Rb;
    if (hinge) {
      const xh = hinge.x;
      // Unit load in right segment (p > xh): ΣMxh for right → Rb*(b−xh) = (p−xh)
      if (p > xh) {
        Rb = (p - xh) / (b - xh);
        Ra = 1 - Rb;
      } else {
        Rb = 0;
        Ra = 1;
      }
    } else {
      // Standard: ΣMa → Rb*L = (p−a)
      Rb = (p - a) / L;
      Ra = 1 - Rb;
    }

    let val;
    if (ildType === 'shear') {
      // V at x0 from the left = Ra − [1 if p < x0]
      val = Ra - (p < x0 ? 1 : 0);
    } else {
      // M at x0 = Ra*(x0−a) − (x0−p) if p < x0
      val = Ra * (x0 - a) - (p < x0 ? (x0 - p) : 0);
    }

    result.push({ x: +p.toFixed(4), value: +val.toFixed(6) });
  }

  return result;
}
