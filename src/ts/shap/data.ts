import type { CSSProperties } from 'react';
import type { Feature, Correlation, GradientFeature, NetworkMode, NodeDef, EdgeDef, ModeId } from './types';

// Palette
export const BG = '#080c14';
export const SURF = '#0d1524';
export const CARD = '#111d33';
export const BDR = '#1c2e50';
export const C1 = '#5eead4';
export const C2 = '#818cf8';
export const C3 = '#6b7280';
export const CRIT = '#f97316';
export const TXT = '#e2e8f0';
export const MUT = '#4b6285';
export const GRN = '#34d399';
export const RED = '#f87171';
export const AMB = '#fbbf24';

export const TIER: Record<number, string> = { 1: C1, 2: C2, 3: C3 };

export const mono: CSSProperties = { fontFamily: "'DM Mono',monospace" };
export const serif: CSSProperties = { fontFamily: "'Fraunces',serif" };

export const MODE_INDEX: Record<ModeId, number> = { bc: 1, ec: 2, cl: 3 };

export const FEATS: Feature[] = [
  { label: '\u0394 Betweenness Centrality', s: '\u0394BC', t: 1, hc: .3903, lc: .3028, p: '3.5e-6', r: 1 },
  { label: '\u0394 Eigenvector Centrality', s: '\u0394EC', t: 1, hc: .3656, lc: .2160, p: '<1e-6', r: 2 },
  { label: '\u0394 Clustering (onset)', s: '\u0394Clust', t: 1, hc: .3162, lc: .2228, p: '<1e-6', r: 3 },
  { label: 'Temporal Betweenness', s: 'TBC', t: 2, hc: .2700, lc: .1830, p: '-', r: 4 },
  { label: 'catch22 #1', s: 'c22\u2460', t: 3, hc: .1900, lc: .1310, p: '-', r: 5 },
  { label: 'catch22 #2', s: 'c22\u2461', t: 3, hc: .1630, lc: .1120, p: '-', r: 8 },
  { label: 'HFO-adjacent #1', s: 'HFO\u2460', t: 3, hc: .1450, lc: .0990, p: '-', r: 9 },
  { label: 'catch22 #3', s: 'c22\u2462', t: 3, hc: .1280, lc: .0880, p: '-', r: 11 },
  { label: 'HFO-adjacent #2', s: 'HFO\u2461', t: 3, hc: .1050, lc: .0740, p: '-', r: 21 },
];

export const CORR: Correlation[] = [
  { pair: '\u0394BC \u2194 \u0394EC', raw: -.488, shap: .061, rc: RED, sc: '#6b7280' },
  { pair: '\u0394BC \u2194 \u0394Clust', raw: .113, shap: .442, rc: '#6b7280', sc: GRN },
  { pair: '\u0394EC \u2194 \u0394Clust', raw: -.136, shap: .367, rc: '#6b7280', sc: GRN },
];

export const GRAD: GradientFeature[] = [
  { name: '\u0394 Eigenvector', rho: .798, t: 1, sig: true, p: '4.0\u00d710\u207b\u00b9\u2074' },
  { name: '\u0394 Clustering', rho: .476, t: 1, sig: true, p: '1.4\u00d710\u207b\u2074' },
  { name: '\u0394 Betweenness', rho: .318, t: 1, sig: true, p: '0.014' },
  { name: 'Temporal BC', rho: .206, t: 2, sig: false, p: '0.118' },
  { name: 'catch22 #1', rho: -.025, t: 3, sig: false, p: '0.848' },
];

export const MODES: NetworkMode[] = [
  {
    id: 'bc', color: C1, icon: '\u2b21', label: '\u0394 Betweenness', shap: '0.390', rank: 1,
    title: 'Routing Bridge',
    desc: 'Betweenness counts shortest paths passing through a node. At seizure onset, C* becomes the sole bridge between clusters A and B - all inter-cluster routing flows through it.',
    insight: 'Remove C* \u2192 clusters fully disconnect',
  },
  {
    id: 'ec', color: C2, icon: '\u2726', label: '\u0394 Eigenvector', shap: '0.366', rank: 2,
    title: 'Influential Neighbor Effect',
    desc: "Eigenvector centrality rewards connection to well-connected nodes. C* gains links to A\u2081 and B\u2081 - the dominant hubs of their clusters - embedding it in the network's most influential core.",
    insight: "C*'s neighbors are themselves the highest-degree nodes",
  },
  {
    id: 'cl', color: GRN, icon: '\u25b3', label: '\u0394 Clustering', shap: '0.316', rank: 3,
    title: 'Neighborhood Cohesion',
    desc: "Clustering coefficient measures how tightly a node's neighbors interconnect. At onset, A\u2081 and B\u2081 form a direct link - C*'s neighborhood collapses into a maximal triangle (clustering = 1.0).",
    insight: "C*'s local subnetwork becomes a tight clique",
  },
];

export const NODES: Record<string, NodeDef> = {
  C: { x: 120, y: 110, type: 'crit', lbl: 'C*' },
  A1: { x: 42, y: 50, type: 'clusterA', lbl: 'A\u2081' },
  A2: { x: 12, y: 110, type: 'clusterA', lbl: 'A\u2082' },
  A3: { x: 42, y: 170, type: 'clusterA', lbl: 'A\u2083' },
  B1: { x: 198, y: 50, type: 'clusterB', lbl: 'B\u2081' },
  B2: { x: 228, y: 110, type: 'clusterB', lbl: 'B\u2082' },
  B3: { x: 198, y: 170, type: 'clusterB', lbl: 'B\u2083' },
};

// [from, to, baseline, +BC, +EC, +Clust]
export const EDGES: EdgeDef[] = [
  ['A1', 'A2', 1, 1, 1, 1], ['A2', 'A3', 1, 1, 1, 1], ['A1', 'A3', 1, 1, 1, 1],
  ['B1', 'B2', 1, 1, 1, 1], ['B2', 'B3', 1, 1, 1, 1], ['B1', 'B3', 1, 1, 1, 1],
  ['C', 'A1', 1, 1, 1, 1],
  ['C', 'A2', 0, 1, 1, 0],
  ['C', 'A3', 0, 1, 0, 0],
  ['C', 'B1', 0, 1, 1, 1],
  ['C', 'B2', 0, 1, 1, 0],
  ['C', 'B3', 0, 1, 0, 0],
  ['A1', 'B1', 0, 0, 1, 1],
];

export function nodeColor(type: string, active: boolean, acol: string): string {
  if (type === 'crit') return active ? acol : CRIT;
  return type === 'clusterA' ? C1 : C2;
}
