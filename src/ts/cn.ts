import { CN } from './constants.ts';
import { makeTexture, onResize } from './scene.ts';
import { setBrainFloatingTo } from './alice.ts';
import { AliceMode, CNMode } from './types.ts';
import type { SceneState, CNState, AliceState, AnimationState } from './types.ts';

/** Initialize CN electrode geometry and data structures */
export function initCNData(s: SceneState, cn: CNState): void {
  if (cn.initialized || !s.brain) return;
  cn.initialized = true;

  cn.electrodeGroup = new THREE.Group();
  cn.electrodeGroup.visible = false;
  s.brain.add(cn.electrodeGroup);

  cn.contactPositions = [];
  const tex = makeTexture(64, 0.15);

  /* Create sEEG depth electrodes penetrating into brain */
  for (let e = 0; e < CN.ELECTRODES; e++) {
    const angle = (e / CN.ELECTRODES) * Math.PI * 2 + (e % 2) * 0.25;
    const zBase = -0.25 + (e / CN.ELECTRODES) * 0.5 + ((e % 3) - 1) * 0.1;
    const outerR = 1.6;
    const innerR = 0.15;

    const start = new THREE.Vector3(
      Math.cos(angle) * outerR,
      Math.sin(angle) * outerR,
      zBase + (Math.random() - 0.5) * 0.15
    );
    const end = new THREE.Vector3(
      Math.cos(angle) * innerR,
      Math.sin(angle) * innerR,
      zBase + (Math.random() - 0.5) * 0.1
    );

    /* Electrode shaft */
    const shaftLen = start.distanceTo(end);
    const shaftCylGeo = new THREE.CylinderGeometry(0.012, 0.012, shaftLen, 6, 1);
    shaftCylGeo.rotateX(Math.PI / 2);
    const shaftMesh = new THREE.Mesh(shaftCylGeo, new THREE.MeshBasicMaterial({
      color: 0x4488aa, transparent: true, opacity: 0.25,
      blending: THREE.AdditiveBlending, depthWrite: false,
    }));
    const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    shaftMesh.position.copy(mid);
    shaftMesh.lookAt(end);
    cn.electrodeGroup.add(shaftMesh);

    /* Contacts along the shaft */
    for (let c = 0; c < CN.CONTACTS_PER_ELECTRODE; c++) {
      const t = 0.08 + (c / CN.CONTACTS_PER_ELECTRODE) * 0.75;
      const pos = new THREE.Vector3().lerpVectors(start, end, t);
      cn.contactPositions.push({ x: pos.x, y: pos.y, z: pos.z });
    }
  }

  /* Create contact points geometry */
  const positions = new Float32Array(CN.TOTAL_CONTACTS * 3);
  cn.contactColors = new Float32Array(CN.TOTAL_CONTACTS * 3);
  for (let i = 0; i < CN.TOTAL_CONTACTS; i++) {
    positions[i * 3]     = cn.contactPositions[i].x;
    positions[i * 3 + 1] = cn.contactPositions[i].y;
    positions[i * 3 + 2] = cn.contactPositions[i].z;
    cn.contactColors[i * 3]     = 0.0;
    cn.contactColors[i * 3 + 1] = 0.5;
    cn.contactColors[i * 3 + 2] = 0.8;
  }
  const contactGeo = new THREE.BufferGeometry();
  contactGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  contactGeo.setAttribute('color', new THREE.BufferAttribute(cn.contactColors, 3));
  cn.contactPoints = new THREE.Points(contactGeo, new THREE.PointsMaterial({
    size: 0.12, map: tex, vertexColors: true,
    transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
  cn.electrodeGroup.add(cn.contactPoints);

  /* Outer glow for contacts */
  cn.electrodeGroup.add(new THREE.Points(contactGeo, new THREE.PointsMaterial({
    size: 0.35, map: tex, vertexColors: true,
    transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  })));

  /* Build cycling pairs for Phase 2 */
  cn.cyclePairs = [];
  for (let p = 0; p < CN.CYCLE_PAIRS; p++) {
    const hi = Math.floor(Math.random() * CN.TOTAL_CONTACTS);
    const conns: number[] = [];
    const hiElectrode = Math.floor(hi / CN.CONTACTS_PER_ELECTRODE);
    for (let attempt = 0; attempt < 40 && conns.length < CN.CONNECTIONS_PER_PAIR; attempt++) {
      const ci = Math.floor(Math.random() * CN.TOTAL_CONTACTS);
      const ciElectrode = Math.floor(ci / CN.CONTACTS_PER_ELECTRODE);
      if (ci !== hi && ciElectrode !== hiElectrode && !conns.includes(ci)) {
        conns.push(ci);
      }
    }
    cn.cyclePairs.push({ highlight: hi, connected: conns });
  }
  cn.cycleIndex = 0;
  cn.highlightContact = cn.cyclePairs[0].highlight;
  cn.connectedContacts = cn.cyclePairs[0].connected;

  /* Build connection line geometry (pre-allocated for max connections) */
  const connPos = new Float32Array(CN.MAX_CONNECTIONS * 6);
  cn.connectionColors = new Float32Array(CN.MAX_CONNECTIONS * 6);
  const connGeo = new THREE.BufferGeometry();
  connGeo.setAttribute('position', new THREE.BufferAttribute(connPos, 3));
  connGeo.setAttribute('color', new THREE.BufferAttribute(cn.connectionColors, 3));
  cn.connectionLines = new THREE.LineSegments(connGeo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, linewidth: 1,
  }));
  cn.connectionLines.visible = false;
  cn.electrodeGroup.add(cn.connectionLines);
  updateConnectionGeometry(cn);

  /* Phase 3: pick 4 consecutive contacts on the same electrode */
  const startContact = CN.TARGET_ELECTRODE * CN.CONTACTS_PER_ELECTRODE + CN.TARGET_START_CONTACT;
  cn.critSubset = [];
  for (let i = 0; i < CN.CRIT_SUBSET_COUNT; i++) {
    cn.critSubset.push(startContact + i);
  }

  /* Assign criticality scores: 1.0 (red) down to 0.0 (yellow) */
  cn.critScores = new Float32Array(CN.TOTAL_CONTACTS);
  cn.critScores[cn.critSubset[0]] = 1.0;
  cn.critScores[cn.critSubset[1]] = 0.65;
  cn.critScores[cn.critSubset[2]] = 0.3;
  cn.critScores[cn.critSubset[3]] = 0.0;

  /* Pulsing torus ring around the most critical contact */
  cn.critRingMat = new THREE.MeshBasicMaterial({
    color: 0xff2222, transparent: true, opacity: 0,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  cn.critRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.008, 8, 32),
    cn.critRingMat,
  );
  const critPos = cn.contactPositions[cn.critSubset[0]];
  cn.critRing.position.set(critPos.x, critPos.y, critPos.z);
  cn.critRing.visible = false;
  cn.electrodeGroup.add(cn.critRing);
}

/** Update connection line geometry to match current highlight/connected contacts */
function updateConnectionGeometry(cn: CNState): void {
  if (!cn.connectionLines || !cn.contactPositions.length) return;
  const pos = (cn.connectionLines.geometry.attributes.position as THREE.BufferAttribute).array as Float32Array;
  const col = (cn.connectionLines.geometry.attributes.color as THREE.BufferAttribute).array as Float32Array;
  const hc = cn.contactPositions[cn.highlightContact];
  for (let i = 0; i < CN.MAX_CONNECTIONS; i++) {
    if (i < cn.connectedContacts.length) {
      const tc = cn.contactPositions[cn.connectedContacts[i]];
      pos[i * 6]     = hc.x; pos[i * 6 + 1] = hc.y; pos[i * 6 + 2] = hc.z;
      pos[i * 6 + 3] = tc.x; pos[i * 6 + 4] = tc.y; pos[i * 6 + 5] = tc.z;
      col[i * 6] = col[i * 6 + 3] = 0.7;
      col[i * 6 + 1] = col[i * 6 + 4] = 0.08;
      col[i * 6 + 2] = col[i * 6 + 5] = 0.04;
    } else {
      pos[i * 6] = pos[i * 6 + 1] = pos[i * 6 + 2] = 0;
      pos[i * 6 + 3] = pos[i * 6 + 4] = pos[i * 6 + 5] = 0;
      col[i * 6] = col[i * 6 + 1] = col[i * 6 + 2] = 0;
      col[i * 6 + 3] = col[i * 6 + 4] = col[i * 6 + 5] = 0;
    }
  }
  (cn.connectionLines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  (cn.connectionLines.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
}

/** Set the active CN step (1=electrodes, 2=connectivity, 3=criticality) */
export function setCNStepTo(
  step: number,
  s: SceneState,
  cn: CNState,
  alice: AliceState,
  animState: AnimationState,
  cnBrainTarget: HTMLElement | null,
  canvasOriginalParent: Node,
  canvasNextSibling: Node | null,
  animate: () => void,
  stopAlice: () => void,
): void {
  if (alice.mode > AliceMode.Off) stopAlice();
  cn.mode = step;
  cn.cycleTimer = 0;

  /* Update step buttons */
  document.querySelectorAll('.cn-step').forEach(btn => {
    const st = parseInt((btn as HTMLElement).dataset.cnStep!);
    btn.classList.remove('cn-step--active', 'cn-step--done');
    if (st === step) btn.classList.add('cn-step--active');
    else if (st < step) btn.classList.add('cn-step--done');
    btn.setAttribute('aria-pressed', String(st === step));
  });

  /* Update text panels */
  document.querySelectorAll('.cn-panel').forEach(panel => {
    const p = parseInt((panel as HTMLElement).dataset.cnPanel!);
    panel.classList.toggle('cn-panel--active', p === step);
  });

  /* Float brain into CN section */
  if (cnBrainTarget && cn.mode > CNMode.Off) {
    setBrainFloatingTo(s, cnBrainTarget, cn.brainSize, canvasOriginalParent, canvasNextSibling);
    if (!animState.isBrainVisible) {
      animState.isBrainVisible = true;
      s.clock.getDelta();
      animate();
    }
  }

  /* Hide cortical mesh + network but keep subcortical structures visible */
  if (cn.mode > CNMode.Off) {
    s.brain.children.forEach(child => {
      if (child === cn.electrodeGroup) return;
      if (child.userData && child.userData.subcortical) {
        child.visible = true;
      } else {
        child.visible = false;
      }
    });
    if (cn.electrodeGroup) cn.electrodeGroup.visible = true;
    if (cn.connectionLines) cn.connectionLines.visible = (step === 2);
    if (cn.critRing) cn.critRing.visible = (step === 3);
    if (step === 2) updateConnectionGeometry(cn);
  }
}

/** Stop CN visualization and restore brain */
export function stopCNVisualization(
  s: SceneState,
  cn: CNState,
  canvasOriginalParent: Node,
  canvasNextSibling: Node | null,
): void {
  cn.mode = CNMode.Off;
  cn.timeouts.forEach(t => clearTimeout(t));
  cn.timeouts = [];

  /* Restore brain mesh + network visibility */
  s.brain.children.forEach(child => { child.visible = true; });
  if (cn.electrodeGroup) cn.electrodeGroup.visible = false;
  if (cn.connectionLines) cn.connectionLines.visible = false;
  if (cn.critRing) cn.critRing.visible = false;

  setBrainFloatingTo(s, null, 0, canvasOriginalParent, canvasNextSibling);

  /* Reset step buttons */
  document.querySelectorAll('.cn-step').forEach(btn => {
    btn.classList.remove('cn-step--active', 'cn-step--done');
  });
  const firstStep = document.querySelector('.cn-step[data-cn-step="1"]');
  if (firstStep) firstStep.classList.add('cn-step--active');

  /* Reset panels */
  document.querySelectorAll('.cn-panel').forEach(panel => {
    panel.classList.toggle('cn-panel--active', (panel as HTMLElement).dataset.cnPanel === '1');
  });
}

/** Per-frame update of CN contact colors and connection animations */
export function updateCNVisualization(cn: CNState, elapsed: number, dt: number): void {
  if (!cn.initialized || !cn.contactColors) return;

  if (cn.mode === CNMode.Electrodes) {
    /* Phase 1: all contacts dim cyan, gentle pulse */
    for (let i = 0; i < CN.TOTAL_CONTACTS; i++) {
      const pulse = Math.sin(elapsed * 1.5 + i * 0.4) * 0.1 + 0.9;
      cn.contactColors[i * 3]     = 0.0;
      cn.contactColors[i * 3 + 1] = pulse * 0.5;
      cn.contactColors[i * 3 + 2] = pulse * 0.8;
    }

  } else if (cn.mode === CNMode.Connectivity) {
    /* Phase 2: cycle through different contacts */
    cn.cycleTimer += dt;
    if (cn.cycleTimer > CN.CYCLE_INTERVAL) {
      cn.cycleTimer = 0;
      cn.cycleIndex = (cn.cycleIndex + 1) % cn.cyclePairs.length;
      cn.highlightContact = cn.cyclePairs[cn.cycleIndex].highlight;
      cn.connectedContacts = cn.cyclePairs[cn.cycleIndex].connected;
      updateConnectionGeometry(cn);
    }

    const connSet = new Set(cn.connectedContacts);
    for (let i = 0; i < CN.TOTAL_CONTACTS; i++) {
      if (i === cn.highlightContact) {
        const pulse = Math.sin(elapsed * 3) * 0.15 + 0.85;
        cn.contactColors[i * 3]     = pulse * 1.4;
        cn.contactColors[i * 3 + 1] = pulse * 0.08;
        cn.contactColors[i * 3 + 2] = pulse * 0.02;
      } else if (connSet.has(i)) {
        const pulse = Math.sin(elapsed * 2 + i * 0.5) * 0.1 + 0.9;
        cn.contactColors[i * 3]     = pulse * 0.4;
        cn.contactColors[i * 3 + 1] = pulse * 0.25;
        cn.contactColors[i * 3 + 2] = pulse * 0.1;
      } else {
        cn.contactColors[i * 3]     = 0.0;
        cn.contactColors[i * 3 + 1] = 0.08;
        cn.contactColors[i * 3 + 2] = 0.15;
      }
    }

    /* Animate connection line colors */
    if (cn.connectionLines && cn.connectionColors) {
      for (let i = 0; i < cn.connectedContacts.length; i++) {
        const pulse = Math.sin(elapsed * 2.5 + i * 0.7) * 0.2 + 0.7;
        cn.connectionColors[i * 6]     = cn.connectionColors[i * 6 + 3] = pulse * 0.9;
        cn.connectionColors[i * 6 + 1] = cn.connectionColors[i * 6 + 4] = pulse * 0.1;
        cn.connectionColors[i * 6 + 2] = cn.connectionColors[i * 6 + 5] = pulse * 0.05;
      }
      (cn.connectionLines.geometry.attributes.color as THREE.BufferAttribute).needsUpdate = true;
    }

  } else if (cn.mode === CNMode.Criticality) {
    /* Phase 3: 4 consecutive contacts on same electrode, red to yellow */
    const subsetSet = new Set(cn.critSubset);
    for (let i = 0; i < CN.TOTAL_CONTACTS; i++) {
      if (subsetSet.has(i)) {
        const score = cn.critScores[i];
        const pulse = Math.sin(elapsed * 2 + i * 0.5) * 0.08 + 0.92;
        cn.contactColors[i * 3]     = pulse * 1.4;
        cn.contactColors[i * 3 + 1] = pulse * (1.0 - score) * 1.1;
        cn.contactColors[i * 3 + 2] = 0.0;
      } else {
        cn.contactColors[i * 3]     = 0.0;
        cn.contactColors[i * 3 + 1] = 0.04;
        cn.contactColors[i * 3 + 2] = 0.08;
      }
    }

    /* Pulsing ring around the most critical contact */
    if (cn.critRing && cn.critRingMat) {
      const critPulse = Math.sin(elapsed * 4) * 0.15 + 0.4;
      cn.critRingMat.opacity = critPulse;
      cn.critRing.rotation.x = elapsed * 2;
      cn.critRing.rotation.y = elapsed * 1.3;
    }
  }

  /* Commit contact color updates */
  if (cn.contactPoints) cn.contactPoints.geometry.attributes.color.needsUpdate = true;
}

/** Set up CN step button click handlers and section observer */
export function initCNObservers(
  s: SceneState,
  cn: CNState,
  alice: AliceState,
  animState: AnimationState,
  cnBrainTarget: HTMLElement | null,
  canvasOriginalParent: Node,
  canvasNextSibling: Node | null,
  animate: () => void,
  stopAlice: () => void,
): void {
  const doSetStep = (step: number) => {
    initCNData(s, cn);
    setCNStepTo(step, s, cn, alice, animState, cnBrainTarget, canvasOriginalParent, canvasNextSibling, animate, stopAlice);
  };

  /* Step button click handlers */
  document.querySelectorAll('.cn-step').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = parseInt((btn as HTMLElement).dataset.cnStep!);
      doSetStep(step);
    });
  });

  /* CN section IntersectionObserver - auto-start Phase 1 when entering viewport */
  const cnSection = document.getElementById('cn-how');
  if (cnSection) {
    const cnObserver = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        initCNData(s, cn);
        if (cn.mode === CNMode.Off) doSetStep(1);
      } else {
        if (cn.mode > CNMode.Off) stopCNVisualization(s, cn, canvasOriginalParent, canvasNextSibling);
      }
    }, { threshold: 0.3 });
    cnObserver.observe(cnSection);
  }
}
