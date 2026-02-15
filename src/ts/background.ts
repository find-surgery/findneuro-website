import { PARTICLES } from './constants.ts';
import type { BgParticle, AnimationState } from './types.ts';

/** Initialize and run the 2D neural particle background for content sections */
export function initBackground(isMobile: boolean, animState: AnimationState): void {
  const bgCanvas = document.createElement('canvas');
  bgCanvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.04;';
  document.body.insertBefore(bgCanvas, document.body.firstChild);
  const bgCtx = bgCanvas.getContext('2d')!;
  const bgParticles: BgParticle[] = [];
  const BG_COUNT = isMobile ? PARTICLES.BG_MOBILE : PARTICLES.BG_DESKTOP;

  function initBgParticles(): void {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
    bgParticles.length = 0;
    for (let i = 0; i < BG_COUNT; i++) {
      bgParticles.push({
        x: Math.random() * bgCanvas.width,
        y: Math.random() * bgCanvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 1.5,
      });
    }
  }
  initBgParticles();
  window.addEventListener('resize', initBgParticles);

  function animBg(): void {
    requestAnimationFrame(animBg);
    bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    const showBg = animState.scrollPct > 0.5 ? Math.min(1, (animState.scrollPct - 0.5) * 2) : 0;
    if (showBg < 0.01) return;
    bgCanvas.style.opacity = String(0.04 * showBg);

    for (const p of bgParticles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = bgCanvas.width;
      if (p.x > bgCanvas.width) p.x = 0;
      if (p.y < 0) p.y = bgCanvas.height;
      if (p.y > bgCanvas.height) p.y = 0;
      bgCtx.beginPath();
      bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      bgCtx.fillStyle = '#00d4ff';
      bgCtx.fill();
    }
    bgCtx.strokeStyle = 'rgba(0,212,255,0.3)';
    bgCtx.lineWidth = 0.5;
    for (let i = 0; i < bgParticles.length; i++) {
      for (let j = i + 1; j < bgParticles.length; j++) {
        const dx = bgParticles[i].x - bgParticles[j].x;
        const dy = bgParticles[i].y - bgParticles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < PARTICLES.BG_CONNECTION_DISTANCE) {
          bgCtx.globalAlpha = (1 - d / PARTICLES.BG_CONNECTION_DISTANCE) * 0.4;
          bgCtx.beginPath();
          bgCtx.moveTo(bgParticles[i].x, bgParticles[i].y);
          bgCtx.lineTo(bgParticles[j].x, bgParticles[j].y);
          bgCtx.stroke();
        }
      }
    }
    bgCtx.globalAlpha = 1;
  }
  animBg();
}
