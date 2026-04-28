/**
 * 2D Matrix Stiffness Method for pin-jointed trusses.
 * Each node has 2 DOFs (u, v). Global stiffness assembled from member stiffnesses.
 */

/** Generate nodes and members for standard truss types */
export function generateTruss(type, span, height, bays) {
  const nodes = [];
  const members = [];
  const dx = span / bays;
  let nodeId = 0;

  if (type === 'pratt' || type === 'howe' || type === 'warren') {
    // Bottom chord nodes
    for (let i = 0; i <= bays; i++) {
      nodes.push({ id: nodeId++, x: i * dx, y: 0 });
    }
    // Top chord nodes
    if (type === 'warren') {
      // Warren: top nodes at midpoints between bottom
      for (let i = 0; i < bays; i++) {
        nodes.push({ id: nodeId++, x: (i + 0.5) * dx, y: height });
      }
    } else {
      for (let i = 0; i <= bays; i++) {
        nodes.push({ id: nodeId++, x: i * dx, y: height });
      }
    }

    const bottom = nodes.filter((n) => n.y === 0);
    const top = nodes.filter((n) => n.y === height);
    const nb = bottom.length;

    // Bottom chord members
    for (let i = 0; i < nb - 1; i++) {
      members.push({ id: members.length, nodeA: bottom[i].id, nodeB: bottom[i + 1].id });
    }

    if (type === 'warren') {
      // Top chord
      for (let i = 0; i < top.length - 1; i++) {
        members.push({ id: members.length, nodeA: top[i].id, nodeB: top[i + 1].id });
      }
      // Diagonals
      for (let i = 0; i < top.length; i++) {
        members.push({ id: members.length, nodeA: bottom[i].id, nodeB: top[i].id });
        members.push({ id: members.length, nodeA: bottom[i + 1].id, nodeB: top[i].id });
      }
    } else {
      // Top chord
      for (let i = 0; i < top.length - 1; i++) {
        members.push({ id: members.length, nodeA: top[i].id, nodeB: top[i + 1].id });
      }
      // Verticals
      for (let i = 0; i <= bays; i++) {
        members.push({ id: members.length, nodeA: bottom[i].id, nodeB: top[i].id });
      }
      // Diagonals
      for (let i = 0; i < bays; i++) {
        if (type === 'pratt') {
          // Pratt: diagonals slope toward center from supports
          const half = Math.floor(bays / 2);
          if (i < half) {
            members.push({ id: members.length, nodeA: bottom[i].id, nodeB: top[i + 1].id });
          } else {
            members.push({ id: members.length, nodeA: bottom[i + 1].id, nodeB: top[i].id });
          }
        } else {
          // Howe: opposite diagonals
          const half = Math.floor(bays / 2);
          if (i < half) {
            members.push({ id: members.length, nodeA: bottom[i + 1].id, nodeB: top[i].id });
          } else {
            members.push({ id: members.length, nodeA: bottom[i].id, nodeB: top[i + 1].id });
          }
        }
      }
    }
  }

  return { nodes, members };
}

/** Solve truss using direct stiffness method */
export function solveTruss(nodes, members, loads, A = 0.01, E = 200e9) {
  const nNodes = nodes.length;
  const nDOF = nNodes * 2;
  const nodeIndex = {};
  nodes.forEach((n, i) => { nodeIndex[n.id] = i; });

  // Global stiffness matrix
  const K = Array.from({ length: nDOF }, () => new Array(nDOF).fill(0));

  const memberData = members.map((m) => {
    const ni = nodes[nodeIndex[m.nodeA]];
    const nj = nodes[nodeIndex[m.nodeB]];
    const dx = nj.x - ni.x;
    const dy = nj.y - ni.y;
    const L = Math.sqrt(dx * dx + dy * dy);
    const c = dx / L;
    const s = dy / L;
    const k = (A * E) / L;

    // Local stiffness contribution
    const dofs = [nodeIndex[m.nodeA] * 2, nodeIndex[m.nodeA] * 2 + 1,
                  nodeIndex[m.nodeB] * 2, nodeIndex[m.nodeB] * 2 + 1];
    const kLocal = [
      [ c*c,  c*s, -c*c, -c*s],
      [ c*s,  s*s, -c*s, -s*s],
      [-c*c, -c*s,  c*c,  c*s],
      [-c*s, -s*s,  c*s,  s*s],
    ];

    for (let r = 0; r < 4; r++) {
      for (let col = 0; col < 4; col++) {
        K[dofs[r]][dofs[col]] += k * kLocal[r][col];
      }
    }

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

  // Boundary conditions: fix DOFs for supports
  // Left node (min x) = pin (fix x and y), right node (max x) = roller (fix y only)
  const sortedByX = [...nodes].sort((a, b) => a.x - b.x);
  const leftNode = sortedByX[0];
  const rightNode = sortedByX[sortedByX.length - 1];
  const fixedDOFs = [
    nodeIndex[leftNode.id] * 2,
    nodeIndex[leftNode.id] * 2 + 1,
    nodeIndex[rightNode.id] * 2 + 1,
  ];

  // Apply boundary conditions (penalty method for simplicity)
  const penalty = 1e15;
  for (const dof of fixedDOFs) {
    K[dof][dof] += penalty;
  }

  // Solve K * U = F using Gaussian elimination
  const U = gaussElimination(K, F);

  // Calculate member forces
  const memberForces = memberData.map((m) => {
    const ui = U[m.nodeI * 2];
    const vi = U[m.nodeI * 2 + 1];
    const uj = U[m.nodeJ * 2];
    const vj = U[m.nodeJ * 2 + 1];
    const force = m.k * (m.c * (uj - ui) + m.s * (vj - vi));
    return { ...m, force };
  });

  return { displacements: U, memberForces };
}

function gaussElimination(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > Math.abs(M[maxRow][col])) maxRow = row;
    }
    [M[col], M[maxRow]] = [M[maxRow], M[col]];

    if (Math.abs(M[col][col]) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let k = col; k <= n; k++) {
        M[row][k] -= factor * M[col][k];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n];
    for (let j = i + 1; j < n; j++) {
      x[i] -= M[i][j] * x[j];
    }
    x[i] /= M[i][i] || 1e-12;
  }
  return x;
}
