import { PARTICLES, SUBCORTICAL_COLORS } from './constants.ts';
import { makeTexture } from './scene.ts';
import type { SceneState, BrainState, BrainData, SubcorticalStructure } from './types.ts';

/** Build the real Colin27 brain mesh from loaded data */
export function buildRealBrain(s: SceneState): BrainState {
  const B = window.BRAIN!;
  const verts = new Float32Array(B.v);
  const faces = new Uint32Array(B.f);
  const curv = B.c;
  const numVerts = verts.length / 3;

  /* Build mesh geometry */
  const meshGeo = new THREE.BufferGeometry();
  meshGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  meshGeo.setIndex(new THREE.BufferAttribute(faces, 1));
  meshGeo.computeVertexNormals();

  /* Vertex colors: curvature-based (gyri=lighter cyan, sulci=darker blue) */
  const meshColors = new Float32Array(numVerts * 3);
  const baseColors = new Float32Array(numVerts * 3);
  for (let i = 0; i < numVerts; i++) {
    const c = curv[i] || 0;
    const y = verts[i * 3 + 2]; // Z in FreeSurfer = height
    const heightT = (y + 1.5) / 3.0;
    if (c > 0) {
      baseColors[i * 3]     = 0.06 + heightT * 0.05;
      baseColors[i * 3 + 1] = 0.22 + heightT * 0.12;
      baseColors[i * 3 + 2] = 0.42 + heightT * 0.15;
    } else {
      baseColors[i * 3]     = 0.02 + heightT * 0.02;
      baseColors[i * 3 + 1] = 0.08 + heightT * 0.06;
      baseColors[i * 3 + 2] = 0.22 + heightT * 0.08;
    }
    meshColors[i * 3]     = baseColors[i * 3];
    meshColors[i * 3 + 1] = baseColors[i * 3 + 1];
    meshColors[i * 3 + 2] = baseColors[i * 3 + 2];
  }
  meshGeo.setAttribute('color', new THREE.BufferAttribute(meshColors, 3));

  /* Layer 1: Solid brain mesh */
  const solidMat = new THREE.MeshPhongMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.18,
    side: THREE.DoubleSide,
    specular: new THREE.Color(0x00aadd),
    shininess: 18,
    emissive: new THREE.Color(0x000a14),
    depthWrite: false,
  });
  s.brain.add(new THREE.Mesh(meshGeo, solidMat));

  /* Subcortical structures */
  if (B.sub && B.sub.length > 0) {
    buildSubcortical(s, B.sub);
  }

  /* Layer 2: Wireframe overlay */
  const wireMat = new THREE.MeshBasicMaterial({
    color: 0x00bbdd,
    wireframe: true,
    transparent: true,
    opacity: 0.025,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  s.brain.add(new THREE.Mesh(meshGeo, wireMat));

  /* Layer 3: Surface glow particles */
  const NUM_PARTICLES = s.isMobile ? PARTICLES.SURFACE_MOBILE : PARTICLES.SURFACE_DESKTOP;
  const pPositions = new Float32Array(NUM_PARTICLES * 3);
  const pColors = new Float32Array(NUM_PARTICLES * 3);
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const idx = Math.floor(Math.random() * numVerts);
    pPositions[i * 3]     = verts[idx * 3];
    pPositions[i * 3 + 1] = verts[idx * 3 + 1];
    pPositions[i * 3 + 2] = verts[idx * 3 + 2];
    pColors[i * 3]     = 0.0;
    pColors[i * 3 + 1] = 0.6;
    pColors[i * 3 + 2] = 0.9;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
  const tex = makeTexture(64, 0.2);
  s.brain.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.04, map: tex, vertexColors: true,
    transparent: true, opacity: 0.6,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  })));
  // Outer glow
  s.brain.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.15, map: tex, vertexColors: true,
    transparent: true, opacity: 0.04,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  })));

  return { meshGeo, meshColors, baseColors, particlePositions: pPositions, numVerts };
}

/** Build subcortical structures (hippocampus, amygdala, thalamus, etc.) */
function buildSubcortical(s: SceneState, structures: SubcorticalStructure[]): void {
  for (const st of structures) {
    const sv = new Float32Array(st.v);
    const sf = new Uint32Array(st.f);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(sv, 3));
    geo.setIndex(new THREE.BufferAttribute(sf, 1));
    geo.computeVertexNormals();

    const c = SUBCORTICAL_COLORS[st.n] || [0.5, 0.5, 0.5];

    const mat = new THREE.MeshPhongMaterial({
      color: new THREE.Color(c[0] * 0.6, c[1] * 0.6, c[2] * 0.6),
      emissive: new THREE.Color(c[0] * 0.15, c[1] * 0.15, c[2] * 0.15),
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
      specular: new THREE.Color(0.3, 0.3, 0.3),
      shininess: 25,
      depthWrite: true,
    });
    const solidMesh = new THREE.Mesh(geo, mat);
    solidMesh.userData.subcortical = true;
    s.brain.add(solidMesh);

    const wire = new THREE.MeshBasicMaterial({
      color: new THREE.Color(c[0], c[1], c[2]),
      wireframe: true,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const wireMesh = new THREE.Mesh(geo, wire);
    wireMesh.userData.subcortical = true;
    s.brain.add(wireMesh);
  }
}

/** Build a fallback point-cloud brain when real data isn't loaded */
export function buildFallbackBrain(s: SceneState): BrainState {
  const numVerts = s.isMobile ? PARTICLES.FALLBACK_MOBILE : PARTICLES.FALLBACK_DESKTOP;
  const positions = new Float32Array(numVerts * 3);
  const meshColors = new Float32Array(numVerts * 3);
  const baseColors = new Float32Array(numVerts * 3);
  for (let i = 0; i < numVerts; i++) {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const y = 1 - (i / (numVerts - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    positions[i * 3]     = r * Math.cos(theta) * 1.4;
    positions[i * 3 + 1] = y * 1.05;
    positions[i * 3 + 2] = r * Math.sin(theta) * 1.7;
    const t = (y + 1.2) / 2.4;
    baseColors[i * 3] = meshColors[i * 3] = 0.05 + (1 - t) * 0.2;
    baseColors[i * 3 + 1] = meshColors[i * 3 + 1] = 0.3 * t + 0.1 * (1 - t);
    baseColors[i * 3 + 2] = meshColors[i * 3 + 2] = 0.5 + 0.4 * t;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  pGeo.setAttribute('color', new THREE.BufferAttribute(meshColors, 3));
  const tex = makeTexture(64, 0.2);
  s.brain.add(new THREE.Points(pGeo, new THREE.PointsMaterial({
    size: 0.06, map: tex, vertexColors: true,
    transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  })));

  return { meshColors, baseColors, particlePositions: positions, numVerts };
}

/** Build decorative sEEG depth electrodes on the brain surface */
export function makeElectrodes(s: SceneState): void {
  const count = s.isMobile ? 6 : 12;
  const elGroup = new THREE.Group();
  const tex = makeTexture(32, 0.3);

  for (let e = 0; e < count; e++) {
    const angle = (e / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const zPos = -0.6 + Math.random() * 1.2;
    const outerR = 2.0;
    const innerR = 0.2 + Math.random() * 0.35;

    const start = new THREE.Vector3(Math.cos(angle) * outerR, Math.sin(angle) * outerR, zPos);
    const end = new THREE.Vector3(Math.cos(angle) * innerR, Math.sin(angle) * innerR, zPos + (Math.random() - 0.5) * 0.3);

    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    elGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({
      color: 0x00d4ff, transparent: true, opacity: 0.08,
      blending: THREE.AdditiveBlending,
    })));

    const contacts = 3 + Math.floor(Math.random() * 5);
    for (let c = 0; c < contacts; c++) {
      const t = 0.15 + (c / contacts) * 0.65;
      const pos = new THREE.Vector3().lerpVectors(start, end, t);
      const dGeo = new THREE.BufferGeometry();
      dGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([pos.x, pos.y, pos.z]), 3));
      elGroup.add(new THREE.Points(dGeo, new THREE.PointsMaterial({
        size: 0.045, color: 0xff6b35, transparent: true, opacity: 0.55,
        blending: THREE.AdditiveBlending, depthWrite: false, map: tex,
      })));
    }
  }
  s.brain.add(elGroup);
}
