import type { TooltipApi } from '../types';

interface NodeDef { id: string; x: number; y: number; type: string; lbl: string }
interface EdgeDef { fr: string; to: string; baseline: boolean; ictal: boolean }
interface Feat { label: string; shap: number; tier: number }

const NODES: NodeDef[] = [
  { id: 'C',  x: 120, y: 95,  type: 'crit',     lbl: 'C*' },
  { id: 'A1', x: 45,  y: 40,  type: 'clusterA',  lbl: 'A\u2081' },
  { id: 'A2', x: 18,  y: 95,  type: 'clusterA',  lbl: 'A\u2082' },
  { id: 'A3', x: 45,  y: 150, type: 'clusterA',  lbl: 'A\u2083' },
  { id: 'B1', x: 195, y: 40,  type: 'clusterB',  lbl: 'B\u2081' },
  { id: 'B2', x: 222, y: 95,  type: 'clusterB',  lbl: 'B\u2082' },
  { id: 'B3', x: 195, y: 150, type: 'clusterB',  lbl: 'B\u2083' },
];

const EDGES: EdgeDef[] = [
  { fr: 'A1', to: 'A2', baseline: true,  ictal: true },
  { fr: 'A2', to: 'A3', baseline: true,  ictal: true },
  { fr: 'A1', to: 'A3', baseline: true,  ictal: true },
  { fr: 'B1', to: 'B2', baseline: true,  ictal: true },
  { fr: 'B2', to: 'B3', baseline: true,  ictal: true },
  { fr: 'B1', to: 'B3', baseline: true,  ictal: true },
  { fr: 'C',  to: 'A1', baseline: true,  ictal: true },
  { fr: 'C',  to: 'A2', baseline: false, ictal: true },
  { fr: 'C',  to: 'A3', baseline: false, ictal: true },
  { fr: 'C',  to: 'B1', baseline: false, ictal: true },
  { fr: 'C',  to: 'B2', baseline: false, ictal: true },
  { fr: 'C',  to: 'B3', baseline: false, ictal: true },
  { fr: 'A1', to: 'B1', baseline: false, ictal: true },
];

const FEATS: Feat[] = [
  { label: '\u0394 Betweenness',  shap: 0.390, tier: 1 },
  { label: '\u0394 Eigenvector',  shap: 0.366, tier: 1 },
  { label: '\u0394 Clustering',   shap: 0.316, tier: 1 },
  { label: 'Temporal BC',         shap: 0.270, tier: 2 },
  { label: 'catch22 #1',          shap: 0.190, tier: 3 },
  { label: 'HFO-adj #1',          shap: 0.145, tier: 3 },
];

const CRIT = '#f97316';
const TEAL = '#14b8a6';
const PURPLE = '#818cf8';
const GRAY_FEAT = '#9ca3af';
const EDGE_DIM = '#d1d5db';
const EDGE_NEW = '#f97316';
const NODE_A = '#14b8a6';
const NODE_B = '#818cf8';
const TIER_C: Record<number, string> = { 1: TEAL, 2: PURPLE, 3: GRAY_FEAT };

function nodeById(id: string): NodeDef {
  return NODES.find(n => n.id === id)!;
}

function drawNetwork(
  parent: ReturnType<typeof d3.select<SVGGElement, unknown>>,
  ictal: boolean,
  title: string,
  subtitle: string,
): void {
  // Title
  parent.append('text')
    .attr('x', 120).attr('y', -8)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px').attr('font-weight', '600')
    .attr('fill', ictal ? CRIT : '#475569')
    .text(title);
  parent.append('text')
    .attr('x', 120).attr('y', 6)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('fill', '#94a3b8')
    .attr('font-family', "'JetBrains Mono', monospace")
    .text(subtitle);

  // Cluster labels
  parent.append('text')
    .attr('x', 40).attr('y', 24)
    .attr('text-anchor', 'middle')
    .attr('font-size', '8px').attr('fill', NODE_A + '99')
    .attr('font-family', "'JetBrains Mono', monospace")
    .text('Cluster A');
  parent.append('text')
    .attr('x', 200).attr('y', 24)
    .attr('text-anchor', 'middle')
    .attr('font-size', '8px').attr('fill', NODE_B + '99')
    .attr('font-family', "'JetBrains Mono', monospace")
    .text('Cluster B');

  // Edges
  EDGES.forEach((e, i) => {
    const show = ictal ? e.ictal : e.baseline;
    if (!show) return;
    const n1 = nodeById(e.fr), n2 = nodeById(e.to);
    const isNew = !e.baseline && e.ictal;
    const isCross = (e.fr === 'A1' && e.to === 'B1');
    const highlight = ictal && (isNew || isCross);
    const line = parent.append('line')
      .attr('x1', n1.x).attr('y1', n1.y)
      .attr('x2', n2.x).attr('y2', n2.y)
      .attr('stroke', highlight ? EDGE_NEW : EDGE_DIM)
      .attr('stroke-width', highlight ? 2.5 : 1.2)
      .attr('stroke-opacity', highlight ? 0.9 : 0.5);
    if (ictal && isNew) {
      line.attr('stroke-opacity', 0)
        .transition().delay(300 + i * 40).duration(400)
        .attr('stroke-opacity', 0.9);
    }
  });

  // Nodes
  NODES.forEach((nd, i) => {
    const isCrit = nd.type === 'crit';
    const r = isCrit ? 14 : 10;
    const fill = isCrit ? CRIT : nd.type === 'clusterA' ? NODE_A : NODE_B;

    // Glow for critical node in ictal
    if (isCrit && ictal) {
      parent.append('circle')
        .attr('cx', nd.x).attr('cy', nd.y).attr('r', 24)
        .attr('fill', CRIT).attr('opacity', 0)
        .transition().delay(600).duration(500)
        .attr('opacity', 0.12);
      parent.append('circle')
        .attr('cx', nd.x).attr('cy', nd.y).attr('r', 18)
        .attr('fill', 'none').attr('stroke', CRIT)
        .attr('stroke-width', 1.5).attr('opacity', 0)
        .transition().delay(600).duration(500)
        .attr('opacity', 0.3);
    }

    parent.append('circle')
      .attr('cx', nd.x).attr('cy', nd.y).attr('r', r)
      .attr('fill', fill).attr('fill-opacity', 0.9);

    parent.append('text')
      .attr('x', nd.x).attr('y', nd.y + 1)
      .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
      .attr('font-size', isCrit ? '9px' : '8px')
      .attr('font-weight', isCrit ? '700' : '400')
      .attr('fill', isCrit ? '#fff' : '#fff')
      .attr('font-family', "'JetBrains Mono', monospace")
      .style('pointer-events', 'none')
      .text(nd.lbl);
  });

  // Connection count for C*
  const cDeg = EDGES.filter(e =>
    (e.fr === 'C' || e.to === 'C') && (ictal ? e.ictal : e.baseline)
  ).length;
  parent.append('text')
    .attr('x', 120).attr('y', 176)
    .attr('text-anchor', 'middle')
    .attr('font-size', '9px')
    .attr('fill', '#94a3b8')
    .attr('font-family', "'JetBrains Mono', monospace")
    .html(`C* degree: <tspan fill="${ictal ? CRIT : '#475569'}" font-weight="600">${cDeg}</tspan>`);
}

export function renderShapNetwork(tip: TooltipApi): void {
  const el = document.getElementById('chart-shapNetwork');
  if (!el) return;
  el.innerHTML = '';

  const cw = el.clientWidth - 24;
  const totalH = 400;
  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${cw} ${totalH}`)
    .attr('width', '100%');

  // --- Network diagrams: side by side ---
  const netW = 240;
  const netH = 190;
  const netGap = 60;
  const netTotalW = netW * 2 + netGap;
  const netOffX = (cw - netTotalW) / 2;
  const netOffY = 20;

  const baseG = svg.append('g')
    .attr('transform', `translate(${netOffX}, ${netOffY})`) as any;
  drawNetwork(baseG, false, 'Inter-ictal Baseline', 'C* degree = 1');

  const ictalG = svg.append('g')
    .attr('transform', `translate(${netOffX + netW + netGap}, ${netOffY})`) as any;
  drawNetwork(ictalG, true, 'Seizure Onset', 'C* degree = 6');

  // Arrow between networks
  const arrowX = netOffX + netW + netGap / 2;
  const arrowY = netOffY + netH / 2 - 5;
  svg.append('text')
    .attr('x', arrowX).attr('y', arrowY)
    .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
    .attr('font-size', '28px').attr('fill', CRIT)
    .text('\u2192');
  svg.append('text')
    .attr('x', arrowX).attr('y', arrowY + 18)
    .attr('text-anchor', 'middle')
    .attr('font-size', '8px').attr('fill', '#94a3b8')
    .attr('font-family', "'JetBrains Mono', monospace")
    .text('seizure');

  // --- Feature hierarchy bars ---
  const barsY = netOffY + netH + 28;
  const barsH = totalH - barsY - 12;
  const barsMarginL = 110;
  const barsMarginR = 55;
  const barsW = cw - barsMarginL - barsMarginR;
  const barG = svg.append('g')
    .attr('transform', `translate(${barsMarginL}, ${barsY})`);

  // Section label
  barG.append('text')
    .attr('x', -barsMarginL + 8).attr('y', -6)
    .attr('font-size', '10px').attr('font-weight', '600')
    .attr('fill', '#475569')
    .text('Mean |SHAP| Attribution');

  const barH = Math.min(22, (barsH - 24) / FEATS.length);
  const barPad = 4;
  const x = d3.scaleLinear().domain([0, 0.42]).range([0, barsW]);

  // Tier gap lines
  barG.append('line')
    .attr('x1', x(0.27)).attr('x2', x(0.27))
    .attr('y1', 4).attr('y2', FEATS.length * (barH + barPad))
    .attr('stroke', PURPLE).attr('stroke-width', 0.8)
    .attr('stroke-dasharray', '3,3').attr('opacity', 0.5);
  barG.append('line')
    .attr('x1', x(0.19)).attr('x2', x(0.19))
    .attr('y1', 4).attr('y2', FEATS.length * (barH + barPad))
    .attr('stroke', GRAY_FEAT).attr('stroke-width', 0.8)
    .attr('stroke-dasharray', '3,3').attr('opacity', 0.5);

  FEATS.forEach((f, i) => {
    const cy = i * (barH + barPad) + barH / 2;
    const col = TIER_C[f.tier];

    // Label
    barG.append('text')
      .attr('x', -8).attr('y', cy + 1)
      .attr('text-anchor', 'end').attr('dominant-baseline', 'middle')
      .attr('font-size', '10px').attr('fill', '#475569')
      .attr('font-family', "'JetBrains Mono', monospace")
      .text(f.label);

    // Bar
    barG.append('rect')
      .attr('x', 0).attr('y', cy - barH / 2 + 1)
      .attr('width', 0).attr('height', barH - 2)
      .attr('fill', col).attr('opacity', 0.85).attr('rx', 3)
      .transition().delay(200 + i * 80).duration(500).ease(d3.easeCubicOut)
      .attr('width', x(f.shap));

    // Value label
    barG.append('text')
      .attr('x', x(f.shap) + 6).attr('y', cy + 1)
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '9px').attr('fill', '#94a3b8')
      .attr('font-family', "'JetBrains Mono', monospace")
      .attr('opacity', 0)
      .text(f.shap.toFixed(3))
      .transition().delay(400 + i * 80).duration(300)
      .attr('opacity', 1);
  });

  // Tier legend
  const legG = barG.append('g')
    .attr('transform', `translate(${barsW - 180}, ${FEATS.length * (barH + barPad) + 10})`);
  [
    { col: TEAL, label: 'Tier 1: Network topology' },
    { col: PURPLE, label: 'Tier 2: Static position' },
    { col: GRAY_FEAT, label: 'Tier 3: Waveform / HFO' },
  ].forEach((t, i) => {
    legG.append('rect')
      .attr('x', i * 140).attr('y', 0)
      .attr('width', 8).attr('height', 8).attr('rx', 2)
      .attr('fill', t.col);
    legG.append('text')
      .attr('x', i * 140 + 12).attr('y', 7)
      .attr('font-size', '8px').attr('fill', '#94a3b8')
      .text(t.label);
  });
}
