import { CAMERA } from './constants.ts';
import type { SceneState } from './types.ts';

/** Create and configure the Three.js scene, camera, renderer, and lighting */
export function initScene(canvas: HTMLCanvasElement, isMobile: boolean): SceneState {
  const scene = new THREE.Scene();
  const clock = new THREE.Clock();

  const camera = new THREE.PerspectiveCamera(
    CAMERA.FOV,
    canvas.clientWidth / canvas.clientHeight,
    CAMERA.NEAR,
    CAMERA.FAR
  );
  camera.position.set(0, 0, isMobile ? CAMERA.Z_MOBILE : CAMERA.Z_DESKTOP);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  /* Lighting */
  scene.add(new THREE.AmbientLight(0x112233, 0.6));

  const dirLight = new THREE.DirectionalLight(0x88ccff, 0.7);
  dirLight.position.set(3, 4, 5);
  scene.add(dirLight);

  const fillLight = new THREE.DirectionalLight(0x4466aa, 0.3);
  fillLight.position.set(-3, -1, 2);
  scene.add(fillLight);

  const rimLight = new THREE.PointLight(0x7c3aed, 0.5, 12);
  rimLight.position.set(-3, 1, -4);
  scene.add(rimLight);

  const topLight = new THREE.PointLight(0x00d4ff, 0.3, 10);
  topLight.position.set(0, 5, 0);
  scene.add(topLight);

  const brain = new THREE.Group();
  /* Swap axes: FreeSurfer Z=up -> Three.js Y=up */
  brain.rotation.x = -Math.PI / 2;
  scene.add(brain);

  return { scene, camera, renderer, brain, clock, canvas, isMobile };
}

/** Handle window resize for the 3D renderer */
export function onResize(s: SceneState): void {
  s.camera.aspect = s.canvas.clientWidth / s.canvas.clientHeight;
  s.camera.updateProjectionMatrix();
  s.renderer.setSize(s.canvas.clientWidth, s.canvas.clientHeight);
}

/** Create a radial glow texture for particles */
export function makeTexture(size: number, falloff: number): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(falloff, 'rgba(255,255,255,0.6)');
  g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}
