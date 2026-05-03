/**
 * 2D Matrix Stiffness Method for pin-jointed trusses.
 * Supports explicit pin/roller node selection and returns node displacements.
 */

export function generateTruss(type, span, height, bays) {
  const nodes = [];
  const members = [];
  const dx = span / bays;
  let nodeId = 0;

  // Bottom chord
  for (let i = 0; i <= bays; i++) nodes.push({ id: nodeId++, x: i * dx, y: 0 });

  if (type === 'warren') {
    for (let i = 0; i < bays; i++) nodes.push({ id: nodeId++, x: (i + 0.5) * dx, y: height });
  } else {
    for (let i = 0; i <= bays; i++) nodes.push({ id: nodeId++, x: i * dx, y: height });
  }

  const bottom = nodes.filter((n) => n.y === 0);
  const top = nodes.filter((n) => n.y === height);

  // Bottom chord
  for (let i = 0; i < bottom.length - 1; i++)
    members.push({ id: members.length, nodeA: bottom[i].id, nodeB: bottom[i + 1].id });

  if (type === 'warren') {
    for (let i = 0; i < top.length - 1; i++)
      members.push({ id: members.length, nodeA: top[i].id, nodeB: top[i + 1].id });
    for (let i = 0; i < top.length; i++) {
      members.push({ id: members.length, nodeA: bottom[i].id, nodeB: top[i].id });
      members.push({ id: members.length, nodeA: bottom[i + 1].id, nodeB: top[i].id });
    }
  } else {
    // Top chord
    for (let i = 0; i < top.length - 1; i++)
      members.push({ id: members.length, nodeA: top[i].id, nodeB: top[i + 1].id });
    // Verticals
    for (let i = 0; i <= bays; i++)
      members.push({ id: members.length, nodeA: bottom[i].id, nodeB: top[i].id });
    // Diagonals
    const half = Math.floor(bays / 2);
    for (let i = 0; i < bays; i++) {
      if (type === 'pratt') {
        if (i < half) members.push({ id: members.length, nodeA: bottom[i].id, nodeB: top[i + 1].id });
        else members.push({ id: members.length, nodeA: bottom[i + 1].id, nodeB: top[i].id });
      } else {
        // Howe
        if (i < half) members.push({ id: members.length, nodeA: bottom[i + 1].id, nodeB: top[i].id });
        else members.push({ id: members.length, nodeA: bottom[i].id, nodeB: top[i + 1].id });
      }
    }
  }

  return { nodes, members };
}

// ---------------------------------------------------------------------------
// Core solver — accepts explicit pinNodeId / rollerNodeId
// ---------------------------------------------------------------------------

export function solveTruss(nodes, members, loads, A = 0.01, E = 200e9, pinNodeId = null, rollerNodeId = null) {
  const nNodes = nodes.length;
  const nDOF = nNodes * 2;
  const nodeIndex = {};
  nodes.forEach((n, i) => { nodeIndex[n.id] = i; });

  // Fallback to leftmost/rightmost if not specified
  const sortedByX = [...nodes].sort((a, b) => a.x - b.x);
  const pinNode = pinNodeId != null
    ? nodes.find((n) => n.id === pinNodeId) || sortedByX[0]
    : sortedByX[0];
  const rollerNode = rollerNodeId != null
    ? nodes.find((n) => n.id === rollerNodeId) || sortedByX[sortedByX.length - 1]
    : sortedByX[sortedByX.length - 1];

  // Build global stiffness
  const K = Array.from({ length: nDOF }, () => new Array(nDOF).fill(0));
  const memberData = members.map((m) => {
    const ni = nodes[nodeIndex[m.nodeA]];
    const nj = nodes[nodeIndex[m.nodeB]];
    const ddx = nj.x - ni.x;
    const ddy = nj.y - ni.y;
    const L = Math.sqrt(ddx * ddx + ddy * ddy);
    const c = ddx / L, s = ddy / L;
    const k = (A * E) / L;
    const dofs = [nodeIndex[m.nodeA] * 2, nodeIndex[m.nodeA] * 2 + 1,
                  nodeIndex[m.nodeB] * 2, nodeIndex[m.nodeB] * 2 + 1];
    const kl = [
      [ c*c,  c*s, -c*c, -c*s],
      [ c*s,  s*s, -c*s, -s*s],
      [-c*c, -c*s,  c*c,  c*s],
      [-c*s, -s*s,  c*s,  s*s],
    ];
    for (let r = 0; r < 4; r++)
      for (let col = 0; col < 4; col++)
        K[dofs[r]][dofs[col]] += k * kl[r][col];
    return { ...m, L, c, s, k, nodeI: nodeIndex[m.nodeA], nodeJ: nodeIndex[m.nodeB] };
  });

  // Force vector
  const F = new Array(nDOF).fill(0);
  for (const load of loads) {
    const idx = nodeIndex[load.nodeId];
    if (idx === undefined) continue;
    F[idx * 2] += load.fx || 0;
    F[idx * 2 + 1] += load.fy || 0;
  }

  // Boundary conditions (penalty method)
  const penalty = 1e15;
  const pinIdx = nodeIndex[pinNode.id];
  const rollerIdx = nodeIndex[rollerNode.id];
  const fixedDOFs = [pinIdx * 2, pinIdx * 2 + 1, rollerIdx * 2 + 1];
  for (const dof of fixedDOFs) K[dof][dof] += penalty;

  const U = gaussElimination(K, F);

  // Node displacements
  const nodeDisplacements = nodes.map((n) => ({
    nodeId: n.id,
    x: n.x,
    y: n.y,
    ux: U[nodeIndex[n.id] * 2],
    uy: U[nodeIndex[n.id] * 2 + 1],
  }));

  // Member forces
  const memberForces = memberData.map((m) => {
    const ux_i = U[m.nodeI * 2], uy_i = U[m.nodeI * 2 + 1];
    const ux_j = U[m.nodeJ * 2], uy_j = U[m.nodeJ * 2 + 1];
    const force = m.k * (m.c * (ux_j - ux_i) + m.s * (uy_j - uy_i));
    return { ...m, force };
  });

  return { displacements: U, memberForces, nodeDisplacements };
}

// ---------------------------------------------------------------------------
// Truss ILD — unit load traverses bottom chord nodes, records member force
// ---------------------------------------------------------------------------

export function computeTrussILD(nodes, members, memberId, A = 0.01, E = 200e9, pinNodeId = null, rollerNodeId = null) {
  const bottomNodes = [...nodes].filter((n) => n.y === Math.min(...nodes.map((nn) => nn.y)))
    .sort((a, b) => a.x - b.x);

  const result = [];
  for (const bn of bottomNodes) {
    const unitLoad = [{ id: -1, nodeId: bn.id, fx: 0, fy: -1 }];
    const { memberForces } = solveTruss(nodes, members, unitLoad, A, E, pinNodeId, rollerNodeId);
    const mf = memberForces.find((m) => m.id === memberId);
    result.push({ x: bn.x, value: mf ? +mf.force.toFixed(6) : 0, nodeId: bn.id });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Gaussian elimination
// ---------------------------------------------------------------------------

function gaussElimination(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let maxRow = col;
    for (let row = col + 1; row < n; row++)
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    [M[col], M[maxRow]] = [M[maxRow], M[col]];
    if (Math.abs(M[col][col]) < 1e-12) continue;
    for (let row = col + 1; row < n; row++) {
      const f = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) M[row][k] -= f * M[col][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) x[i] -= M[i][j] * x[j];
    x[i] /= M[i][i] || 1e-12;
  }
  return x;
}
