import { CNMode } from './types.ts';
import type { CNState } from './types.ts';

/** sEEG signal visualization state */
interface SEEGState {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  channels: SEEGChannel[];
  opacity: number;
  targetOpacity: number;
}

interface SEEGChannel {
  label: string;
  buffer: Float32Array;
  writeIdx: number;
  freq: number;      // base oscillation frequency
  freq2: number;     // secondary frequency
  amp: number;       // base amplitude
  noiseAmp: number;  // noise level
  spikeProb: number; // probability of an epileptiform spike per frame
  spikeDecay: number;
  phase: number;
}

const SEEG_CHANNELS = 8;
const BUFFER_LEN = 300;
const CHANNEL_LABELS = ['LA1', 'LA2', 'LA3', 'LH1', 'RH1', 'RA1', 'RA2', 'RA3'];

let state: SEEGState = {
  canvas: null,
  ctx: null,
  channels: [],
  opacity: 0,
  targetOpacity: 0,
};

/** Initialize the sEEG display canvas and channel data */
export function initSEEG(): void {
  const canvas = document.getElementById('cn-seeg-canvas') as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  state.canvas = canvas;
  state.ctx = ctx;

  // Create channels with varied signal characteristics
  state.channels = [];
  for (let i = 0; i < SEEG_CHANNELS; i++) {
    const buf = new Float32Array(BUFFER_LEN);
    state.channels.push({
      label: CHANNEL_LABELS[i],
      buffer: buf,
      writeIdx: 0,
      freq: 3 + Math.random() * 8,
      freq2: 12 + Math.random() * 20,
      amp: 0.25 + Math.random() * 0.25,
      noiseAmp: 0.08 + Math.random() * 0.1,
      spikeProb: 0.003 + Math.random() * 0.005,
      spikeDecay: 0,
      phase: Math.random() * Math.PI * 2,
    });
  }
}

/** Generate one new sample per channel and advance the ring buffer */
function advanceSignals(elapsed: number): void {
  for (const ch of state.channels) {
    // Base oscillation (theta/alpha range feel)
    const base = Math.sin(elapsed * ch.freq + ch.phase) * ch.amp;
    // Faster overlay (beta)
    const fast = Math.sin(elapsed * ch.freq2 + ch.phase * 2.3) * ch.amp * 0.3;
    // Random noise
    const noise = (Math.random() - 0.5) * ch.noiseAmp * 2;

    // Epileptiform sharp wave
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

/** Draw all channels to the sEEG canvas */
function drawSignals(): void {
  const { canvas, ctx, channels } = state;
  if (!canvas || !ctx) return;

  // Size canvas to CSS size (handle DPR for crisp lines)
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
    ctx.fillStyle = `rgba(0, 180, 220, ${0.5 * state.opacity})`;
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch.label, 2, yCenter);

    // Separator line
    if (ci > 0) {
      ctx.strokeStyle = `rgba(0, 180, 220, ${0.06 * state.opacity})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(labelW, chHeight * ci);
      ctx.lineTo(cssW, chHeight * ci);
      ctx.stroke();
    }

    // Signal trace
    ctx.strokeStyle = `rgba(0, 212, 255, ${0.7 * state.opacity})`;
    ctx.lineWidth = 1;
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

    // Glow pass for spikes (thicker, more transparent)
    ctx.strokeStyle = `rgba(0, 212, 255, ${0.2 * state.opacity})`;
    ctx.lineWidth = 3;
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
  }
}

/** Per-frame update: generate samples and render (called from animation loop) */
export function updateSEEG(cn: CNState, elapsed: number): void {
  if (!state.canvas) return;

  // Show only during Phase 1
  state.targetOpacity = cn.mode === CNMode.Electrodes ? 1 : 0;

  // Smooth opacity transitions
  const speed = 0.06;
  if (state.opacity < state.targetOpacity) {
    state.opacity = Math.min(state.targetOpacity, state.opacity + speed);
  } else if (state.opacity > state.targetOpacity) {
    state.opacity = Math.max(state.targetOpacity, state.opacity - speed);
  }

  // Toggle visibility
  if (state.opacity < 0.01) {
    state.canvas.style.display = 'none';
    return;
  }
  state.canvas.style.display = 'block';
  state.canvas.style.opacity = String(state.opacity);

  // Advance 2-3 samples per frame for smooth scrolling feel
  advanceSignals(elapsed);
  advanceSignals(elapsed + 0.016);
  drawSignals();
}
