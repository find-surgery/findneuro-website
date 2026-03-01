import type { TooltipApi, BucketData } from '../types';
import { chartDims, linReg } from '../chart-utils';
import { COLORS } from '../constants';
import { CHART_DATA } from '../data';

function bucketMidpoint(r: string): number {
  const parts = r.split('-');
  return parts.length === 2 ? (parseInt(parts[0]) + parseInt(parts[1])) / 2 : parseInt(parts[0]) + 5;
}

export function renderSurgeryBucket(tip: TooltipApi): void {
  const el = document.getElementById('chart-surgery-bucket');
  if (!el) return;
  el.innerHTML = '';

  const { w, h, m, iw, ih } = chartDims(el, 0.7);
  const svg = d3.select(el).append('svg')
    .attr('viewBox', `0 0 ${w} ${h}`);
  const g = svg.append('g').attr('transform', `translate(${m.left},${m.top})`);

  const buckets = CHART_DATA.fig3.buckets;
  const midpoints = buckets.map(b => bucketMidpoint(b.r));
  const x = d3.scaleLinear().domain([0, 90]).range([0, iw]);
  const y = d3.scaleLinear().domain([0, 1]).range([ih, 0]);

  // Grid
  g.append('g').attr('class', 'grid').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).tickValues([10, 20, 30, 40, 50, 60, 70, 80]).tickSize(-ih).tickFormat('' as any));
  g.append('g').attr('class', 'grid')
    .call(d3.axisLeft(y).tickSize(-iw).tickFormat('' as any));

  // Axes
  g.append('g').attr('class', 'axis').attr('transform', `translate(0,${ih})`)
    .call(d3.axisBottom(x).tickValues([10, 20, 30, 40, 50, 60, 70, 80]));
  g.append('g').attr('class', 'axis')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => (d as number).toFixed(1)));

  g.append('text').attr('class', 'axis-label')
    .attr('x', iw / 2).attr('y', ih + 38).attr('text-anchor', 'middle')
    .text('Surgery size bucket (# targeted contacts)');
  g.append('text').attr('class', 'axis-label')
    .attr('transform', 'rotate(-90)')
    .attr('x', -ih / 2).attr('y', -40).attr('text-anchor', 'middle')
    .text('Mean sensitivity (error bars = SE)');

  // Trend line (excluding single-patient buckets)
  const trendBuckets = buckets.filter(b => b.n > 1);
  if (trendBuckets.length >= 2) {
    const trendMids = trendBuckets.map(b => bucketMidpoint(b.r));
    const reg = linReg(
      trendBuckets.map((b, i) => ({ x: trendMids[i], y: b.m })),
      d => d.x,
      d => d.y
    );
    const x0 = trendMids[0], x1 = trendMids[trendMids.length - 1];
    const trendLine = g.append('line')
      .attr('x1', x(x0)).attr('x2', x(x1))
      .attr('y1', y(reg.a + reg.b * x0)).attr('y2', y(reg.a + reg.b * x1))
      .attr('stroke', COLORS.specificity).attr('stroke-width', 2)
      .attr('stroke-dasharray', '7.4,3.2')
      .attr('opacity', 0);
    trendLine.transition().delay(600).duration(600).attr('opacity', 0.9);
  }

  // Error bars
  buckets.forEach((b, i) => {
    const cx = x(midpoints[i]);
    const errG = g.append('g').attr('opacity', 0);
    errG.transition().delay(600 + i * 80).duration(300).attr('opacity', 1);
    if (b.se > 0) {
      errG.append('line')
        .attr('x1', cx).attr('x2', cx)
        .attr('y1', y(b.m + b.se)).attr('y2', y(Math.max(0, b.m - b.se)))
        .attr('stroke', COLORS.sensitivity).attr('stroke-width', 1.5).attr('opacity', 0.8);
      errG.append('line')
        .attr('x1', cx - 5).attr('x2', cx + 5)
        .attr('y1', y(b.m + b.se)).attr('y2', y(b.m + b.se))
        .attr('stroke', COLORS.sensitivity).attr('stroke-width', 1.5).attr('opacity', 0.8);
      errG.append('line')
        .attr('x1', cx - 5).attr('x2', cx + 5)
        .attr('y1', y(Math.max(0, b.m - b.se))).attr('y2', y(Math.max(0, b.m - b.se)))
        .attr('stroke', COLORS.sensitivity).attr('stroke-width', 1.5).attr('opacity', 0.8);
    }
    const topY = b.se > 0 ? y(Math.min(1, b.m + b.se)) : y(b.m);
    errG.append('text')
      .attr('x', cx).attr('y', topY - 8)
      .attr('text-anchor', 'middle')
      .attr('fill', '#333').attr('font-size', '10px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .text(b.n);
  });

  // Dots
  const dots = g.selectAll<SVGCircleElement, BucketData>('.dot').data(buckets).enter().append('circle')
    .attr('cx', (_d, i) => x(midpoints[i])).attr('cy', y(0.5))
    .attr('r', 0)
    .attr('fill', COLORS.sensitivity)
    .attr('stroke', COLORS.sensitivity)
    .attr('stroke-width', 1)
    .style('cursor', 'pointer');

  dots.transition().duration(600).delay((_d, i) => i * 80)
    .attr('r', 4)
    .attr('cy', d => y(d.m));

  dots.on('mousemove', (evt: MouseEvent, d: BucketData) => {
    tip.show(evt,
      `<span class="tt-label">Bucket:</span> <span class="tt-val">${d.r} contacts</span><br>` +
      `<span class="tt-label">Mean Sens:</span> <span class="tt-val">${(d.m*100).toFixed(1)}%</span><br>` +
      `<span class="tt-label">SE:</span> <span class="tt-val">${(d.se*100).toFixed(1)}%</span><br>` +
      `<span class="tt-label">Patients:</span> <span class="tt-val">${d.n}</span>`
    );
  }).on('mouseleave', tip.hide);
}
