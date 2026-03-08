import type { ReactNode } from 'react';

export type Tier = 1 | 2 | 3;
export type ModeId = 'bc' | 'ec' | 'cl';

export interface Feature {
  label: string;
  s: string;
  t: Tier;
  hc: number;
  lc: number;
  p: string;
  r: number;
}

export interface Correlation {
  pair: string;
  raw: number;
  shap: number;
  rc: string;
  sc: string;
}

export interface GradientFeature {
  name: string;
  rho: number;
  t: Tier;
  sig: boolean;
  p: string;
}

export interface NetworkMode {
  id: ModeId;
  color: string;
  icon: string;
  label: string;
  shap: string;
  rank: number;
  title: string;
  desc: string;
  insight: string;
}

export interface NodeDef {
  x: number;
  y: number;
  type: 'crit' | 'clusterA' | 'clusterB';
  lbl: string;
}

export type EdgeDef = [string, string, number, number, number, number];

export interface TagProps {
  children: ReactNode;
  col?: string;
}

export interface SectionHeaderProps {
  title: string;
  sub: string;
}

export interface MiniStatProps {
  val: string;
  label: string;
  sub: string;
  col?: string;
}

export interface CorrelBarProps {
  pair: string;
  raw: number;
  shap: number;
  rc: string;
  sc: string;
}

export interface TooltipContentProps {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}
