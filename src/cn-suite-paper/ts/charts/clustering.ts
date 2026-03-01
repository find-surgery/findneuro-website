import type { TooltipApi, ClusteringPatient } from '../types';
import { chartDims } from '../chart-utils';
import { COLORS } from '../constants';
import { CHART_DATA } from '../data';

export function renderClusteringChart(tip: TooltipApi): void {
  const el = document.getElementById('chart-clustering');
  if (!el) return;
  el.innerHTML = '';

  const { w, h, m, iw, ih } = chartDims(el, 0.85);
  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`);
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const pts = CHART_DATA.fig4.patients;
  const maxVal = 35;
  const x = d3.scaleLinear().domain([0, maxVal]).range([0, iw]);
  const y = d3.scaleLinear().domain([0, maxVal]).range([ih, 0]);

  g.append('g').attr('class', 'grid').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).tickSize(-ih).tickFormat('' as any));
  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-iw).tickFormat('' as any));
  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(7).tickFormat(d => d + ' mm'));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(7).tickFormat(d => d + ' mm'));

  g.append('text').attr('class', 'axis-label')
    .attr('x', iw / 2).attr('y', ih + 38).attr('text-anchor', 'middle')
    .text('Expected NN Distance (mm)');
  g.append('text').attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -44).attr('text-anchor', 'middle')
    .text('Observed NN Distance (mm)');

  // Diagonal reference line
  g.append('line')
    .attr('x1', x(0)).attr('y1', y(0))
    .attr('x2', x(maxVal)).attr('y2', y(maxVal))
    .attr('stroke', COLORS.refLine).attr('stroke-width', 1)
    .attr('stroke-dasharray', '3.7,1.6');

  g.append('text')
    .attr('x', x(maxVal) - 4).attr('y', y(maxVal) + 14)
    .attr('fill', COLORS.refLine).attr('font-size', '10px')
    .attr('text-anchor', 'end')
    .text('y = x (no clustering)');

  // Dots
  const dots = g.selectAll<SVGCircleElement, ClusteringPatient>('.dot').data(pts).enter().append('circle')
    .attr('cx', d => x(d.e)).attr('cy', d => y(d.e))
    .attr('r', 0)
    .attr('fill', COLORS.sensitivity)
    .attr('opacity', 0.8)
    .style('cursor', 'pointer');

  dots.transition().duration(800).delay((_d, i) => i * 30)
    .attr('r', 6)
    .attr('cy', d => y(d.o));

  dots.on('mousemove', (evt: MouseEvent, d: ClusteringPatient) => {
    tip.show(evt,
      `<span class="tt-label">Expected:</span> <span class="tt-val">${d.e.toFixed(1)} mm</span><br>` +
      `<span class="tt-label">Observed:</span> <span class="tt-val">${d.o.toFixed(1)} mm</span><br>` +
      `<span class="tt-label">p-value:</span> <span class="tt-val ${d.p < 0.05 ? 'green' : 'red'}">${d.p < 0.001 ? '< 0.001' : d.p.toFixed(3)}</span>`
    );
  }).on('mouseleave', tip.hide);
}
