/** Alice story visualization modes */
export const enum AliceMode {
  Off = 0,
  SeizureChaos = 1,
  TargetsIdentified = 2,
  SeizureFree = 3,
}

/** Critical Nodes interactive step modes */
export const enum CNMode {
  Off = 0,
  Electrodes = 1,
  Connectivity = 2,
  Criticality = 3,
}

/** Brain data loaded from brain_data.js via window.BRAIN */
export interface BrainData {
  v: number[];  // vertex positions (flat: x,y,z,x,y,z,...)
  f: number[];  // face indices (flat: a,b,c,a,b,c,...)
  c: number[];  // curvature values per vertex
  sub: SubcorticalStructure[];
}

export interface SubcorticalStructure {
  n: string;    // structure name (e.g. 'Left-Hippocampus')
  v: number[];  // vertex positions
  f: number[];  // face indices
}

/** Epileptogenic network node sampled from brain surface */
export interface NetNode {
  x: number;
  y: number;
  z: number;
}

/** Adjacency entry for network graph */
export interface AdjEntry {
  n: number;  // neighbor node index
  d: number;  // distance to neighbor
}

/** Edge between two network nodes */
export interface EdgeData {
  from: number;
  to: number;
}

/** Active spike propagation traveling through the network */
export interface Spike {
  start: number;           // time the spike was triggered
  arrivals: Float32Array;  // arrival time per node (-1 if not reached)
  decay: number;           // exponential decay rate
}

/** Precomputed nearby mesh vertex for surface glow effects */
export interface NearbyVert {
  vi: number;  // vertex index
  f: number;   // falloff factor (1=closest, 0=at radius edge)
}

/** Background particle for 2D canvas animation */
export interface BgParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
}

/** Contact position on CN electrode */
export interface ContactPosition {
  x: number;
  y: number;
  z: number;
}

/** Pre-built cycling pair for CN Phase 2 */
export interface CyclePair {
  highlight: number;
  connected: number[];
}

/** Three.js scene state shared across modules */
export interface SceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  brain: THREE.Group;
  clock: THREE.Clock;
  canvas: HTMLCanvasElement;
  isMobile: boolean;
}

/** Brain mesh state */
export interface BrainState {
  meshGeo?: THREE.BufferGeometry;
  meshColors?: Float32Array;
  baseColors?: Float32Array;
  particlePositions?: Float32Array;
  numVerts: number;
}

/** Epileptogenic network state */
export interface NetworkState {
  nodes: NetNode[];
  adj: AdjEntry[][];
  spikes: Spike[];
  edgeData: EdgeData[];
  nodeMeshVerts: NearbyVert[][];
  nodeColors: Float32Array;
  edgeColors: Float32Array;
  nodePoints: THREE.Points;
  edgeLines: THREE.LineSegments;
  raycaster: THREE.Raycaster;
  NET_NODES: number;
}

/** Drag/rotation interaction state */
export interface DragState {
  isDragging: boolean;
  lastDragX: number;
  lastDragY: number;
  userRotZ: number;
  userRotX: number;
  dragVelZ: number;
  dragVelX: number;
}

/** Alice story visualization state */
export interface AliceState {
  mode: number;         // 0=off, 1=seizure chaos, 2=targets identified, 3=seizure-free
  start: number;
  focus: number[];      // ~15 seizure focus nodes
  targets: number[];    // ~5 ablation target nodes
  triggered: boolean;
  timeouts: ReturnType<typeof setTimeout>[];
}

/** Critical Nodes interactive visualization state */
export interface CNState {
  mode: number;          // 0=off, 1=electrodes, 2=connectivity, 3=criticality
  initialized: boolean;
  timeouts: ReturnType<typeof setTimeout>[];
  brainSize: number;
  electrodeGroup: THREE.Group | null;
  contactPoints: THREE.Points | null;
  contactPositions: ContactPosition[];
  contactColors: Float32Array | null;
  connectionLines: THREE.LineSegments | null;
  connectionColors: Float32Array | null;
  highlightContact: number;
  connectedContacts: number[];
  critScores: Float32Array;
  critSubset: number[];
  cycleTimer: number;
  cycleIndex: number;
  cyclePairs: CyclePair[];
}

/** Global animation state */
export interface AnimationState {
  mx: number;
  my: number;
  scrollPct: number;
  spikeAutoTimer: number;
  isBrainVisible: boolean;
}

/** Declare window.BRAIN from brain_data.js */
declare global {
  interface Window {
    BRAIN?: BrainData;
    setCTA?: (type: string) => void;
  }
}
