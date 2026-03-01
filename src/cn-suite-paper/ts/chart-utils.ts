import type { ChartDims, LinRegResult, BoxStats } from './types';
import { DEFAULT_MARGINS } from './constants';

export function chartDims(container: HTMLElement, aspectRatio: number): ChartDims {
  const w = container.clientWidth - 24;
  const h = Math.round(w * aspectRatio);
  const m = { ...DEFAULT_MARGINS };
  return { w, h, m, iw: w - m.left - m.right, ih: h - m.top - m.bottom };
}

export function linReg<T>(data: T[], xFn: (d: T) => number, yFn: (d: T) => number): LinRegResult {
  const n = data.length;
  let sx = 0, sy = 0, sxy = 0, sx2 = 0;
  data.forEach(d => {
    const xv = xFn(d);
    const yv = yFn(d);
    sx += xv;
    sy += yv;
    sxy += xv * yv;
    sx2 += xv * xv;
  });
  const b = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  const a = (sy - b * sx) / n;
  return { a, b };
}

export function boxStats(arr: number[]): BoxStats {
  const q1 = d3.quantile(arr, 0.25)!;
  const med = d3.quantile(arr, 0.5)!;
  const q3 = d3.quantile(arr, 0.75)!;
  const iqr = q3 - q1;
  const lo = Math.max(d3.min(arr)!, q1 - 1.5 * iqr);
  const hi = Math.min(d3.max(arr)!, q3 + 1.5 * iqr);
  const outliers = arr.filter(v => v < lo || v > hi);
  return { q1, med, q3, lo, hi, outliers };
}
