import { NETWORK } from './constants.ts';
import { makeTexture } from './scene.ts';
import { AliceMode } from './types.ts';
import type { SceneState, BrainState, NetworkState, NetNode, AdjEntry, EdgeData, Spike, NearbyVert, AliceState } from './types.ts';

/** Build the epileptogenic network graph from brain surface vertices */
export function buildEpiNetwork(s: SceneState, brain: BrainState): NetworkState | null {
  if (!window.BRAIN) return null;
  const B = window.BRAIN;
  const nv = B.v.length / 3;
  const NET_NODES = s.isMobile ? NETWORK.NODES_MOBILE : NETWORK.NODES_DESKTOP;

  /* Sample network nodes from brain surface (stratified) */
  const nodes: NetNode[] = [];
  const stride = Math.floor(nv / NET_NODES);
  for (let i = 0; i < NET_NODES; i++) {
    const idx = (i * stride + Math.floor(Math.random() * stride * 0.4)) % nv;
    nodes.push({ x: B.v[idx * 3], y: B.v[idx * 3 + 1], z: B.v[idx * 3 + 2] });
  }

  /* Build K-nearest-neighbors graph (small-world topology) */
  const adj: AdjEntry[][] = Array.from({ length: NET_NODES }, () => []);
  const edgeSet = new Set<number>();
  const edgeData: EdgeData[] = [];

  for (let i = 0; i < NET_NODES; i++) {
    const dists: { j: number; d: number }[] = [];
    for (let j = 0; j < NET_NODES; j++) {
      if (i === j) continue;
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dz = nodes[i].z - nodes[j].z;
      dists.push({ j, d: Math.sqrt(dx * dx + dy * dy + dz * dz) });
    }
    dists.sort((a, b) => a.d - b.d);
    for (let k = 0; k < NETWORK.K_NEIGHBORS; k++) {
      const j = dists[k].j;
      const eKey = Math.min(i, j) * NET_NODES + Math.max(i, j);
      if (!edgeSet.has(eKey)) {
        edgeSet.add(eKey);
        const d = dists[k].d;
        adj[i].push({ n: j, d });
        adj[j].push({ n: i, d });
        edgeData.push({ from: i, to: j });
      }
    }
  }

  /* Add long-range connections */
  for (let i = 0; i < NETWORK.LONG_RANGE_CONNECTIONS; i++) {
    const a = Math.floor(Math.random() * NET_NODES);
    const b = Math.floor(Math.random() * NET_NODES);
    if (a === b) continue;
    const eKey = Math.min(a, b) * NET_NODES + Math.max(a, b);
    if (edgeSet.has(eKey)) continue;
    edgeSet.add(eKey);
    const dx = nodes[a].x - nodes[b].x;
    const dy = nodes[a].y - nodes[b].y;
    const dz = nodes[a].z - nodes[b].z;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    adj[a].push({ n: b, d });
    adj[b].push({ n: a, d });
    edgeData.push({ from: a, to: b });
  }

  /* Precompute nearby mesh vertices for each network node */
  const R = NETWORK.NEARBY_RADIUS;
  const R2 = R * R;
  const nodeMeshVerts: NearbyVert[][] = [];
  for (let ni = 0; ni < NET_NODES; ni++) {
    const nearby: NearbyVert[] = [];
    const nx = nodes[ni].x, ny = nodes[ni].y, nz = nodes[ni].z;
    for (let vi = 0; vi < brain.numVerts; vi++) {
      const dx = B.v[vi * 3] - nx;
      const dy = B.v[vi * 3 + 1] - ny;
      const dz = B.v[vi * 3 + 2] - nz;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < R2) {
        nearby.push({ vi, f: 1 - Math.sqrt(d2) / R });
      }
    }
    nodeMeshVerts.push(nearby);
  }

  /* Create node particles */
  const nodePos = new Float32Array(NET_NODES * 3);
  const nodeColors = new Float32Array(NET_NODES * 3);
  for (let i = 0; i < NET_NODES; i++) {
    nodePos[i * 3]     = nodes[i].x;
    nodePos[i * 3 + 1] = nodes[i].y;
    nodePos[i * 3 + 2] = nodes[i].z;
    nodeColors[i * 3]     = 0.0;
    nodeColors[i * 3 + 1] = 0.06;
    nodeColors[i * 3 + 2] = 0.12;
  }
  const nodeGeo = new THREE.BufferGeometry();
  nodeGeo.setAttribute('position', new THREE.BufferAttribute(nodePos, 3));
  nodeGeo.setAttribute('color', new THREE.BufferAttribute(nodeColors, 3));
  const nTex = makeTexture(64, 0.15);

  const nodePoints = new THREE.Points(nodeGeo, new THREE.PointsMaterial({
    size: 0.055, map: nTex, vertexColors: true,
    transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  s.brain.add(nodePoints);

  /* Outer glow layer for nodes */
  s.brain.add(new THREE.Points(nodeGeo, new THREE.PointsMaterial({
    size: 0.2, map: nTex, vertexColors: true,
    transparent: true, opacity: 0.1,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  })));

  /* Create edge lines */
  const nEdges = edgeData.length;
  const edgePos = new Float32Array(nEdges * 6);
  const edgeColors = new Float32Array(nEdges * 6);
  for (let i = 0; i < nEdges; i++) {
    const e = edgeData[i];
    edgePos[i * 6]     = nodes[e.from].x;
    edgePos[i * 6 + 1] = nodes[e.from].y;
    edgePos[i * 6 + 2] = nodes[e.from].z;
    edgePos[i * 6 + 3] = nodes[e.to].x;
    edgePos[i * 6 + 4] = nodes[e.to].y;
    edgePos[i * 6 + 5] = nodes[e.to].z;
    for (let c = 0; c < 6; c++) edgeColors[i * 6 + c] = 0.012;
  }
  const edgeGeo = new THREE.BufferGeometry();
  edgeGeo.setAttribute('position', new THREE.BufferAttribute(edgePos, 3));
  edgeGeo.setAttribute('color', new THREE.BufferAttribute(edgeColors, 3));
  const edgeLines = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.7,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  s.brain.add(edgeLines);

  const raycaster = new THREE.Raycaster();

  return {
    nodes, adj, spikes: [], edgeData, nodeMeshVerts,
    nodeColors, edgeColors, nodePoints, edgeLines, raycaster, NET_NODES,
  };
}

/** Trigger a spike from a seed node using BFS with distance-proportional delays */
export function triggerSpike(net: NetworkState, clock: THREE.Clock, isMobile: boolean): void {
  triggerSpikeAt(net, Math.floor(Math.random() * net.NET_NODES), clock, isMobile);
}

/** Trigger a spike at a specific node */
export function triggerSpikeAt(net: NetworkState, seed: number, clock: THREE.Clock, isMobile: boolean): void {
  const arrivals = new Float32Array(net.NET_NODES).fill(-1);
  arrivals[seed] = 0;

  const q = [seed];
  let head = 0;
  while (head < q.length) {
    const cur = q[head++];
    for (const { n, d } of net.adj[cur]) {
      if (arrivals[n] < 0) {
        arrivals[n] = arrivals[cur] + 0.04 + d * 0.12 + Math.random() * 0.02;
        q.push(n);
      }
    }
  }

  net.spikes.push({ start: clock.getElapsedTime(), arrivals, decay: NETWORK.SPIKE_DECAY });
  const maxSpikes = isMobile ? NETWORK.MAX_SPIKES_MOBILE : NETWORK.MAX_SPIKES_DESKTOP;
  if (net.spikes.length > maxSpikes) net.spikes.shift();
}

/** Per-frame update of epileptogenic network colors and brain surface glow */
export function updateEpiNetwork(
  net: NetworkState,
  brain: BrainState,
  elapsed: number,
  alice: AliceState
): void {
  if (!net.nodes.length) return;

  /* Reset mesh vertex colors to base */
  if (brain.meshColors && brain.baseColors) {
    const n = Math.min(brain.meshColors.length, brain.baseColors.length);
    for (let i = 0; i < n; i++) brain.meshColors[i] = brain.baseColors[i];
  }

  const isFocus = alice.mode > AliceMode.Off ? new Set(alice.focus) : null;
  const isTarget = alice.mode >= AliceMode.TargetsIdentified ? new Set(alice.targets) : null;

  for (let i = 0; i < net.NET_NODES; i++) {
    let r = 0.0, g = 0.05, b = 0.1;

    /* Subtle ambient pulse */
    const pulse = Math.sin(elapsed * 1.5 + i * 0.31) * 0.015 + 0.015;
    g += pulse;
    b += pulse * 1.5;

    /* Alice mode coloring */
    if (alice.mode >= AliceMode.TargetsIdentified && isTarget && isTarget.has(i)) {
      const targetPulse = Math.sin(elapsed * 3 + i * 0.5) * 0.15 + 0.85;
      r = 0.05;
      g = targetPulse * 1.2;
      b = targetPulse * 0.4;

      if (brain.meshColors) {
        const nearby = net.nodeMeshVerts[i];
        if (nearby) {
          for (let k = 0; k < nearby.length; k++) {
            const { vi, f } = nearby[k];
            const glow = f * targetPulse * 0.4;
            brain.meshColors[vi * 3]     += glow * 0.05;
            brain.meshColors[vi * 3 + 1] += glow * 0.7;
            brain.meshColors[vi * 3 + 2] += glow * 0.25;
          }
        }
      }
    } else if (alice.mode === AliceMode.SeizureChaos && isFocus && isFocus.has(i)) {
      const chaos = Math.sin(elapsed * 8 + i * 1.7) * 0.3 + 0.7;
      r += chaos * 0.9;
      g += chaos * 0.08;
      b += 0.02;
    } else if (alice.mode === AliceMode.SeizureFree) {
      const calm = Math.sin(elapsed * 1.2 + i * 0.4) * 0.04 + 0.06;
      g += calm;
      b += calm * 2;
    }

    for (const s of net.spikes) {
      const arr = s.arrivals[i];
      if (arr < 0) continue;
      const age = (elapsed - s.start) - arr;
      if (age < 0 || age > NETWORK.SPIKE_AGE_LIMIT) continue;

      const intensity = Math.exp(-age * s.decay);
      r += intensity * 1.4;
      g += intensity * 0.45;
      b += intensity * 0.1;

      if (brain.meshColors && intensity > 0.04) {
        const nearby = net.nodeMeshVerts[i];
        if (nearby) {
          for (let k = 0; k < nearby.length; k++) {
            const { vi, f } = nearby[k];
            const glow = f * intensity * 0.5;
            brain.meshColors[vi * 3]     += glow * 0.9;
            brain.meshColors[vi * 3 + 1] += glow * 0.28;
            brain.meshColors[vi * 3 + 2] += glow * 0.04;
          }
        }
      }
    }

    net.nodeColors[i * 3]     = Math.min(r, 2.0);
    net.nodeColors[i * 3 + 1] = Math.min(g, 1.5);
    net.nodeColors[i * 3 + 2] = Math.min(b, 1.0);
  }
  if (net.nodePoints) net.nodePoints.geometry.attributes.color.needsUpdate = true;

  /* Update edge colors */
  for (let i = 0; i < net.edgeData.length; i++) {
    const { from, to } = net.edgeData[i];
    let r = 0.006, g = 0.01, b = 0.018;

    if (alice.mode === AliceMode.SeizureChaos && isFocus && isFocus.has(from) && isFocus.has(to)) {
      const pulse = Math.sin(elapsed * 6 + i * 0.5) * 0.3 + 0.7;
      r += pulse * 1.2;
      g += pulse * 0.05;
      b += pulse * 0.02;
    }

    for (const s of net.spikes) {
      const aF = s.arrivals[from], aT = s.arrivals[to];
      if (aF < 0 || aT < 0) continue;
      const ageF = (elapsed - s.start) - aF;
      const ageT = (elapsed - s.start) - aT;
      if (ageF < -0.1 && ageT < -0.1) continue;

      const edgeAge = Math.max(0, Math.min(
        ageF >= 0 ? ageF : 99,
        ageT >= 0 ? ageT : 99
      ));
      if (edgeAge > NETWORK.SPIKE_AGE_LIMIT) continue;
      const intensity = Math.exp(-edgeAge * s.decay * 0.6) * 0.75;
      r += intensity * 0.85;
      g += intensity * 0.2;
      b += intensity * 0.04;
    }

    net.edgeColors[i * 6]     = net.edgeColors[i * 6 + 3] = Math.min(r, 1.5);
    net.edgeColors[i * 6 + 1] = net.edgeColors[i * 6 + 4] = Math.min(g, 1.0);
    net.edgeColors[i * 6 + 2] = net.edgeColors[i * 6 + 5] = Math.min(b, 0.8);
  }
  if (net.edgeLines) net.edgeLines.geometry.attributes.color.needsUpdate = true;

  /* Mark mesh colors as needing GPU update */
  if (brain.meshGeo && brain.meshGeo.attributes.color) {
    (brain.meshGeo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }

  /* Clean up finished spikes */
  net.spikes = net.spikes.filter(s => (elapsed - s.start) < NETWORK.SPIKE_CLEANUP_AGE);
}

/** Auto-trigger the first spike */
export function scheduleFirstSpike(net: NetworkState, clock: THREE.Clock, isMobile: boolean): void {
  setTimeout(() => triggerSpike(net, clock, isMobile), NETWORK.INITIAL_SPIKE_DELAY);
}
