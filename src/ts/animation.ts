import { CAMERA, NETWORK } from './constants.ts';
import { triggerSpike, updateEpiNetwork } from './network.ts';
import { updateMouseGlow } from './interaction.ts';
import { updateCNVisualization } from './cn.ts';
import { AliceMode, CNMode } from './types.ts';
import type { SceneState, BrainState, NetworkState, DragState, AliceState, CNState, AnimationState } from './types.ts';

/** Start the main animation loop */
export function startAnimationLoop(
  s: SceneState,
  brain: BrainState,
  net: NetworkState | null,
  drag: DragState,
  alice: AliceState,
  cn: CNState,
  animState: AnimationState,
): void {
  function animate(): void {
    if (!animState.isBrainVisible && alice.mode === AliceMode.Off && cn.mode === CNMode.Off) return;
    requestAnimationFrame(animate);

    const dt = Math.min(s.clock.getDelta(), 0.05);
    const elapsed = s.clock.getElapsedTime();

    /* Scroll-driven transforms - override when Alice or CN is active */
    const activeMode = alice.mode > AliceMode.Off || cn.mode > CNMode.Off;
    const brainOpacity = activeMode ? 1 : Math.max(0, 1 - animState.scrollPct * 0.45);
    s.canvas.style.opacity = String(brainOpacity);
    const scale = activeMode ? 1 : 1 - Math.min(animState.scrollPct * 0.07, 0.25);
    s.brain.scale.setScalar(scale);
    s.brain.position.x = 0;

    if (brainOpacity < 0.01) return;

    /* Interactive rotation with inertia + slow auto-rotate */
    if (!drag.isDragging) {
      drag.dragVelZ *= CAMERA.INERTIA_DAMPING;
      drag.dragVelX *= CAMERA.INERTIA_DAMPING;
      drag.userRotZ += drag.dragVelZ;
      drag.userRotX += drag.dragVelX;
      drag.userRotZ += dt * CAMERA.AUTO_ROTATE_SPEED;
    }
    const baseXRot = -Math.PI / 2;
    s.brain.rotation.z = drag.userRotZ;
    s.brain.rotation.x = baseXRot + drag.userRotX;
    s.brain.rotation.y = 0;

    /* Auto-trigger spikes periodically (paused during Alice/CN modes) */
    if (net && alice.mode === AliceMode.Off && cn.mode === CNMode.Off) {
      animState.spikeAutoTimer += dt;
      if (animState.spikeAutoTimer > NETWORK.AUTO_SPIKE_INTERVAL) {
        triggerSpike(net, s.clock, s.isMobile);
        animState.spikeAutoTimer = 0;
      }
    }

    /* CN mode takes over rendering when active */
    if (cn.mode > CNMode.Off) {
      updateCNVisualization(cn, elapsed, dt);
      updateMouseGlow(brain, animState);
    } else if (net) {
      updateEpiNetwork(net, brain, elapsed, alice);
      updateMouseGlow(brain, animState);
    }

    s.renderer.render(s.scene, s.camera);
  }

  /* Expose animate for external callers (Alice/CN need to restart it) */
  (animState as any)._animate = animate;

  animate();
}

/** Get the animate function reference from animState (set by startAnimationLoop) */
export function getAnimateFn(animState: AnimationState): () => void {
  return (animState as any)._animate || (() => {});
}

/** Set up IntersectionObserver to pause animation when brain is off-screen */
export function initBrainVisibilityObserver(
  s: SceneState,
  animState: AnimationState,
): void {
  const brainObserver = new IntersectionObserver(entries => {
    const wasVisible = animState.isBrainVisible;
    animState.isBrainVisible = entries[0].isIntersecting;
    if (!wasVisible && animState.isBrainVisible) {
      s.clock.getDelta();
      getAnimateFn(animState)();
    }
  });
  brainObserver.observe(s.canvas);
}

/** Set up narrative section observers that trigger spikes on scroll */
export function initNarrativeObservers(
  net: NetworkState | null,
  s: SceneState,
): void {
  if (!net) return;
  const narrativeObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting && net.nodes.length > 0) {
        triggerSpike(net, s.clock, s.isMobile);
      }
    });
  }, { threshold: 0.3 });
  ['problem', 'solution'].forEach(id => {
    const el = document.getElementById(id);
    if (el) narrativeObserver.observe(el);
  });
}
