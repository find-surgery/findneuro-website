import type { TooltipApi, FailurePatient, BoxStats } from '../types';
import { boxStats } from '../chart-utils';
import { COLORS } from '../constants';
import { CHART_DATA } from '../data';

export function renderFailureChart(tip: TooltipApi): void {
  const el = document.getElementById('chart-failure');
  if (!el) return;
  el.innerHTML = '';

  const cw = el.clientWidth - 16;
  const ch = Math.round(cw * 0.55);
  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${cw} ${ch}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // -- LEFT PANEL: Box plots --
  const lm = { top: 20, right: 10, bottom: 40, left: 44 };
  const lw = Math.round(cw * 0.42) - lm.left - lm.right;
  const lh = ch - lm.top - lm.bottom;
  const gL = svg.append('g').attr('transform', `translate(${lm.left},${lm.top})`);

  const allPts = CHART_DATA.fig6.patients;
  const favD = allPts.filter(p => p.o === 'F').map(p => p.d).sort(d3.ascending);
  const unfD = allPts.filter(p => p.o === 'U').map(p => p.d).sort(d3.ascending);

  const favBox = boxStats(favD);
  const unfBox = boxStats(unfD);

  const allDeltaMean = allPts.map(p => p.d);
  const yMin = Math.floor(d3.min(allDeltaMean)! * 10) / 10;
  const yMax = Math.ceil(d3.max(allDeltaMean)! * 10) / 10;
  const yL = d3.scaleLinear().domain([yMin, yMax]).range([lh, 0]);
  const boxW = lw * 0.22;

  // Grid lines
  gL.append('g').attr('class', 'grid')
    .call(d3.axisLeft(yL).ticks(5).tickSize(-lw).tickFormat('' as any))
    .selectAll('line').attr('stroke', '#b0b0b0').attr('stroke-opacity', 0.3).attr('stroke-width', 0.8);
  gL.select('.grid path').attr('stroke', 'none');

  gL.append('g').attr('class', 'axis')
    .call(d3.axisLeft(yL).ticks(5).tickFormat(d => (d as number).toFixed(1)));

  const favCx = lw * 0.3;
  const unfCx = lw * 0.7;
  gL.append('line').attr('x1', 0).attr('x2', lw).attr('y1', lh).attr('y2', lh)
    .attr('stroke', '#000').attr('stroke-width', 0.8);
  gL.append('text').attr('x', favCx).attr('y', lh + 16)
    .attr('text-anchor', 'middle').attr('fill', '#000').attr('font-size', '11px')
    .text('Favorable');
  gL.append('text').attr('x', unfCx).attr('y', lh + 16)
    .attr('text-anchor', 'middle').attr('fill', '#000').attr('font-size', '11px')
    .text('Unfavorable');

  gL.append('text').attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -lh / 2).attr('y', -34).attr('text-anchor', 'middle')
    .text('Delta mean (In SZ - Out SZ)');

  gL.append('text')
    .attr('x', lw / 2).attr('y', -6).attr('text-anchor', 'middle')
    .attr('fill', '#000').attr('font-size', '12px').attr('font-weight', '500')
    .text('Distribution separation by outcome');

  function drawBox(
    parentG: import('d3').Selection<SVGGElement, unknown, null, undefined>,
    cx: number,
    stats: BoxStats,
    color: string
  ) {
    const bG = parentG.append('g').attr('opacity', 0);
    bG.transition().duration(600).attr('opacity', 1);
    bG.append('rect')
      .attr('x', cx - boxW / 2).attr('y', yL(stats.q3))
      .attr('width', boxW).attr('height', yL(stats.q1) - yL(stats.q3))
      .attr('fill', color).attr('fill-opacity', 0.35)
      .attr('stroke', '#000').attr('stroke-width', 1);
    bG.append('line')
      .attr('x1', cx - boxW / 2).attr('x2', cx + boxW / 2)
      .attr('y1', yL(stats.med)).attr('y2', yL(stats.med))
      .attr('stroke', '#000').attr('stroke-width', 1.5);
    bG.append('line')
      .attr('x1', cx).attr('x2', cx)
      .attr('y1', yL(stats.q1)).attr('y2', yL(stats.lo))
      .attr('stroke', '#000').attr('stroke-width', 1);
    bG.append('line')
      .attr('x1', cx - boxW * 0.35).attr('x2', cx + boxW * 0.35)
      .attr('y1', yL(stats.lo)).attr('y2', yL(stats.lo))
      .attr('stroke', '#000').attr('stroke-width', 1);
    bG.append('line')
      .attr('x1', cx).attr('x2', cx)
      .attr('y1', yL(stats.q3)).attr('y2', yL(stats.hi))
      .attr('stroke', '#000').attr('stroke-width', 1);
    bG.append('line')
      .attr('x1', cx - boxW * 0.35).attr('x2', cx + boxW * 0.35)
      .attr('y1', yL(stats.hi)).attr('y2', yL(stats.hi))
      .attr('stroke', '#000').attr('stroke-width', 1);
    stats.outliers.forEach(v => {
      bG.append('circle')
        .attr('cx', cx).attr('cy', yL(v)).attr('r', 3)
        .attr('fill', 'none').attr('stroke', '#000').attr('stroke-width', 1);
    });
    return bG;
  }

  const favBG = drawBox(gL as any, favCx, favBox, COLORS.favorable);
  const unfBG = drawBox(gL as any, unfCx, unfBox, COLORS.unfavorable);

  favBG.style('cursor', 'pointer')
    .on('mousemove', (evt: MouseEvent) => {
      tip.show(evt,
        `<span class="tt-label">Favorable (n=${favD.length})</span><br>` +
        `<span class="tt-label">Median:</span> <span class="tt-val">${favBox.med.toFixed(3)}</span><br>` +
        `<span class="tt-label">Q1-Q3:</span> <span class="tt-val">${favBox.q1.toFixed(3)}-${favBox.q3.toFixed(3)}</span>`
      );
    }).on('mouseleave', tip.hide);
  unfBG.style('cursor', 'pointer')
    .on('mousemove', (evt: MouseEvent) => {
      tip.show(evt,
        `<span class="tt-label">Unfavorable (n=${unfD.length})</span><br>` +
        `<span class="tt-label">Median:</span> <span class="tt-val">${unfBox.med.toFixed(3)}</span><br>` +
        `<span class="tt-label">Q1-Q3:</span> <span class="tt-val">${unfBox.q1.toFixed(3)}-${unfBox.q3.toFixed(3)}</span>`
      );
    }).on('mouseleave', tip.hide);

  // -- RIGHT PANEL: Scatter plot --
  const rm = { top: 20, right: 16, bottom: 40, left: 48 };
  const rx0 = Math.round(cw * 0.46);
  const rw = cw - rx0 - rm.left - rm.right;
  const rh = ch - rm.top - rm.bottom;
  const gR = svg.append('g').attr('transform', `translate(${rx0 + rm.left},${rm.top})`);

  const pts = allPts.filter(d => d.f !== null) as (FailurePatient & { f: number })[];
  const xR = d3.scaleLinear().domain([yMin, 0.9]).range([0, rw]);
  const yR = d3.scaleLinear().domain([0, 1]).range([rh, 0]);

  gR.append('g').attr('class', 'grid').attr('transform', `translate(0,${rh})`)
    .call(d3.axisBottom(xR).tickSize(-rh).tickFormat('' as any));
  gR.append('g').attr('class', 'grid')
    .call(d3.axisLeft(yR).tickSize(-rw).tickFormat('' as any));

  gR.append('g').attr('class', 'axis').attr('transform', `translate(0,${rh})`)
    .call(d3.axisBottom(xR).ticks(5).tickFormat(d => (d as number).toFixed(1)));
  gR.append('g').attr('class', 'axis')
    .call(d3.axisLeft(yR).ticks(5).tickFormat(d => (d as number).toFixed(1)));

  gR.append('text').attr('class', 'axis-label')
    .attr('x', rw / 2).attr('y', rh + 34).attr('text-anchor', 'middle')
    .text('Delta mean (In SZ - Out SZ)');
  gR.append('text').attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -rh / 2).attr('y', -38).attr('text-anchor', 'middle')
    .text('Outside-high fraction');

  gR.append('text')
    .attr('x', rw / 2).attr('y', -6).attr('text-anchor', 'middle')
    .attr('fill', '#000').attr('font-size', '12px').attr('font-weight', '500')
    .text('Failure-pattern map by patient');

  // Reference lines
  const medDelta = d3.median(pts, d => d.d)!;
  gR.append('line')
    .attr('x1', xR(medDelta)).attr('x2', xR(medDelta))
    .attr('y1', 0).attr('y2', rh)
    .attr('stroke', COLORS.dashRef).attr('stroke-width', 1)
    .attr('stroke-dasharray', '3.7,1.6');
  gR.append('line')
    .attr('x1', 0).attr('x2', rw)
    .attr('y1', yR(0.6)).attr('y2', yR(0.6))
    .attr('stroke', COLORS.dashRef).attr('stroke-width', 1)
    .attr('stroke-dasharray', '3.7,1.6');

  // Dots
  type ScatterPt = FailurePatient & { f: number };
  const dots = gR.selectAll<SVGCircleElement, ScatterPt>('.dot').data(pts).enter().append('circle')
    .attr('cx', d => xR(d.d)).attr('cy', rh / 2)
    .attr('r', 0)
    .attr('fill', d => d.o === 'F' ? COLORS.favorable : COLORS.unfavorable)
    .attr('fill-opacity', 0.85)
    .attr('stroke', '#ffffff').attr('stroke-opacity', 0.85).attr('stroke-width', 0.5)
    .style('cursor', 'pointer');

  dots.transition().duration(800).delay((_d, i) => i * 12)
    .attr('r', 5)
    .attr('cy', d => yR(d.f));

  dots.on('mousemove', (evt: MouseEvent, d: ScatterPt) => {
    const outcome = d.o === 'F' ? 'Favorable' : 'Unfavorable';
    const cls = d.o === 'F' ? 'green' : 'red';
    tip.show(evt,
      `<span class="tt-label">Outcome:</span> <span class="tt-val ${cls}">${outcome}</span><br>` +
      `<span class="tt-label">Delta-mean:</span> <span class="tt-val">${d.d.toFixed(3)}</span><br>` +
      `<span class="tt-label">Frac. outside:</span> <span class="tt-val">${(d.f*100).toFixed(1)}%</span>`
    );
  }).on('mouseleave', tip.hide);

  // Legend
  const leg = gR.append('g').attr('transform', `translate(${rw - 148}, 6)`);
  leg.append('rect')
    .attr('x', -8).attr('y', -10)
    .attr('width', 156).attr('height', 46)
    .attr('fill', 'rgba(255,255,255,0.7)').attr('stroke', '#ccc').attr('rx', 4);
  [{c:COLORS.favorable,l:'Favorable (I/II)'},{c:COLORS.unfavorable,l:'Unfavorable (III/IV)'}].forEach(({c,l}, i) => {
    leg.append('circle').attr('cx', 5).attr('cy', i * 18).attr('r', 5).attr('fill', c).attr('opacity', 0.85);
    leg.append('text').attr('x', 16).attr('y', i * 18 + 4)
      .attr('fill', '#333').attr('font-size', '11px').text(l);
  });
}
