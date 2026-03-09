import type { TooltipApi } from '../types';
import { chartDims } from '../chart-utils';

interface PhaseRow {
  phase: string;
  label: string;
  highMs: number;
  lowMs: number;
  p: string;
}

const DATA: PhaseRow[] = [
  { phase: 'pre', label: 'Pre-ictal', highMs: 17.0, lowMs: 12.8, p: '2.3e-15' },
  { phase: 'peri', label: 'Peri-ictal', highMs: 12.0, lowMs: 14.67, p: '1.9e-9' },
  { phase: 'post', label: 'Post-ictal', highMs: 10.0, lowMs: 16.0, p: '2.9e-41' },
];

const HIGH_COLOR = '#ef4444';
const LOW_COLOR = '#3b82f6';

export function renderFlowOrder(tip: TooltipApi): void {
  const el = document.getElementById('chart-flowOrder');
  if (!el) return;
  el.innerHTML = '';

  const { w, h, m } = chartDims(el, 0.75);
  const adjM = { top: m.top + 8, right: m.right + 8, bottom: m.bottom + 4, left: m.left + 4 };
  const iw = w - adjM.left - adjM.right;
  const ih = h - adjM.top - adjM.bottom;

  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`);
  const g = svg.append('g').attr('transform', `translate(${adjM.left},${adjM.top})`);

  const x = d3.scaleBand<string>()
    .domain(DATA.map(d => d.label))
    .range([0, iw])
    .padding(0.35);

  const y = d3.scaleLinear()
    .domain([0, 20])
    .range([ih, 0]);

  const barW = Math.min(x.bandwidth() * 0.4, 36);

  // Grid
  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).ticks(5).tickSize(-iw).tickFormat('' as any))
    .selectAll('line').attr('stroke', '#b0b0b0').attr('stroke-opacity', 0.3).attr('stroke-width', 0.8);
  g.select('.grid path').attr('stroke', 'none');

  // Axes
  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5));

  g.append('text').attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -38).attr('text-anchor', 'middle')
    .text('Median arrival delay (ms)');

  // Bars - high-critical
  DATA.forEach((d, i) => {
    const cx = x(d.label)! + x.bandwidth() / 2;
    const highX = cx - barW - 2;
    const lowX = cx + 2;

    // High-critical bar
    const hBar = g.append('rect')
      .attr('x', highX).attr('y', y(0)).attr('width', barW).attr('height', 0)
      .attr('fill', HIGH_COLOR).attr('fill-opacity', 0.8)
      .attr('rx', 2)
      .style('cursor', 'pointer');
    hBar.transition().duration(600).delay(i * 150)
      .attr('y', y(d.highMs)).attr('height', ih - y(d.highMs));

    // Low-critical bar
    const lBar = g.append('rect')
      .attr('x', lowX).attr('y', y(0)).attr('width', barW).attr('height', 0)
      .attr('fill', LOW_COLOR).attr('fill-opacity', 0.8)
      .attr('rx', 2)
      .style('cursor', 'pointer');
    lBar.transition().duration(600).delay(i * 150 + 80)
      .attr('y', y(d.lowMs)).attr('height', ih - y(d.lowMs));

    // Value labels on bars
    const hLabel = g.append('text')
      .attr('x', highX + barW / 2).attr('y', y(d.highMs) - 5)
      .attr('text-anchor', 'middle').attr('fill', '#333')
      .attr('font-size', '10px').attr('font-weight', '600')
      .attr('opacity', 0)
      .text(`${d.highMs}`);
    hLabel.transition().delay(600 + i * 150).duration(300).attr('opacity', 1);

    const lLabel = g.append('text')
      .attr('x', lowX + barW / 2).attr('y', y(d.lowMs) - 5)
      .attr('text-anchor', 'middle').attr('fill', '#333')
      .attr('font-size', '10px').attr('font-weight', '600')
      .attr('opacity', 0)
      .text(`${d.lowMs}`);
    lLabel.transition().delay(680 + i * 150).duration(300).attr('opacity', 1);

    // Direction indicator
    const isHighEarlier = d.highMs < d.lowMs;
    const arrow = isHighEarlier ? '\u25B2' : '\u25BC';
    const arrowColor = isHighEarlier ? '#16a34a' : '#dc2626';
    const arrowLabel = isHighEarlier ? 'Critical earlier' : 'Critical later';
    const arrowG = g.append('g').attr('opacity', 0);
    arrowG.transition().delay(900 + i * 150).duration(300).attr('opacity', 1);
    arrowG.append('text')
      .attr('x', cx).attr('y', ih + 32)
      .attr('text-anchor', 'middle').attr('fill', arrowColor)
      .attr('font-size', '9px').attr('font-weight', '600')
      .text(`${arrow} ${arrowLabel}`);

    // Tooltips
    hBar.on('mousemove', (evt: MouseEvent) => {
      tip.show(evt,
        `<span class="tt-label">${d.label} - High-critical</span><br>` +
        `<span class="tt-label">Median delay:</span> <span class="tt-val">${d.highMs} ms</span><br>` +
        `<span class="tt-label">CS >= 0.15 (n=1267)</span><br>` +
        `<span class="tt-label">MW p:</span> <span class="tt-val">${d.p}</span>`
      );
    }).on('mouseleave', tip.hide);

    lBar.on('mousemove', (evt: MouseEvent) => {
      tip.show(evt,
        `<span class="tt-label">${d.label} - Low-critical</span><br>` +
        `<span class="tt-label">Median delay:</span> <span class="tt-val">${d.lowMs} ms</span><br>` +
        `<span class="tt-label">CS < 0.15 (n=4339)</span><br>` +
        `<span class="tt-label">MW p:</span> <span class="tt-val">${d.p}</span>`
      );
    }).on('mouseleave', tip.hide);
  });

  // Connecting lines across phases
  const highLine = d3.line<PhaseRow>()
    .x(d => x(d.label)! + x.bandwidth() / 2 - barW / 2 - 2)
    .y(d => y(d.highMs));
  const lowLine = d3.line<PhaseRow>()
    .x(d => x(d.label)! + x.bandwidth() / 2 + barW / 2 + 2)
    .y(d => y(d.lowMs));

  const hPath = g.append('path').datum(DATA)
    .attr('fill', 'none').attr('stroke', HIGH_COLOR)
    .attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3')
    .attr('d', highLine).attr('opacity', 0);
  hPath.transition().delay(1100).duration(400).attr('opacity', 0.7);

  const lPath = g.append('path').datum(DATA)
    .attr('fill', 'none').attr('stroke', LOW_COLOR)
    .attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3')
    .attr('d', lowLine).attr('opacity', 0);
  lPath.transition().delay(1100).duration(400).attr('opacity', 0.7);

  // Legend
  const leg = g.append('g').attr('transform', `translate(${iw - 148}, 4)`);
  leg.append('rect')
    .attr('x', -8).attr('y', -10)
    .attr('width', 156).attr('height', 46)
    .attr('fill', 'rgba(255,255,255,0.8)').attr('stroke', '#ccc').attr('rx', 4);
  [
    { c: HIGH_COLOR, l: 'High-critical (CS>=0.15)' },
    { c: LOW_COLOR, l: 'Low-critical (CS<0.15)' },
  ].forEach(({ c, l }, i) => {
    leg.append('rect')
      .attr('x', 0).attr('y', i * 18 - 5)
      .attr('width', 14).attr('height', 10)
      .attr('fill', c).attr('fill-opacity', 0.8).attr('rx', 2);
    leg.append('text').attr('x', 20).attr('y', i * 18 + 4)
      .attr('fill', '#333').attr('font-size', '10px').text(l);
  });
}
