/* Lightweight 2D neural field, used in place of the 3D brain on phones.
   The WebGL brain costs 3.4 MB of payload (three.js + brain_data.js), a
   7.3-million-iteration blocking precompute at startup, and ~109k colour
   floats rewritten per frame - none of which a phone should pay for a
   backdrop that sits at half opacity behind a text scrim.

   Same canvas element as the 3D version, 2D context instead. Visual language
   follows src/ts/background.ts: cyan nodes, proximity links, plus the
   travelling pulse that echoes what the brain is showing on desktop. */
(function (global) {
  'use strict';

  function createParticles(opts) {
    const canvas = opts && opts.canvas;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const LINK_DIST = 120;
    const reduced = global.matchMedia
      && global.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0, h = 0, dpr = 1;
    let nodes = [];
    let pulses = [];
    let raf = 0, last = 0, spawn = 0;

    function size() {
      dpr = Math.min(global.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      /* Density by area, so a tablet does not get a phone's sparse field */
      const count = Math.max(28, Math.min(70, Math.round((w * h) / 12000)));
      nodes = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          r: 1 + Math.random() * 1.6,
          ph: Math.random() * Math.PI * 2,
        });
      }
      pulses = [];
    }

    function step(dt, t) {
      for (const p of nodes) {
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
      /* A spike hops node to node now and then - the 2D echo of the
         propagation the 3D network shows */
      spawn -= dt;
      if (spawn <= 0 && nodes.length > 2) {
        spawn = 1.4 + Math.random() * 1.8;
        pulses.push({ i: (Math.random() * nodes.length) | 0, j: -1, t: 0 });
      }
      for (let k = pulses.length - 1; k >= 0; k--) {
        const s = pulses[k];
        if (s.j < 0) {
          let best = -1, bestD = LINK_DIST;
          for (let n = 0; n < nodes.length; n++) {
            if (n === s.i) continue;
            const d = Math.hypot(nodes[n].x - nodes[s.i].x, nodes[n].y - nodes[s.i].y);
            if (d < bestD && Math.random() < 0.5) { bestD = d; best = n; }
          }
          if (best < 0) { pulses.splice(k, 1); continue; }
          s.j = best;
        }
        s.t += dt * 1.5;
        if (s.t >= 1) {
          const from = s.j;
          pulses.splice(k, 1);
          if (Math.random() < 0.55) pulses.push({ i: from, j: -1, t: 0 });
        }
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, w, h);

      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d >= LINK_DIST) continue;
          ctx.strokeStyle = 'rgba(0,212,255,' + ((1 - d / LINK_DIST) * 0.22).toFixed(3) + ')';
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }

      for (const p of nodes) {
        const glow = reduced ? 0.5 : Math.sin(t * 1.2 + p.ph) * 0.18 + 0.5;
        ctx.fillStyle = 'rgba(0,212,255,' + glow.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const s of pulses) {
        if (s.j < 0) continue;
        const a = nodes[s.i], b = nodes[s.j];
        const x = a.x + (b.x - a.x) * s.t, y = a.y + (b.y - a.y) * s.t;
        ctx.fillStyle = 'rgba(255,107,53,' + (1 - s.t).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(x, y, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function frame(now) {
      raf = global.requestAnimationFrame(frame);
      const t = now / 1000;
      const dt = Math.min(t - last, 0.1);
      last = t;
      if (!reduced) step(dt, t);
      draw(t);
    }

    size();
    global.addEventListener('resize', size);
    last = performance.now() / 1000;
    if (reduced) {
      draw(0);                       /* one static frame, no loop */
    } else {
      raf = global.requestAnimationFrame(frame);
    }

    return {
      stop() { if (raf) global.cancelAnimationFrame(raf); raf = 0; },
    };
  }

  global.FINDParticles = { create: createParticles };
})(window);
