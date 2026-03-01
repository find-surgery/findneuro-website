import type { TooltipApi, PatientScatter } from '../types';
import { chartDims, linReg } from '../chart-utils';
import { COLORS } from '../constants';
import { CHART_DATA } from '../data';

export function renderSurgeryScatter(tip: TooltipApi): void {
  const el = document.getElementById('chart-surgery-scatter');
  if (!el) return;
  el.innerHTML = '';

  const { w, h, m, iw, ih } = chartDims(el, 0.7);
  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`);
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const pts = CHART_DATA.fig2.patients;
  const x = d3.scaleLinear().domain([0, 90]).range([0, iw]);
  const y = d3.scaleLinear().domain([0, 1]).range([ih, 0]);

  g.append('g').attr('class', 'grid').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).tickSize(-ih).tickFormat('' as any));
  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-iw).tickFormat('' as any));
  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(8));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => ((d as number) * 100) + '%'));

  g.append('text').attr('class', 'axis-label')
    .attr('x', iw / 2).attr('y', ih + 38).attr('text-anchor', 'middle')
    .text('Treated Contacts');
  g.append('text').attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -40).attr('text-anchor', 'middle')
    .text('Rate');

  // Trend lines
  const regSens = linReg(pts, d => d.c, d => d.s);
  const regSpec = linReg(pts, d => d.c, d => d.p);

  [{reg: regSens, color: COLORS.sensitivity}, {reg: regSpec, color: COLORS.specificity}].forEach(({reg, color}) => {
    g.append('line')
      .attr('x1', x(0)).attr('x2', x(90))
      .attr('y1', y(reg.a)).attr('y2', y(reg.a + reg.b * 90))
      .attr('stroke', color).attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,4').attr('opacity', 0.5);
  });

  // Sensitivity dots
  const dotsS = g.selectAll<SVGCircleElement, PatientScatter>('.dot-sens').data(pts).enter().append('circle')
    .attr('class', 'dot-sens')
    .attr('cx', d => x(d.c)).attr('cy', y(0.5))
    .attr('r', 0).attr('fill', COLORS.sensitivity).attr('opacity', 0.85)
    .style('cursor', 'pointer');
  dotsS.transition().duration(800).delay((_d, i) => i * 15)
    .attr('r', 5).attr('cy', d => y(d.s));

  // Specificity dots
  const dotsP = g.selectAll<SVGCircleElement, PatientScatter>('.dot-spec').data(pts).enter().append('circle')
    .attr('class', 'dot-spec')
    .attr('cx', d => x(d.c)).attr('cy', y(0.5))
    .attr('r', 0).attr('fill', COLORS.specificity).attr('opacity', 0.85)
    .style('cursor', 'pointer');
  dotsP.transition().duration(800).delay((_d, i) => i * 15)
    .attr('r', 5).attr('cy', d => y(d.p));

  // Hover
  dotsS.on('mousemove', (evt: MouseEvent, d: PatientScatter) => {
    tip.show(evt,
      `<span class="tt-label">Contacts:</span> <span class="tt-val">${d.c}</span><br>` +
      `<span style="color:${COLORS.sensitivity}">Sensitivity:</span> <span class="tt-val">${(d.s*100).toFixed(1)}%</span>`
    );
  }).on('mouseleave', tip.hide);
  dotsP.on('mousemove', (evt: MouseEvent, d: PatientScatter) => {
    tip.show(evt,
      `<span class="tt-label">Contacts:</span> <span class="tt-val">${d.c}</span><br>` +
      `<span style="color:${COLORS.specificity}">Specificity:</span> <span class="tt-val">${(d.p*100).toFixed(1)}%</span>`
    );
  }).on('mouseleave', tip.hide);

  // Legend
  const leg = g.append('g').attr('transform', `translate(${iw - 150}, 8)`);
  [{c:COLORS.sensitivity,l:`Sensitivity (\u03C1=${CHART_DATA.fig2.rho_sens})`},{c:COLORS.specificity,l:`Specificity (\u03C1=${CHART_DATA.fig2.rho_spec})`}].forEach(({c,l}, i) => {
    leg.append('circle').attr('cx', 5).attr('cy', i * 18).attr('r', 4).attr('fill', c);
    leg.append('text').attr('x', 14).attr('y', i * 18 + 4)
      .attr('fill', '#333').attr('font-size', '10px').text(l);
  });
}
