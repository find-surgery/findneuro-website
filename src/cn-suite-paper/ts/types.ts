export interface ThresholdPoint {
  threshold: number;
  sensitivity: number;
  specificity: number;
  youden_j: number;
}

export interface PatientScatter {
  c: number;
  s: number;
  p: number;
}

export interface BucketData {
  r: string;
  m: number;
  se: number;
  n: number;
}

export interface ClusteringPatient {
  o: number;
  e: number;
  p: number;
}

export interface DecileData {
  d: number;
  ppv: number;
  lo: number;
  hi: number;
  n: number;
}

export interface FailurePatient {
  d: number;
  f: number | null;
  o: string;
}

export interface ChartDims {
  w: number;
  h: number;
  m: Margins;
  iw: number;
  ih: number;
}

export interface Margins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface TooltipApi {
  show: (evt: MouseEvent, html: string) => void;
  hide: () => void;
}

export interface LinRegResult {
  a: number;
  b: number;
}

export interface BoxStats {
  q1: number;
  med: number;
  q3: number;
  lo: number;
  hi: number;
  outliers: number[];
}

export interface ChartData {
  fig1: {
    operating: number;
    points: number[][];
  };
  fig2: {
    rho_sens: number;
    rho_spec: number;
    patients: PatientScatter[];
  };
  fig3: {
    buckets: BucketData[];
  };
  fig4: {
    patients: ClusteringPatient[];
  };
  fig5: {
    rho: number;
    deciles: DecileData[];
  };
  fig6: {
    med_fav: number;
    med_unfav: number;
    patients: FailurePatient[];
  };
}
