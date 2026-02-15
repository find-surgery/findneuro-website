/** Network configuration */
export const NETWORK = {
  NODES_DESKTOP: 200,
  NODES_MOBILE: 120,
  K_NEIGHBORS: 6,
  LONG_RANGE_CONNECTIONS: 20,
  NEARBY_RADIUS: 0.12,
  SPIKE_DECAY: 2.8,
  MAX_SPIKES_DESKTOP: 4,
  MAX_SPIKES_MOBILE: 2,
  SPIKE_AGE_LIMIT: 2.2,
  SPIKE_CLEANUP_AGE: 5.0,
  AUTO_SPIKE_INTERVAL: 4.5,
  INITIAL_SPIKE_DELAY: 800,
} as const;

/** Alice story visualization timing */
export const ALICE = {
  FOCUS_COUNT: 15,
  TARGET_COUNT: 5,
  SPIKE_COUNT: 6,
  SPIKE_INTERVAL: 400,
  PHASE2_DELAY: 3000,
  PHASE3_DELAY: 6000,
  RESET_DELAY: 10000,
} as const;

/** Critical Nodes interactive config */
export const CN = {
  ELECTRODES: 12,
  CONTACTS_PER_ELECTRODE: 12,
  TOTAL_CONTACTS: 144,  // ELECTRODES * CONTACTS_PER_ELECTRODE
  MAX_CONNECTIONS: 12,
  BRAIN_SIZE_DESKTOP: 360,
  BRAIN_SIZE_MOBILE: 280,
  CYCLE_PAIRS: 10,
  CYCLE_INTERVAL: 2.0,
  CONNECTIONS_PER_PAIR: 8,
  TARGET_ELECTRODE: 3,
  TARGET_START_CONTACT: 4,
  CRIT_SUBSET_COUNT: 4,
} as const;

/** Camera defaults */
export const CAMERA = {
  FOV: 45,
  NEAR: 0.1,
  FAR: 100,
  Z_DESKTOP: 3.8,
  Z_MOBILE: 4.2,
  DRAG_SENSITIVITY: 0.004,
  INERTIA_DAMPING: 0.94,
  AUTO_ROTATE_SPEED: 0.06,
} as const;

/** Particle counts */
export const PARTICLES = {
  SURFACE_DESKTOP: 1200,
  SURFACE_MOBILE: 600,
  FALLBACK_DESKTOP: 2000,
  FALLBACK_MOBILE: 1000,
  BG_DESKTOP: 80,
  BG_MOBILE: 40,
  BG_CONNECTION_DISTANCE: 150,
} as const;

/** Subcortical structure color map: name -> [r, g, b] */
export const SUBCORTICAL_COLORS: Record<string, [number, number, number]> = {
  'Left-Hippocampus':       [1.0, 0.45, 0.1],
  'Right-Hippocampus':      [1.0, 0.45, 0.1],
  'Left-Amygdala':          [0.95, 0.25, 0.2],
  'Right-Amygdala':         [0.95, 0.25, 0.2],
  'Left-Thalamus-Proper':   [0.55, 0.25, 0.9],
  'Right-Thalamus-Proper':  [0.55, 0.25, 0.9],
  'Left-Caudate':           [0.15, 0.75, 0.45],
  'Right-Caudate':          [0.15, 0.75, 0.45],
  'Left-Putamen':           [0.1, 0.65, 0.75],
  'Right-Putamen':          [0.1, 0.65, 0.75],
  'Left-Pallidum':          [0.4, 0.7, 0.95],
  'Right-Pallidum':         [0.4, 0.7, 0.95],
  'Brain-Stem':             [0.45, 0.42, 0.55],
};

/** Loader timing */
export const LOADER_HIDE_DELAY = 2200;

/** Formspree endpoint */
export const FORMSPREE_URL = 'https://formspree.io/f/mzdarpwd';

/** Scroll threshold for showing the fixed logo */
export const LOGO_SCROLL_THRESHOLD = 0.6;

/** Mouse glow effect threshold */
export const MOUSE_GLOW_THRESHOLD = 0.82;
