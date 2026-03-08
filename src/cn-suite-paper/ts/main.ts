import '../styles/paper.css';
import { SLIDE_CHARTS, CHART_RENDER_DELAY } from './constants';
import { initTooltip } from './tooltip';
import { initNavigation } from './navigation';
import { renderThresholdChart } from './charts/threshold';
import { renderSurgeryScatter } from './charts/surgery-scatter';
import { renderSurgeryBucket } from './charts/surgery-bucket';
import { renderClusteringChart } from './charts/clustering';
import { renderRankingChart } from './charts/ranking';
import { renderFailureChart } from './charts/failure';
import { renderShapNetwork } from './charts/shap-network';

const tip = initTooltip();

const chartRendered: Record<string, boolean> = {};

const chartRenderers: Record<string, () => void> = {
  threshold: () => renderThresholdChart(tip),
  surgeryScatter: () => renderSurgeryScatter(tip),
  surgeryBucket: () => renderSurgeryBucket(tip),
  clustering: () => renderClusteringChart(tip),
  ranking: () => renderRankingChart(tip),
  failure: () => renderFailureChart(tip),
  shapNetwork: () => renderShapNetwork(tip),
};

function renderChartsForSlide(idx: number): void {
  const chartIds = SLIDE_CHARTS[idx];
  if (!chartIds) return;
  chartIds.forEach(id => {
    if (!chartRendered[id]) {
      chartRendered[id] = true;
      chartRenderers[id]();
    }
  });
}

function onSlideChange(idx: number): void {
  setTimeout(() => renderChartsForSlide(idx), CHART_RENDER_DELAY);
}

const nav = initNavigation(onSlideChange);

// Render charts for the initial slide if applicable
if (SLIDE_CHARTS[0]) {
  setTimeout(() => renderChartsForSlide(0), CHART_RENDER_DELAY);
}

// Expose navigate for any external use
(window as any).navigate = nav.navigate;
