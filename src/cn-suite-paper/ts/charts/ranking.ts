import type { TooltipApi, DecileData } from '../types';
import { chartDims, linReg } from '../chart-utils';
import { COLORS } from '../constants';
import { CHART_DATA } from '../data';

export function renderRankingChart(tip: TooltipApi): void {
  const el = document.getElementById('chart-ranking');
  if (!el) return;
  el.innerHTML = '';

  const { w, h, m, iw, ih } = chartDims(el, 0.7);
  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`);
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const deciles = CHART_DATA.fig5.deciles;
  const x = d3.scaleLinear().domain([0.5, 10.5]).range([0, iw]);
  const y = d3.scaleLinear().domain([0, 0.8]).range([ih, 0]);

  // Grid
  g.append('g').attr('class', 'grid').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).tickValues(d3.range(1, 11)).tickSize(-ih).tickFormat('' as any));
  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-iw).tickFormat('' as any));

  // Axes
  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).tickValues(d3.range(1, 11)).tickFormat(d => String(d)));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => (d as number).toFixed(1)));

  g.append('text').attr('class', 'axis-label')
    .attr('x', iw / 2).attr('y', ih + 38).attr('text-anchor', 'middle')
    .text('Criticality Score Decile \u2192 Higher');
  g.append('text').attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -40).attr('text-anchor', 'middle')
    .text('Surgical-Zone Enrichment (PPV)');

  // CI error bars
  deciles.forEach((d, i) => {
    const cx = x(d.d);
    const errG = g.append('g').attr('opacity', 0);
    errG.transition().delay(400 + i * 60).duration(300).attr('opacity', 1);
    errG.append('line')
      .attr('x1', cx).attr('x2', cx)
      .attr('y1', y(d.hi)).attr('y2', y(d.lo))
      .attr('stroke', COLORS.sensitivity).attr('stroke-width', 2);
    errG.append('circle')
      .attr('cx', cx).attr('cy', y(d.hi)).attr('r', 2.5)
      .attr('fill', COLORS.sensitivity);
    errG.append('circle')
      .attr('cx', cx).attr('cy', y(d.lo)).attr('r', 2.5)
      .attr('fill', COLORS.sensitivity);
  });

  // Connecting line
  const lineGen = d3.line<DecileData>().x(d => x(d.d)).y(d => y(d.ppv));
  const connPath = g.append('path')
    .datum(deciles)
    .attr('fill', 'none')
    .attr('stroke', COLORS.sensitivity)
    .attr('stroke-width', 2)
    .attr('d', lineGen);
  const connLen = (connPath.node() as SVGPathElement).getTotalLength();
  connPath.attr('stroke-dasharray', connLen)
    .attr('stroke-dashoffset', connLen)
    .transition().duration(800).ease(d3.easeCubicInOut)
    .attr('stroke-dashoffset', 0)
    .on('end', function() { d3.select(this).attr('stroke-dasharray', null); });

  // Dots
  const dots = g.selectAll<SVGCircleElement, DecileData>('.dot').data(deciles).enter().append('circle')
    .attr('cx', d => x(d.d)).attr('cy', y(0.4))
    .attr('r', 0)
    .attr('fill', COLORS.sensitivity)
    .attr('stroke', COLORS.sensitivity)
    .attr('stroke-width', 1)
    .style('cursor', 'pointer');

  dots.transition().duration(600).delay((_d, i) => i * 60)
    .attr('r', 4)
    .attr('cy', d => y(d.ppv));

  // Trend line
  const reg = linReg(deciles, d => d.d, d => d.ppv);
  const trendLine = g.append('line')
    .attr('x1', x(1)).attr('y1', y(reg.a + reg.b))
    .attr('x2', x(10)).attr('y2', y(reg.a + reg.b * 10))
    .attr('stroke', COLORS.trend).attr('stroke-width', 1.8)
    .attr('stroke-dasharray', '6.66,2.88')
    .attr('opacity', 0);
  trendLine.transition().delay(1000).duration(400).attr('opacity', 1);

  // Legend
  const leg = g.append('g').attr('transform', `translate(${iw - 210}, 6)`);
  leg.append('rect')
    .attr('x', -8).attr('y', -10)
    .attr('width', 218).attr('height', 56)
    .attr('fill', 'rgba(255,255,255,0.8)').attr('stroke', '#ccc').attr('rx', 4);
  leg.append('line').attr('x1', 0).attr('x2', 18).attr('y1', 0).attr('y2', 0)
    .attr('stroke', COLORS.trend).attr('stroke-width', 1.8).attr('stroke-dasharray', '6.66,2.88');
  leg.append('text').attr('x', 24).attr('y', 4)
    .attr('fill', '#333').attr('font-size', '10px').text('Linear trend');
  leg.append('line').attr('x1', 0).attr('x2', 18).attr('y1', 18).attr('y2', 18)
    .attr('stroke', COLORS.sensitivity).attr('stroke-width', 2);
  leg.append('circle').attr('cx', 9).attr('cy', 18).attr('r', 3).attr('fill', COLORS.sensitivity);
  leg.append('line').attr('x1', 9).attr('x2', 9).attr('y1', 14).attr('y2', 22)
    .attr('stroke', COLORS.sensitivity).attr('stroke-width', 1.5);
  leg.append('text').attr('x', 24).attr('y', 22)
    .attr('fill', '#333').attr('font-size', '10px').text('Decile PPV (95% Wilson CI)');
  leg.append('text').attr('x', 24).attr('y', 40)
    .attr('fill', '#555').attr('font-size', '9px').attr('font-style', 'italic')
    .text(`Spearman \u03C1=${CHART_DATA.fig5.rho}, p=6.80e-19`);

  dots.on('mousemove', (evt: MouseEvent, d: DecileData) => {
    tip.show(evt,
      `<span class="tt-label">Decile:</span> <span class="tt-val">${d.d}</span><br>` +
      `<span class="tt-label">PPV:</span> <span class="tt-val">${(d.ppv*100).toFixed(1)}%</span><br>` +
      `<span class="tt-label">95% CI:</span> <span class="tt-val">${(d.lo*100).toFixed(1)}-${(d.hi*100).toFixed(1)}%</span><br>` +
      `<span class="tt-label">Contacts:</span> <span class="tt-val">${d.n}</span>`
    );
  }).on('mouseleave', tip.hide);
}
