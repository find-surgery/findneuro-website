import type { TooltipApi } from '../types';
import { chartDims } from '../chart-utils';
import { COLORS } from '../constants';
import { CHART_DATA } from '../data';

export function renderThresholdChart(tip: TooltipApi): void {
  const el = document.getElementById('chart-threshold');
  if (!el) return;
  el.innerHTML = '';

  const { w, h, m, iw, ih } = chartDims(el, 0.65);
  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const pts = CHART_DATA.fig1.points;
  const x = d3.scaleLinear().domain([0, 1]).range([0, iw]);
  const y = d3.scaleLinear().domain([0, 1]).range([ih, 0]);

  // Grid
  g.append('g').attr('class', 'grid')
    .attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).tickSize(-ih).tickFormat('' as any));
  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-iw).tickFormat('' as any));

  // Axes
  g.append('g').attr('class', 'axis')
    .attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).ticks(10).tickFormat(d => (d as number).toFixed(1)));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => ((d as number) * 100) + '%'));

  // Axis labels
  g.append('text').attr('class', 'axis-label')
    .attr('x', iw / 2).attr('y', ih + 38).attr('text-anchor', 'middle')
    .text('Criticality Threshold');
  g.append('text').attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -40).attr('text-anchor', 'middle')
    .text('Rate');

  const colors = { sens: COLORS.sensitivity, spec: COLORS.specificity, yj: COLORS.youdenJ };
  const labels = { sens: 'Macro sensitivity', spec: 'Macro specificity', yj: "Macro Youden's J" };

  // Line generators
  const lineSens = d3.line<number[]>().x(d => x(d[0])).y(d => y(d[1])).curve(d3.curveMonotoneX);
  const lineSpec = d3.line<number[]>().x(d => x(d[0])).y(d => y(d[2])).curve(d3.curveMonotoneX);
  const lineYJ = d3.line<number[]>().x(d => x(d[0])).y(d => y(d[3])).curve(d3.curveMonotoneX);

  const lines = [
    { gen: lineSens, color: colors.sens, label: labels.sens },
    { gen: lineSpec, color: colors.spec, label: labels.spec },
    { gen: lineYJ, color: colors.yj, label: labels.yj }
  ];

  lines.forEach(({ gen, color }) => {
    const path = g.append('path')
      .datum(pts)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2.5)
      .attr('d', gen);
    const len = (path.node() as SVGPathElement).getTotalLength();
    path.attr('stroke-dasharray', len)
      .attr('stroke-dashoffset', len)
      .transition().duration(1200).ease(d3.easeCubicInOut)
      .attr('stroke-dashoffset', 0);
  });

  // Operating point marker
  const opIdx = pts.findIndex(p => p[0] >= 0.15);
  const op = pts[opIdx];
  const opG = g.append('g').attr('opacity', 0);
  opG.transition().delay(1000).duration(400).attr('opacity', 1);

  opG.append('line')
    .attr('x1', x(0.15)).attr('x2', x(0.15))
    .attr('y1', 0).attr('y2', ih)
    .attr('stroke', COLORS.operatingPoint).attr('stroke-width', 1.5)
    .attr('stroke-dasharray', '6,4').attr('opacity', 0.6);

  opG.append('circle')
    .attr('cx', x(0.15)).attr('cy', y(op[1]))
    .attr('r', 5).attr('fill', COLORS.operatingPoint);
  opG.append('circle')
    .attr('cx', x(0.15)).attr('cy', y(op[2]))
    .attr('r', 5).attr('fill', COLORS.operatingPoint);
  opG.append('circle')
    .attr('cx', x(0.15)).attr('cy', y(op[3]))
    .attr('r', 5).attr('fill', COLORS.operatingPoint);

  opG.append('text')
    .attr('x', x(0.15) + 6).attr('y', 10)
    .attr('fill', '#cc0000').attr('font-size', '11px')
    .attr('font-family', 'JetBrains Mono, monospace')
    .text('Pre-locked operating point (0.15)');

  // Legend
  const allLegend = [...lines, { color: COLORS.operatingPoint, label: 'Pre-locked operating point (0.15)' }];
  const leg = g.append('g').attr('transform', `translate(${iw - 230}, 30)`);
  leg.append('rect')
    .attr('x', -8).attr('y', -10)
    .attr('width', 238).attr('height', allLegend.length * 18 + 12)
    .attr('fill', 'rgba(255,255,255,0.9)').attr('stroke', '#ccc')
    .attr('rx', 4);
  allLegend.forEach(({ color, label }, i) => {
    leg.append('line').attr('x1', 0).attr('x2', 18).attr('y1', i * 18).attr('y2', i * 18)
      .attr('stroke', color).attr('stroke-width', 2)
      .attr('stroke-opacity', color === COLORS.operatingPoint ? 0.8 : 1);
    leg.append('text').attr('x', 24).attr('y', i * 18 + 4)
      .attr('fill', '#333').attr('font-size', '10px')
      .attr('font-family', 'DM Sans, sans-serif')
      .text(label);
  });

  // Hover overlay
  const hoverLine = g.append('line')
    .attr('y1', 0).attr('y2', ih)
    .attr('stroke', 'rgba(0,0,0,0.2)').attr('stroke-width', 1)
    .style('display', 'none');

  const hoverDots = [colors.sens, colors.spec, colors.yj].map(c =>
    g.append('circle').attr('r', 4).attr('fill', c).style('display', 'none')
  );

  g.append('rect')
    .attr('width', iw).attr('height', ih)
    .attr('fill', 'transparent')
    .on('mousemove', function(evt: MouseEvent) {
      const [mx] = d3.pointer(evt);
      const thresh = x.invert(mx);
      const idx = d3.bisector((d: number[]) => d[0]).left(pts, thresh, 1);
      const d0 = pts[idx - 1], d1 = pts[idx] || d0;
      const d = (thresh - d0[0]) > (d1[0] - thresh) ? d1 : d0;
      hoverLine.style('display', null).attr('x1', x(d[0])).attr('x2', x(d[0]));
      [d[1], d[2], d[3]].forEach((v, i) => {
        hoverDots[i].style('display', null).attr('cx', x(d[0])).attr('cy', y(v));
      });
      tip.show(evt,
        `<span class="tt-label">Threshold:</span> <span class="tt-val">${d[0].toFixed(2)}</span><br>` +
        `<span style="color:${COLORS.sensitivity}">Sensitivity:</span> <span class="tt-val">${(d[1]*100).toFixed(1)}%</span><br>` +
        `<span style="color:${COLORS.specificity}">Specificity:</span> <span class="tt-val">${(d[2]*100).toFixed(1)}%</span><br>` +
        `<span style="color:${COLORS.youdenJ}">Youden's J:</span> <span class="tt-val">${d[3].toFixed(3)}</span>`
      );
    })
    .on('mouseleave', function() {
      hoverLine.style('display', 'none');
      hoverDots.forEach(d => d.style('display', 'none'));
      tip.hide();
    });
}
