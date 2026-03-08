export const SLIDE_TITLES = [
  "Intro",
  "Problem",
  "Existing",
  "CN-Suite",
  "Design",
  "Cohort",
  "Effect Size",
  "Threshold",
  "Contacts",
  "Surgery Size",
  "Clustering",
  "Ranking",
  "Failure",
  "Limits",
  "SHAP",
  "Conclusion"
];

export const SLIDE_CHARTS: Record<number, string[]> = {
  7: ['threshold'],
  9: ['surgeryScatter', 'surgeryBucket'],
  10: ['clustering'],
  11: ['ranking'],
  12: ['failure'],
  14: ['shapNetwork']
};

export const COLORS = {
  sensitivity: '#1f77b4',
  specificity: '#ff7f0e',
  youdenJ: '#2ca02c',
  operatingPoint: '#ff0000',
  favorable: '#3b82f6',
  unfavorable: '#ef4444',
  trend: '#dc2626',
  refLine: '#808080',
  dashRef: '#9ca3af',
} as const;

export const DEFAULT_MARGINS = {
  top: 16,
  right: 20,
  bottom: 44,
  left: 52
} as const;

export const EXIT_LEFT_DURATION = 500;
export const CHART_RENDER_DELAY = 100;
export const SWIPE_THRESHOLD = 50;
