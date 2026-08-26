import '../styles/main.css';
import './analytics.ts';

import { CN } from './constants.ts';
import { initScene } from './scene.ts';
import { buildRealBrain, buildFallbackBrain, makeElectrodes } from './brain.ts';
import { buildEpiNetwork, scheduleFirstSpike } from './network.ts';
import { initDragHandlers, initMouseAndScroll, initBrainClickHandlers } from './interaction.ts';
import { initAliceObservers, initSolCardInteractions, stopAliceVisualization } from './alice.ts';
import { initCNData, initCNObservers, stopCNVisualization } from './cn.ts';
import { initSEEG } from './seeg.ts';
import { startAnimationLoop, getAnimateFn, initBrainVisibilityObserver, initNarrativeObservers } from './animation.ts';
import { initUI } from './ui.ts';
import { initPitchVideo } from './video.ts';
import { initBackground } from './background.ts';
import type { DragState, AliceState, CNState, AnimationState } from './types.ts';

(function () {
  'use strict';

  /* Clickjacking protection */
  if (window.top !== window.self) {
    (window.top as Window).location.href = window.self.location.href;
  }

  /* Initialize UI (no Three.js dependencies) */
  initUI();
  initPitchVideo();

  const canvas = document.getElementById('hero-brain') as HTMLCanvasElement;
  const isMobile = window.innerWidth < 768;

  /* Shared mutable state */
  const drag: DragState = {
    isDragging: false,
    lastDragX: 0, lastDragY: 0,
    userRotZ: 0, userRotX: 0,
    dragVelZ: 0, dragVelX: 0,
  };

  const alice: AliceState = {
    mode: 0, start: 0,
    focus: [], targets: [],
    triggered: false, timeouts: [],
  };

  const cn: CNState = {
    mode: 0, initialized: false,
    timeouts: [],
    brainSize: isMobile ? CN.BRAIN_SIZE_MOBILE : CN.BRAIN_SIZE_DESKTOP,
    electrodeGroup: null,
    contactPoints: null,
    contactPositions: [],
    contactColors: null,
    connectionLines: null,
    connectionColors: null,
    highlightContact: 0,
    connectedContacts: [],
    critScores: new Float32Array(0),
    critSubset: [],
    critRing: null,
    critRingMat: null,
    cycleTimer: 0,
    cycleIndex: 0,
    cyclePairs: [],
  };

  const animState: AnimationState = {
    mx: 0, my: 0,
    scrollPct: 0,
    spikeAutoTimer: 0,
    isBrainVisible: true,
  };

  /* Canvas position tracking for float/unfloat */
  const canvasOriginalParent = canvas.parentNode!;
  const canvasNextSibling = canvas.nextSibling;
  const alicePhotoRow = document.getElementById('alice-photo-row');
  const cnBrainTarget = document.getElementById('cn-brain-target');

  try {
    /* Initialize 3D scene */
    const s = initScene(canvas, isMobile);

    /* Build brain mesh */
    const brain = window.BRAIN ? buildRealBrain(s) : buildFallbackBrain(s);

    /* Decorative electrodes */
    makeElectrodes(s);

    /* Build epileptogenic network */
    const net = buildEpiNetwork(s, brain);

    /* Input handlers */
    initDragHandlers(s, drag);
    initMouseAndScroll(animState);
    if (net) {
      initBrainClickHandlers(s, net);
      scheduleFirstSpike(net, s.clock, isMobile);
    }

    /* Start animation loop */
    startAnimationLoop(s, brain, net, drag, alice, cn, animState);
    const animate = getAnimateFn(animState);

    /* Visibility observer - pauses rendering when off-screen */
    initBrainVisibilityObserver(s, animState);

    /* Narrative section spike triggers */
    initNarrativeObservers(net, s);

    /* Helper closures for cross-module callbacks */
    const stopAlice = () => stopAliceVisualization(s, alice, alicePhotoRow, canvasOriginalParent, canvasNextSibling);
    const stopCN = () => stopCNVisualization(s, cn, canvasOriginalParent, canvasNextSibling);

    /* Alice story visualization */
    if (net) {
      initAliceObservers(
        s, net, alice, cn, animState,
        alicePhotoRow, canvasOriginalParent, canvasNextSibling,
        animate, stopCN,
      );
      initSolCardInteractions(
        s, alice, animState,
        alicePhotoRow, canvasOriginalParent, canvasNextSibling,
        animate,
      );
    }

    /* sEEG signal overlay for CN Phase 1 */
    initSEEG();

    /* Critical Nodes interactive */
    initCNObservers(
      s, cn, alice, animState,
      cnBrainTarget, canvasOriginalParent, canvasNextSibling,
      animate, stopAlice,
    );

    /* Resize handler */
    window.addEventListener('resize', () => {
      s.camera.aspect = canvas.clientWidth / canvas.clientHeight;
      s.camera.updateProjectionMatrix();
      s.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    });
  } catch (e) {
    console.warn('WebGL init error:', e);
  }

  /* 2D neural background for content sections */
  initBackground(isMobile, animState);
})();
