import { ALICE } from './constants.ts';
import { triggerSpikeAt } from './network.ts';
import { onResize } from './scene.ts';
import { AliceMode, CNMode } from './types.ts';
import type { SceneState, NetworkState, AliceState, CNState, AnimationState } from './types.ts';

/** Move the brain canvas into a target element (floating) or back to its original position */
export function setBrainFloatingTo(
  s: SceneState,
  targetEl: HTMLElement | null,
  size: number,
  canvasOriginalParent: Node,
  canvasNextSibling: Node | null,
): void {
  if (targetEl) {
    targetEl.insertBefore(s.canvas, targetEl.firstChild);
    s.canvas.classList.add('hero__brain-canvas--floating');
    s.canvas.style.width = size + 'px';
    s.canvas.style.height = size + 'px';
    s.canvas.style.pointerEvents = 'auto';
    s.canvas.style.cursor = 'grab';
    s.canvas.style.touchAction = 'none';
    requestAnimationFrame(() => {
      s.renderer.setSize(size, size);
      s.camera.aspect = 1;
      s.camera.updateProjectionMatrix();
    });
  } else {
    s.canvas.classList.remove('hero__brain-canvas--floating');
    s.canvas.style.width = '';
    s.canvas.style.height = '';
    s.canvas.style.pointerEvents = '';
    s.canvas.style.cursor = '';
    s.canvas.style.touchAction = '';
    canvasOriginalParent.insertBefore(s.canvas, canvasNextSibling);
    onResize(s);
  }
}

/** Convenience: float the brain to Alice's photo row or back */
function setBrainFloating(
  s: SceneState,
  on: boolean,
  alicePhotoRow: HTMLElement | null,
  canvasOriginalParent: Node,
  canvasNextSibling: Node | null,
): void {
  setBrainFloatingTo(s, on ? alicePhotoRow : null, 120, canvasOriginalParent, canvasNextSibling);
}

/** Start the Alice seizure story 3-phase visualization */
export function startAliceVisualization(
  s: SceneState,
  net: NetworkState,
  alice: AliceState,
  cn: CNState,
  animState: AnimationState,
  alicePhotoRow: HTMLElement | null,
  canvasOriginalParent: Node,
  canvasNextSibling: Node | null,
  animate: () => void,
  stopCN: () => void,
): void {
  if (alice.triggered || net.nodes.length === 0) return;
  if (cn.mode > CNMode.Off) stopCN();
  alice.triggered = true;
  alice.mode = AliceMode.SeizureChaos;
  alice.start = s.clock.getElapsedTime();

  if (!animState.isBrainVisible) {
    setBrainFloating(s, true, alicePhotoRow, canvasOriginalParent, canvasNextSibling);
    s.clock.getDelta();
    animate();
  }

  /* Pick a spatial cluster of ~15 nodes as the seizure focus */
  const seed = Math.floor(Math.random() * net.NET_NODES);
  const dists: { i: number; d: number }[] = [];
  for (let i = 0; i < net.NET_NODES; i++) {
    const dx = net.nodes[i].x - net.nodes[seed].x;
    const dy = net.nodes[i].y - net.nodes[seed].y;
    const dz = net.nodes[i].z - net.nodes[seed].z;
    dists.push({ i, d: dx * dx + dy * dy + dz * dz });
  }
  dists.sort((a, b) => a.d - b.d);
  alice.focus = dists.slice(0, ALICE.FOCUS_COUNT).map(d => d.i);
  alice.targets = alice.focus.slice(0, ALICE.TARGET_COUNT);

  /* Fire rapid chaotic spikes from focus nodes */
  for (let k = 0; k < ALICE.SPIKE_COUNT; k++) {
    alice.timeouts.push(setTimeout(() => {
      if (alice.mode === AliceMode.SeizureChaos) {
        const node = alice.focus[Math.floor(Math.random() * alice.focus.length)];
        triggerSpikeAt(net, node, s.clock, s.isMobile);
      }
    }, k * ALICE.SPIKE_INTERVAL));
  }

  /* Phase 2: targets identified */
  alice.timeouts.push(setTimeout(() => { alice.mode = AliceMode.TargetsIdentified; }, ALICE.PHASE2_DELAY));

  /* Phase 3: seizure-free calm */
  alice.timeouts.push(setTimeout(() => { alice.mode = AliceMode.SeizureFree; }, ALICE.PHASE3_DELAY));

  /* Reset after sequence completes */
  alice.timeouts.push(setTimeout(() => {
    alice.triggered = false;
  }, ALICE.RESET_DELAY));
}

/** Stop Alice visualization and reset state */
export function stopAliceVisualization(
  s: SceneState,
  alice: AliceState,
  alicePhotoRow: HTMLElement | null,
  canvasOriginalParent: Node,
  canvasNextSibling: Node | null,
): void {
  alice.timeouts.forEach(t => clearTimeout(t));
  alice.timeouts = [];
  alice.mode = AliceMode.Off;
  alice.triggered = false;
  alice.focus = [];
  alice.targets = [];
  setBrainFloating(s, false, alicePhotoRow, canvasOriginalParent, canvasNextSibling);
}

/** Set up Alice section IntersectionObserver and hover interactions */
export function initAliceObservers(
  s: SceneState,
  net: NetworkState,
  alice: AliceState,
  cn: CNState,
  animState: AnimationState,
  alicePhotoRow: HTMLElement | null,
  canvasOriginalParent: Node,
  canvasNextSibling: Node | null,
  animate: () => void,
  stopCN: () => void,
): void {
  const aliceEl = document.getElementById('alice-story');
  if (!aliceEl) return;

  const start = () => startAliceVisualization(
    s, net, alice, cn, animState,
    alicePhotoRow, canvasOriginalParent, canvasNextSibling, animate, stopCN
  );
  const stop = () => stopAliceVisualization(
    s, alice, alicePhotoRow, canvasOriginalParent, canvasNextSibling
  );

  const aliceObserver = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) start();
  }, { threshold: 0.4 });
  aliceObserver.observe(aliceEl);

  aliceEl.style.cursor = 'pointer';
  aliceEl.addEventListener('mouseenter', () => { stop(); start(); });
  aliceEl.addEventListener('mouseleave', stop);
}

/** Set up solution card hover interactions that trigger brain modes */
export function initSolCardInteractions(
  s: SceneState,
  alice: AliceState,
  animState: AnimationState,
  alicePhotoRow: HTMLElement | null,
  canvasOriginalParent: Node,
  canvasNextSibling: Node | null,
  animate: () => void,
): void {
  const solCardCN = document.querySelector('.sol-card--cn');
  const solCardMMVT = document.querySelector('.sol-card--mmvt');
  if (!solCardCN || !solCardMMVT) return;

  solCardCN.addEventListener('mouseenter', () => {
    alice.mode = AliceMode.SeizureChaos;
    alice.start = s.clock.getElapsedTime();
    if (!animState.isBrainVisible) {
      setBrainFloating(s, true, alicePhotoRow, canvasOriginalParent, canvasNextSibling);
      s.clock.getDelta();
      animate();
    }
  });
  solCardCN.addEventListener('mouseleave', () => {
    alice.mode = AliceMode.Off;
    setBrainFloating(s, false, alicePhotoRow, canvasOriginalParent, canvasNextSibling);
  });
  solCardMMVT.addEventListener('mouseenter', () => {
    alice.mode = AliceMode.SeizureFree;
    if (!animState.isBrainVisible) {
      setBrainFloating(s, true, alicePhotoRow, canvasOriginalParent, canvasNextSibling);
      s.clock.getDelta();
      animate();
    }
  });
  solCardMMVT.addEventListener('mouseleave', () => {
    alice.mode = AliceMode.Off;
    setBrainFloating(s, false, alicePhotoRow, canvasOriginalParent, canvasNextSibling);
  });
}
