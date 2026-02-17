import { CAMERA, LOGO_SCROLL_THRESHOLD, MOUSE_GLOW_THRESHOLD } from './constants.ts';
import { triggerSpikeAt } from './network.ts';
import type { SceneState, BrainState, NetworkState, DragState, AnimationState } from './types.ts';

/** Initialize drag-to-rotate interaction on the brain canvas */
export function initDragHandlers(s: SceneState, drag: DragState): void {
  s.canvas.addEventListener('pointerdown', e => {
    drag.isDragging = true;
    drag.lastDragX = e.clientX;
    drag.lastDragY = e.clientY;
    drag.dragVelZ = drag.dragVelX = 0;
  });
  window.addEventListener('pointermove', e => {
    if (!drag.isDragging) return;
    const dx = e.clientX - drag.lastDragX;
    const dy = e.clientY - drag.lastDragY;
    drag.dragVelZ = dx * CAMERA.DRAG_SENSITIVITY;
    drag.dragVelX = dy * CAMERA.DRAG_SENSITIVITY;
    drag.userRotZ += drag.dragVelZ;
    drag.userRotX += drag.dragVelX;
    drag.lastDragX = e.clientX;
    drag.lastDragY = e.clientY;
  });
  window.addEventListener('pointerup', () => { drag.isDragging = false; });

  /* Touch drag support */
  s.canvas.addEventListener('touchstart', e => {
    if (e.touches.length === 1) {
      e.preventDefault();
      drag.isDragging = true;
      drag.lastDragX = e.touches[0].clientX;
      drag.lastDragY = e.touches[0].clientY;
      drag.dragVelZ = drag.dragVelX = 0;
    }
  }, { passive: false });
  s.canvas.addEventListener('touchmove', e => {
    if (!drag.isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - drag.lastDragX;
    const dy = e.touches[0].clientY - drag.lastDragY;
    drag.dragVelZ = dx * CAMERA.DRAG_SENSITIVITY;
    drag.dragVelX = dy * CAMERA.DRAG_SENSITIVITY;
    drag.userRotZ += drag.dragVelZ;
    drag.userRotX += drag.dragVelX;
    drag.lastDragX = e.touches[0].clientX;
    drag.lastDragY = e.touches[0].clientY;
  }, { passive: false });
  s.canvas.addEventListener('touchend', () => { drag.isDragging = false; });
}

/** Initialize mouse move and scroll tracking */
export function initMouseAndScroll(animState: AnimationState): void {
  document.addEventListener('mousemove', e => {
    animState.mx = (e.clientX / window.innerWidth - 0.5) * 2;
    animState.my = (e.clientY / window.innerHeight - 0.5) * 2;
  });
  window.addEventListener('scroll', () => {
    animState.scrollPct = window.scrollY / window.innerHeight;
    const logo = document.querySelector('.nav-fixed__logo');
    if (logo) (logo as HTMLElement).style.opacity = animState.scrollPct > LOGO_SCROLL_THRESHOLD ? '1' : '0';
  });
}

/** Initialize click/touch handlers for spike triggering on brain click */
export function initBrainClickHandlers(
  s: SceneState,
  net: NetworkState,
): void {
  function canvasToNDC(clientX: number, clientY: number): THREE.Vector2 {
    const rect = s.canvas.getBoundingClientRect();
    return new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
  }

  function castAndSpike(mouse: THREE.Vector2): void {
    net.raycaster.setFromCamera(mouse, s.camera);
    const meshes = s.brain.children.filter(c => (c as any).isMesh);
    const intersects = net.raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const localHit = s.brain.worldToLocal(intersects[0].point.clone());

      let best = 0, bestD = Infinity;
      for (let i = 0; i < net.NET_NODES; i++) {
        const dx = net.nodes[i].x - localHit.x;
        const dy = net.nodes[i].y - localHit.y;
        const dz = net.nodes[i].z - localHit.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bestD) { bestD = d; best = i; }
      }
      triggerSpikeAt(net, best, s.clock, s.isMobile);

      /* Fade hint after first click */
      const hint = document.getElementById('brain-hint');
      if (hint) {
        hint.style.transition = 'opacity 0.5s';
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 600);
      }
    }
  }

  s.canvas.addEventListener('click', (event: MouseEvent) => {
    castAndSpike(canvasToNDC(event.clientX, event.clientY));
  });
  s.canvas.addEventListener('touchend', (event: TouchEvent) => {
    if (!event.changedTouches.length) return;
    const t = event.changedTouches[0];
    castAndSpike(canvasToNDC(t.clientX, t.clientY));
  }, { passive: true });
}

/** Update mouse proximity glow on brain mesh vertices */
export function updateMouseGlow(
  brain: BrainState,
  animState: AnimationState,
): void {
  if (!brain.meshColors) return;
  const src = window.BRAIN ? window.BRAIN.v : brain.particlePositions;
  if (!src) return;
  const mouseVec = new THREE.Vector3(animState.mx * 1.5, -animState.my * 1.0, 2).normalize();
  for (let i = 0; i < brain.numVerts; i++) {
    const ptVec = new THREE.Vector3(src[i * 3], src[i * 3 + 1], src[i * 3 + 2]).normalize();
    const dot = mouseVec.dot(ptVec);
    if (dot > MOUSE_GLOW_THRESHOLD) {
      const b = (dot - MOUSE_GLOW_THRESHOLD) / (1 - MOUSE_GLOW_THRESHOLD) * 0.15;
      brain.meshColors[i * 3]     += b * 0.3;
      brain.meshColors[i * 3 + 1] += b * 0.6;
      brain.meshColors[i * 3 + 2] += b * 0.8;
    }
  }
}
