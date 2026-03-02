import { CNMode } from './types.ts';
import type { CNState } from './types.ts';

/** sEEG signal visualization state */
interface SEEGState {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  channels: SEEGChannel[];
  opacity: number;
  targetOpacity: number;
  mode: 'electrodes' | 'connectivity' | 'off';
  /* Phase 2 causal propagation state */
  causalTimer: number;
  causalSourceFired: boolean;
  causalPropagating: boolean;
}

interface SEEGChannel {
  label: string;
  buffer: Float32Array;
  writeIdx: number;
  freq: number;       // base oscillation frequency
  freq2: number;      // secondary frequency
  amp: number;        // base amplitude
  noiseAmp: number;   // noise level
  spikeProb: number;  // probability of an epileptiform spike per frame
  spikeDecay: number;
  phase: number;
  /* Phase 2 causal propagation */
  role: 'none' | 'source' | 'target' | 'bystander';
  causalDelay: number;     // frames of delay before responding to source
  causalCountdown: number; // frames remaining until this channel responds
  causalAtten: number;     // how much the propagated spike is attenuated (0-1)
}

const SEEG_CHANNELS = 8;
const BUFFER_LEN = 300;
const CHANNEL_LABELS = ['LA1', 'LA2', 'LA3', 'LH1', 'RH1', 'RA1', 'RA2', 'RA3'];

/* Phase 2 timing */
const CAUSAL_FIRE_INTERVAL = 1.6; // seconds between source bursts
const TARGET_DELAYS = [8, 14, 20, 28, 36]; // frame delays for each target channel
const TARGET_ATTENUATIONS = [0.85, 0.7, 0.6, 0.45, 0.35];

let state: SEEGState = {
  canvas: null,
  ctx: null,
  channels: [],
  opacity: 0,
  targetOpacity: 0,
  mode: 'off',
  causalTimer: 0,
  causalSourceFired: false,
  causalPropagating: false,
};

/** Initialize the sEEG display canvas and channel data */
export function initSEEG(): void {
  const canvas = document.getElementById('cn-seeg-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  state.canvas = canvas;
  state.ctx = ctx;

  state.channels = [];
  for (let i = 0; i < SEEG_CHANNELS; i++) {
    state.channels.push({
      label: CHANNEL_LABELS[i],
      buffer: new Float32Array(BUFFER_LEN),
      writeIdx: 0,
      freq: 3 + Math.random() * 8,
      freq2: 12 + Math.random() * 20,
      amp: 0.25 + Math.random() * 0.25,
      noiseAmp: 0.08 + Math.random() * 0.1,
      spikeProb: 0.003 + Math.random() * 0.005,
      spikeDecay: 0,
      phase: Math.random() * Math.PI * 2,
      role: 'none',
      causalDelay: 0,
      causalCountdown: -1,
      causalAtten: 0,
    });
  }
}

/** Assign roles for Phase 2: source, targets, bystanders */
function assignCausalRoles(): void {
  const chs = state.channels;
  // Channel 0 = source, 1-5 = targets with staggered delays, 6-7 = bystanders
  for (let i = 0; i < chs.length; i++) {
    if (i === 0) {
      chs[i].role = 'source';
      chs[i].causalDelay = 0;
      chs[i].causalAtten = 1;
    } else if (i <= 5) {
      chs[i].role = 'target';
      chs[i].causalDelay = TARGET_DELAYS[i - 1];
      chs[i].causalAtten = TARGET_ATTENUATIONS[i - 1];
    } else {
      chs[i].role = 'bystander';
      chs[i].causalDelay = 0;
      chs[i].causalAtten = 0;
    }
    chs[i].causalCountdown = -1;
  }
}

/** Reset all channels to Phase 1 independent mode */
function clearCausalRoles(): void {
  for (const ch of state.channels) {
    ch.role = 'none';
    ch.causalCountdown = -1;
    ch.spikeDecay = 0;
  }
}

// ---- Signal generation ----

/** Phase 1: independent channel signals */
function advancePhase1(elapsed: number): void {
  for (const ch of state.channels) {
    const base = Math.sin(elapsed * ch.freq + ch.phase) * ch.amp;
    const fast = Math.sin(elapsed * ch.freq2 + ch.phase * 2.3) * ch.amp * 0.3;
    const noise = (Math.random() - 0.5) * ch.noiseAmp * 2;

    let spike = 0;
    if (ch.spikeDecay > 0) {
      spike = ch.spikeDecay * 0.9 * (Math.random() > 0.5 ? 1 : -1);
      ch.spikeDecay *= 0.82;
      if (ch.spikeDecay < 0.02) ch.spikeDecay = 0;
    } else if (Math.random() < ch.spikeProb) {
      ch.spikeDecay = 0.6 + Math.random() * 0.4;
      spike = ch.spikeDecay;
    }

    ch.buffer[ch.writeIdx] = base + fast + noise + spike;
    ch.writeIdx = (ch.writeIdx + 1) % BUFFER_LEN;
  }
}

/** Phase 2: causal propagation - source fires, targets respond with delay */
function advancePhase2(elapsed: number, dt: number): void {
  state.causalTimer += dt;

  // Fire a new burst from source periodically
  if (state.causalTimer >= CAUSAL_FIRE_INTERVAL) {
    state.causalTimer = 0;
    state.causalSourceFired = true;
    state.causalPropagating = true;

    // Trigger source spike
    const src = state.channels[0];
    src.spikeDecay = 0.9;

    // Arm target countdowns
    for (const ch of state.channels) {
      if (ch.role === 'target') {
        ch.causalCountdown = ch.causalDelay;
      }
    }
  }

  // Advance each channel
  for (const ch of state.channels) {
    // Count down and fire targets
    if (ch.role === 'target' && ch.causalCountdown >= 0) {
      ch.causalCountdown--;
      if (ch.causalCountdown === 0) {
        ch.spikeDecay = 0.9 * ch.causalAtten;
        ch.causalCountdown = -1;
      }
    }

    if (ch.role === 'source') {
      // Source: moderate background + strong periodic bursts
      const base = Math.sin(elapsed * ch.freq + ch.phase) * ch.amp * 0.5;
      const noise = (Math.random() - 0.5) * ch.noiseAmp;
      let spike = 0;
      if (ch.spikeDecay > 0) {
        spike = ch.spikeDecay;
        ch.spikeDecay *= 0.85;
        if (ch.spikeDecay < 0.02) ch.spikeDecay = 0;
      }
      ch.buffer[ch.writeIdx] = base + noise + spike;

    } else if (ch.role === 'target') {
      // Targets: quiet background, respond to source with delay
      const base = Math.sin(elapsed * ch.freq + ch.phase) * ch.amp * 0.2;
      const noise = (Math.random() - 0.5) * ch.noiseAmp * 0.5;
      let spike = 0;
      if (ch.spikeDecay > 0) {
        spike = ch.spikeDecay;
        ch.spikeDecay *= 0.84;
        if (ch.spikeDecay < 0.02) ch.spikeDecay = 0;
      }
      ch.buffer[ch.writeIdx] = base + noise + spike;

    } else {
      // Bystanders: very quiet
      const noise = (Math.random() - 0.5) * ch.noiseAmp * 0.3;
      ch.buffer[ch.writeIdx] = noise;
    }

    ch.writeIdx = (ch.writeIdx + 1) % BUFFER_LEN;
  }
}

// ---- Drawing ----

/** Get channel color based on role and mode */
function getChannelColor(ch: SEEGChannel, alpha: number): string {
  if (state.mode === 'connectivity') {
    if (ch.role === 'source') return `rgba(239, 68, 68, ${alpha})`; // red
    if (ch.role === 'target') return `rgba(255, 160, 60, ${alpha})`; // orange
    return `rgba(0, 212, 255, ${alpha * 0.3})`; // dim cyan for bystanders
  }
  return `rgba(0, 212, 255, ${alpha})`; // Phase 1: all cyan
}

function getLabelColor(ch: SEEGChannel, alpha: number): string {
  if (state.mode === 'connectivity') {
    if (ch.role === 'source') return `rgba(239, 68, 68, ${alpha})`;
    if (ch.role === 'target') return `rgba(255, 160, 60, ${alpha})`;
    return `rgba(100, 120, 140, ${alpha * 0.5})`;
  }
  return `rgba(0, 180, 220, ${alpha})`;
}

function drawSignals(): void {
  const { canvas, ctx, channels } = state;
  if (!canvas || !ctx) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight;
  if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
    canvas.width = cssW * dpr;
    canvas.height = cssH * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  ctx.clearRect(0, 0, cssW, cssH);

  const chHeight = cssH / channels.length;
  const labelW = 32;
  const traceW = cssW - labelW - 4;

  for (let ci = 0; ci < channels.length; ci++) {
    const ch = channels[ci];
    const yCenter = chHeight * ci + chHeight * 0.5;

    // Channel label
    ctx.fillStyle = getLabelColor(ch, 0.3 * state.opacity);
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch.label, 2, yCenter);

    // Separator line
    if (ci > 0) {
      ctx.strokeStyle = `rgba(0, 180, 220, ${0.04 * state.opacity})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(labelW, chHeight * ci);
      ctx.lineTo(cssW, chHeight * ci);
      ctx.stroke();
    }

    // Determine trace opacity based on role
    let traceAlpha = 0.35;
    if (state.mode === 'connectivity') {
      if (ch.role === 'source') traceAlpha = 0.6;
      else if (ch.role === 'target') traceAlpha = 0.45;
      else traceAlpha = 0.1;
    }

    // Signal trace
    ctx.strokeStyle = getChannelColor(ch, traceAlpha * state.opacity);
    ctx.lineWidth = ch.role === 'source' ? 1.5 : 1;
    ctx.beginPath();

    const samplesVisible = Math.min(BUFFER_LEN, Math.floor(traceW / 1.2));
    const startIdx = (ch.writeIdx - samplesVisible + BUFFER_LEN) % BUFFER_LEN;

    for (let s = 0; s < samplesVisible; s++) {
      const idx = (startIdx + s) % BUFFER_LEN;
      const x = labelW + (s / samplesVisible) * traceW;
      const val = ch.buffer[idx];
      const y = yCenter + val * chHeight * 0.8;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Glow pass
    const glowAlpha = state.mode === 'connectivity' && ch.role === 'source' ? 0.2 : 0.12;
    ctx.strokeStyle = getChannelColor(ch, glowAlpha * state.opacity);
    ctx.lineWidth = ch.role === 'source' ? 4 : 3;
    ctx.beginPath();
    for (let s = 0; s < samplesVisible; s++) {
      const idx = (startIdx + s) % BUFFER_LEN;
      const x = labelW + (s / samplesVisible) * traceW;
      const val = ch.buffer[idx];
      const y = yCenter + val * chHeight * 0.8;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Phase 2: draw propagation arrows from source to active targets
    if (state.mode === 'connectivity' && ch.role === 'target' && ch.causalCountdown >= 0) {
      const srcY = chHeight * 0.5;
      const arrowX = cssW - 16;
      ctx.strokeStyle = `rgba(255, 160, 60, ${0.25 * state.opacity})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(arrowX, srcY);
      ctx.lineTo(arrowX, yCenter);
      ctx.stroke();
      // Arrowhead
      ctx.fillStyle = `rgba(255, 160, 60, ${0.3 * state.opacity})`;
      ctx.beginPath();
      ctx.moveTo(arrowX - 3, yCenter - 5);
      ctx.lineTo(arrowX + 3, yCenter - 5);
      ctx.lineTo(arrowX, yCenter);
      ctx.fill();
      ctx.setLineDash([]);
    }
  }
}

// ---- Public API ----

/** Per-frame update: generate samples and render */
export function updateSEEG(cn: CNState, elapsed: number): void {
  if (!state.canvas) return;

  // Determine mode and visibility
  const newMode = cn.mode === CNMode.Electrodes ? 'electrodes'
    : cn.mode === CNMode.Connectivity ? 'connectivity' : 'off';

  // Handle mode transitions
  if (newMode !== state.mode) {
    if (newMode === 'connectivity') {
      assignCausalRoles();
      state.causalTimer = CAUSAL_FIRE_INTERVAL * 0.8; // fire soon after entering
    } else if (state.mode === 'connectivity') {
      clearCausalRoles();
    }
    state.mode = newMode;
  }

  state.targetOpacity = (newMode === 'electrodes' || newMode === 'connectivity') ? 1 : 0;

  // Smooth opacity transitions
  const speed = 0.06;
  if (state.opacity < state.targetOpacity) {
    state.opacity = Math.min(state.targetOpacity, state.opacity + speed);
  } else if (state.opacity > state.targetOpacity) {
    state.opacity = Math.max(state.targetOpacity, state.opacity - speed);
  }

  if (state.opacity < 0.01) {
    state.canvas.style.display = 'none';
    return;
  }
  state.canvas.style.display = 'block';
  state.canvas.style.opacity = String(state.opacity);

  // Advance signals based on current mode
  const dt = 0.016; // approximate frame time
  if (state.mode === 'connectivity') {
    advancePhase2(elapsed, dt);
    advancePhase2(elapsed + dt, dt); // 2 samples per frame
  } else {
    advancePhase1(elapsed);
    advancePhase1(elapsed + dt);
  }

  drawSignals();
}
