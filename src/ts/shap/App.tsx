import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, LabelList, ReferenceLine,
} from 'recharts';
import type {
  TagProps, SectionHeaderProps, MiniStatProps, CorrelBarProps,
  TooltipContentProps, ModeId,
} from './types';
import {
  BG, SURF, CARD, BDR, C1, C2, C3, TXT, MUT, GRN, RED, AMB,
  TIER, FEATS, CORR, GRAD, MODES, MODE_INDEX, NODES, EDGES,
  mono, serif, nodeColor,
} from './data';

// ── Sub-components ──────────────────────────────────────────────────

function Tag({ children, col }: TagProps) {
  return (
    <span style={{
      ...mono, fontSize: 10, color: col || MUT,
      background: `${col || MUT}18`, border: `1px solid ${col || MUT}44`,
      borderRadius: 4, padding: '2px 7px',
    }}>
      {children}
    </span>
  );
}

function SectionHeader({ title, sub }: SectionHeaderProps) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ ...serif, margin: '0 0 5px', fontSize: 22, fontWeight: 900, color: TXT, letterSpacing: -.4, lineHeight: 1.1 }}>{title}</h2>
      <p style={{ ...mono, margin: 0, fontSize: 11, color: MUT }}>{sub}</p>
    </div>
  );
}

function MiniStat({ val, label, sub, col }: MiniStatProps) {
  return (
    <div style={{ background: CARD, borderRadius: 10, padding: '14px 16px', border: `1px solid ${col || BDR}44` }}>
      <div style={{ ...mono, fontSize: 22, fontWeight: 500, color: col || TXT, marginBottom: 3 }}>{val}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: TXT, marginBottom: 2 }}>{label}</div>
      <div style={{ ...mono, fontSize: 10, color: MUT }}>{sub}</div>
    </div>
  );
}

function CorrelBar({ pair, raw, shap, rc, sc }: CorrelBarProps) {
  const rw = Math.min(Math.abs(raw), 1) * 45;
  const sw = Math.min(Math.abs(shap), 1) * 45;
  const rpos = raw >= 0;
  const spos = shap >= 0;
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ ...mono, fontSize: 11, color: TXT }}>{pair}</span>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ ...mono, fontSize: 11, color: rc }}>raw {raw > 0 ? '+' : ''}{raw.toFixed(3)}</span>
          <span style={{ ...mono, fontSize: 11, color: sc }}>SHAP {shap > 0 ? '+' : ''}{shap.toFixed(3)}</span>
        </div>
      </div>
      {[
        { v: raw, c: rc, pos: rpos, w: rw, lbl: 'raw' },
        { v: shap, c: sc, pos: spos, w: sw, lbl: 'shap' },
      ].map(bar => (
        <div key={bar.lbl} style={{ height: 8, background: SURF, borderRadius: 4, position: 'relative' as const, marginBottom: 4 }}>
          <div style={{ position: 'absolute' as const, left: '50%', top: 0, width: 1, height: '100%', background: BDR, zIndex: 2 }} />
          <div style={{
            position: 'absolute' as const, height: '100%', width: `${bar.w}%`,
            [bar.pos ? 'left' : 'right']: '50%',
            background: bar.c, borderRadius: 4, opacity: .85, transition: 'width .5s ease',
          }} />
        </div>
      ))}
    </div>
  );
}

// ── Network Topology ────────────────────────────────────────────────

function NetworkPanel() {
  const [mode, setMode] = useState<ModeId>('bc');
  const [ictal, setIctal] = useState(false);
  const cm = MODES.find(m => m.id === mode)!;
  const mIdx = MODE_INDEX[mode];

  const cDeg = EDGES.filter(e =>
    (e[0] === 'C' || e[1] === 'C') && (ictal ? e[mIdx + 2] : e[2]) === 1
  ).length;

  return (
    <div>
      <SectionHeader title="Network Topology Explorer"
        sub="Visualize how the critical contact's causal network role transforms from inter-ictal baseline to seizure onset" />

      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setIctal(false); }} style={{
            flex: 1, padding: '12px 10px', cursor: 'pointer', transition: 'all .15s',
            background: mode === m.id ? `${m.color}15` : CARD,
            border: `1px solid ${mode === m.id ? m.color : BDR}`, borderRadius: 10,
            color: mode === m.id ? m.color : MUT,
          }}>
            <div style={{ fontSize: 22, marginBottom: 3 }}>{m.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{m.label}</div>
            <div style={{ ...mono, fontSize: 10, color: mode === m.id ? m.color + 'aa' : MUT }}>|SHAP|={m.shap} · #{m.rank}</div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, alignItems: 'start' }}>
        {/* SVG Panel */}
        <div style={{ background: CARD, borderRadius: 12, padding: '16px', border: `1px solid ${BDR}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ ...mono, fontSize: 10, color: ictal ? cm.color : MUT }}>{ictal ? '\u26a1 ICTAL' : '\u25cb BASELINE'}</span>
            <div style={{ display: 'flex', gap: 5 }}>
              {['Baseline', 'Ictal'].map((l, i) => (
                <button key={l} onClick={() => setIctal(i === 1)} style={{
                  ...mono, padding: '3px 9px', fontSize: 10, cursor: 'pointer', borderRadius: 5,
                  background: (ictal ? i === 1 : i === 0) ? `${i ? cm.color : MUT}22` : 'transparent',
                  border: `1px solid ${(ictal ? i === 1 : i === 0) ? i ? cm.color : MUT : BDR}`,
                  color: (ictal ? i === 1 : i === 0) ? i ? cm.color : TXT : MUT,
                }}>{l}</button>
              ))}
            </div>
          </div>

          <svg viewBox="0 0 240 220" style={{ width: '100%', height: 210 }}>
            <text x="35" y="17" fill={`${C1}66`} fontSize="9" textAnchor="middle" fontFamily="'DM Mono',monospace">Cluster A</text>
            <text x="205" y="17" fill={`${C2}66`} fontSize="9" textAnchor="middle" fontFamily="'DM Mono',monospace">Cluster B</text>

            {EDGES.map(([fr, to, bl, ...modes], i) => {
              const present = ictal ? modes[mIdx - 1] === 1 : bl === 1;
              const isNew = !bl && modes[mIdx - 1] === 1;
              const isHH = (fr === 'A1' && to === 'B1') || (fr === 'B1' && to === 'A1');
              const n1 = NODES[fr], n2 = NODES[to];
              let col = fr[0] === 'A' && to[0] === 'A' ? C1 : fr[0] === 'B' && to[0] === 'B' ? C2 : TXT;
              if (ictal && isNew) col = cm.color;
              if (ictal && isHH) col = cm.color;
              return (
                <line key={i} x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                  stroke={present ? col : BDR}
                  strokeWidth={present ? (ictal && (isNew || isHH) ? 2.8 : 1.5) : .5}
                  strokeOpacity={present ? (ictal && (isNew || isHH) ? 1 : .55) : .1}
                  style={{ transition: 'all .45s ease' }}
                />
              );
            })}

            {Object.entries(NODES).map(([id, nd]) => {
              const iC = nd.type === 'crit';
              const glow = iC && ictal;
              return (
                <g key={id} style={{ transition: 'all .45s ease' }}>
                  {glow && <circle cx={nd.x} cy={nd.y} r={24} fill={cm.color} opacity={.08} />}
                  {glow && <circle cx={nd.x} cy={nd.y} r={17} fill="none" stroke={cm.color} strokeWidth={1.5} opacity={.3} />}
                  <circle cx={nd.x} cy={nd.y} r={iC ? 13 : 9.5}
                    fill={nodeColor(nd.type, ictal, cm.color)}
                    fillOpacity={.92}
                    style={{ transition: 'fill .4s,r .4s', filter: glow ? `drop-shadow(0 0 7px ${cm.color})` : 'none' }} />
                  <text x={nd.x} y={nd.y + 1} fill={iC ? BG : TXT} fontSize={iC ? 9 : 8}
                    fontWeight={iC ? 700 : 400} textAnchor="middle" dominantBaseline="middle"
                    fontFamily="'DM Mono',monospace" style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {nd.lbl}
                  </text>
                </g>
              );
            })}
          </svg>

          <div style={{ textAlign: 'center', marginTop: 4, ...mono, fontSize: 11, color: MUT }}>
            C* connections: <span style={{ color: ictal ? cm.color : TXT, fontWeight: 500 }}>{cDeg}</span>
          </div>
        </div>

        {/* Explanation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: CARD, borderRadius: 12, padding: '18px 20px', border: `1px solid ${cm.color}44` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: `${cm.color}18`, border: `1px solid ${cm.color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cm.icon}</div>
              <div>
                <div style={{ ...serif, fontSize: 16, fontWeight: 700, color: cm.color }}>{cm.title}</div>
                <div style={{ ...mono, fontSize: 10, color: MUT }}>Rank {cm.rank} · |SHAP| = {cm.shap} (high-critical contacts)</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: TXT, lineHeight: 1.7, margin: '0 0 12px' }}>{cm.desc}</p>
            <div style={{ background: `${cm.color}0f`, border: `1px solid ${cm.color}33`, borderRadius: 8, padding: '8px 12px', ...mono, fontSize: 12, color: cm.color }}>
              {'\u25b8'} {cm.insight}
            </div>
          </div>

          <div style={{ background: CARD, borderRadius: 12, padding: '14px 18px', border: `1px solid ${BDR}` }}>
            <div style={{ ...mono, fontSize: 10, color: MUT, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>All Tier 1 Features</div>
            {MODES.map((m, i) => {
              const active = mode === m.id;
              const pct = (parseFloat(m.shap) / 0.42) * 100;
              return (
                <div key={m.id} onClick={() => { setMode(m.id); setIctal(false); }} style={{
                  padding: '8px 0', borderBottom: i < 2 ? `1px solid ${BDR}` : 'none', cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: active ? TXT : MUT }}>{m.label}</span>
                    <span style={{ ...mono, fontSize: 12, color: active ? m.color : MUT, fontWeight: 500 }}>{m.shap}</span>
                  </div>
                  <div style={{ height: 5, background: SURF, borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: m.color, borderRadius: 3, opacity: .8, transition: 'width .4s' }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: `${AMB}0d`, border: `1px solid ${AMB}44`, borderRadius: 10, padding: '12px 16px' }}>
            <p style={{ margin: 0, fontSize: 12, color: TXT, lineHeight: 1.65 }}>
              <strong style={{ color: AMB }}>Combined signature:</strong> A critical contact simultaneously becomes a routing bridge (betweenness {'\u2191'}), connects to influential hubs (eigenvector {'\u2191'}), and anchors a cohesive local subnetwork (clustering {'\u2191'}) - the computational correlate of the seizure <em>driver region</em>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Feature Hierarchy ───────────────────────────────────────────────

function HierarchyPanel() {
  function CustomTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    const f = FEATS.find(x => x.s === label);
    return (
      <div style={{ background: SURF, border: `1px solid ${BDR}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: TXT, marginBottom: 5 }}>{f?.label || label}</div>
        <div style={{ ...mono, color: TIER[f?.t || 3] }}>High-critical: {payload[0]?.value?.toFixed(4)}</div>
        <div style={{ ...mono, color: MUT }}>Low-critical:  {payload[1]?.value?.toFixed(4)}</div>
        <div style={{ ...mono, color: MUT, marginTop: 4, fontSize: 10 }}>MW p = {f?.p}</div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Three-Tier Feature Hierarchy"
        sub="Mean |SHAP| attribution per feature · high-critical (n=4,235) vs. low-critical (n=15,022) contacts" />

      <div style={{ display: 'flex', gap: 14, marginBottom: 6 }}>
        {([
          [1, 'Dynamic Network Topology', 'Ranks 1-3'],
          [2, 'Static Network Position', 'Rank 4'],
          [3, 'Waveform & HFO', 'Ranks 5+'],
        ] as const).map(([t, n, s]) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: TIER[t] }} />
            <div>
              <div style={{ fontSize: 11, color: TXT, fontWeight: 600 }}>{n}</div>
              <div style={{ ...mono, fontSize: 9, color: MUT }}>{s}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: CARD, borderRadius: 12, padding: '20px 18px 10px', border: `1px solid ${BDR}`, marginBottom: 16 }}>
        <ResponsiveContainer width="100%" height={290}>
          <BarChart data={FEATS} layout="vertical" margin={{ left: 66, right: 58, top: 4, bottom: 0 }} barCategoryGap="20%">
            <XAxis type="number" domain={[0, .45]} tick={{ fill: MUT, fontSize: 10, ...mono } as object} axisLine={{ stroke: BDR }} tickLine={false} />
            <YAxis type="category" dataKey="s" tick={{ fill: TXT, fontSize: 11, ...mono } as object} axisLine={false} tickLine={false} width={65} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={.27} stroke={`${C2}55`} strokeDasharray="4 4" />
            <ReferenceLine x={.19} stroke={`${C3}55`} strokeDasharray="4 4" />
            <Bar dataKey="hc" name="High-critical" radius={[0, 3, 3, 0] as [number, number, number, number]}>
              {FEATS.map(f => <Cell key={f.s} fill={TIER[f.t]} fillOpacity={.9} />)}
              <LabelList dataKey="hc" position="right" formatter={(v: unknown) => Number(v).toFixed(3)} style={{ fill: MUT, fontSize: 10, ...mono } as object} />
            </Bar>
            <Bar dataKey="lc" name="Low-critical" radius={[0, 3, 3, 0] as [number, number, number, number]}>
              {FEATS.map(f => <Cell key={f.s + 'l'} fill={TIER[f.t]} fillOpacity={.22} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        <MiniStat val="0.390" label="Peak |SHAP|" sub={'\u0394 Betweenness, rank 1'} col={C1} />
        <MiniStat val={'\u0394=0.04'} label="Tier 1\u21922 Gap" sub="Small: within-network step" col={C2} />
        <MiniStat val={'\u0394=0.08'} label="Tier 2\u21923 Gap" sub="Natural break - 2\u00d7 larger" col={C3} />
      </div>

      <div style={{ background: `${C1}0f`, border: `1px solid ${C1}33`, borderRadius: 10, padding: '12px 16px' }}>
        <p style={{ margin: 0, fontSize: 13, color: TXT, lineHeight: 1.65 }}>
          <strong style={{ color: C1 }}>Central finding:</strong> All four top-ranked features are network topology measures. The first waveform/HFO feature does not appear until rank 5 - after a gap <em>twice</em> the size of the within-network step. The model, trained on outcome-anchored data, independently learned to prioritize network reorganization over local electrophysiological activity.
        </p>
      </div>
    </div>
  );
}

// ── Independence Analysis ───────────────────────────────────────────

function IndependencePanel() {
  return (
    <div>
      <SectionHeader title="Feature Independence Analysis"
        sub="Raw Spearman \u03c1 (feature space) vs. SHAP \u03c1 (attribution space) - patient level, n=59" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
        {[
          {
            title: 'Raw Feature Correlations', sub: 'Spearman \u03c1 in feature space', key: 'raw',
            note: 'Betweenness & eigenvector are anti-correlated (\u03c1=\u22120.49): contacts that become routing bridges tend NOT to simultaneously become absorbed into dominant hubs - topologically distinct roles.',
          },
          {
            title: 'SHAP Attribution Correlations', sub: 'Spearman \u03c1 in attribution space', key: 'shap',
            note: 'Despite raw anti-correlation, betweenness/eigenvector SHAP are uncorrelated (\u03c1=0.06). The model assigns independent credit to each. Clustering SHAP correlates positively with both - acting as a partial substitute.',
          },
        ].map(p => (
          <div key={p.key} style={{ background: CARD, borderRadius: 12, padding: '18px 20px', border: `1px solid ${BDR}` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 2 }}>{p.title}</div>
            <div style={{ ...mono, fontSize: 10, color: MUT, marginBottom: 14 }}>{p.sub}</div>
            {CORR.map((d, i) => <CorrelBar key={i} pair={d.pair} raw={d.raw} shap={d.shap} rc={d.rc} sc={d.sc} />)}
            <div style={{ ...mono, fontSize: 10, color: MUT, marginTop: 12, lineHeight: 1.55, borderTop: `1px solid ${BDR}`, paddingTop: 10 }}>{p.note}</div>
          </div>
        ))}
      </div>

      <div style={{ background: CARD, borderRadius: 12, padding: '16px 20px', border: `1px solid ${BDR}`, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: TXT, marginBottom: 12 }}>The Convergence Paradox - Summary Table</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', ...mono, fontSize: 11 }}>
            <thead>
              <tr>
                {['Feature Pair', 'Raw \u03c1', 'SHAP \u03c1', 'Interpretation'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '6px 12px', color: MUT, fontSize: 10, textTransform: 'uppercase', letterSpacing: .7, borderBottom: `1px solid ${BDR}`, fontWeight: 400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { p: '\u0394BC vs \u0394EC', r: '-0.488***', rc: RED, s: '0.061 ns', sc: '#6b7280', desc: 'Anti-correlated in feature space; model independently credits each' },
                { p: '\u0394BC vs \u0394Clust', r: ' 0.113 ns', rc: MUT, s: '0.442***', sc: GRN, desc: 'Convergent in attribution - clustering substitutes when betweenness is weak' },
                { p: '\u0394EC vs \u0394Clust', r: '-0.136 ns', rc: MUT, s: '0.367** ', sc: GRN, desc: 'Same convergent pattern - all three point to the same latent construct' },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${BDR}` }}>
                  <td style={{ padding: '9px 12px', color: C1 }}>{row.p}</td>
                  <td style={{ padding: '9px 12px', color: row.rc, fontWeight: 600 }}>{row.r}</td>
                  <td style={{ padding: '9px 12px', color: row.sc, fontWeight: 600 }}>{row.s}</td>
                  <td style={{ padding: '9px 12px', color: MUT, fontSize: 10, fontFamily: "'Fraunces',serif", fontStyle: 'italic' }}>{row.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ background: `${C1}0f`, border: `1px solid ${C1}33`, borderRadius: 10, padding: '12px 16px' }}>
        <p style={{ margin: 0, fontSize: 13, color: TXT, lineHeight: 1.65 }}>
          <strong style={{ color: C1 }}>Interpretation:</strong> Three partially distinct but convergent dimensions of seizure-induced network consolidation. Their convergence in attribution space <em>despite</em> divergence in feature space suggests the model learned that all three angles of evidence point to the same latent construct: <em>driver network centrality</em>.
        </p>
      </div>
    </div>
  );
}

// ── Grading vs. Classification ──────────────────────────────────────

function GradingPanel() {
  function CustomTooltip({ active, payload, label }: TooltipContentProps) {
    if (!active || !payload?.length) return null;
    const d = GRAD.find(x => x.name === label);
    return (
      <div style={{ background: SURF, border: `1px solid ${BDR}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
        <div style={{ fontWeight: 700, color: TXT, marginBottom: 5 }}>{label}</div>
        <div style={{ ...mono, color: d?.sig ? TIER[d?.t || 3] : MUT }}>{'\u03c1'} = {payload[0]?.value?.toFixed(3)}</div>
        <div style={{ ...mono, color: MUT, fontSize: 10 }}>p = {d?.p} {d?.sig ? '' : '(ns)'}</div>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader title="Grading vs. Classification"
        sub="SHAP attribution \u03c1 with continuous criticality score (predicted probability) - patient level, n=59" />

      <div style={{ background: CARD, borderRadius: 14, padding: '28px 32px', border: `2px solid ${C1}44`, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 32 }}>
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{ ...mono, fontSize: 72, fontWeight: 500, color: C1, lineHeight: 1, letterSpacing: -3 }}>0.798</div>
          <div style={{ ...mono, fontSize: 11, color: MUT, marginTop: 4 }}>p = 4.0{'\u00d7'}10{'\u207b\u00b9\u2074'}</div>
        </div>
        <div>
          <div style={{ ...serif, fontSize: 16, fontWeight: 700, color: TXT, marginBottom: 6 }}>{'\u0394'} Eigenvector Centrality {'\u2194'} Continuous Criticality Score</div>
          <p style={{ fontSize: 13, color: MUT, lineHeight: 1.65, margin: 0 }}>
            Atypically strong for feature attribution analysis. Among contacts already above threshold, the principal axis of variation in <em>criticality magnitude</em> is the degree to which a contact becomes connected to influential nodes during seizure. Eigenvector change doesn't just classify - it <strong style={{ color: TXT }}>grades</strong>.
          </p>
        </div>
      </div>

      <div style={{ background: CARD, borderRadius: 12, padding: '18px 20px 10px', border: `1px solid ${BDR}`, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: TXT, marginBottom: 14 }}>Spearman {'\u03c1'} - all features vs. continuous criticality score</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={GRAD} layout="vertical" margin={{ left: 105, right: 55, top: 2, bottom: 2 }}>
            <XAxis type="number" domain={[-.15, .9]} tick={{ fill: MUT, fontSize: 10, ...mono } as object} axisLine={{ stroke: BDR }} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fill: TXT, fontSize: 11, ...mono } as object} axisLine={false} tickLine={false} width={100} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke={BDR} />
            <Bar dataKey="rho" radius={[0, 4, 4, 0] as [number, number, number, number]}>
              {GRAD.map((d, i) => <Cell key={i} fill={d.sig ? TIER[d.t] : MUT} fillOpacity={d.sig ? .88 : .3} />)}
              <LabelList dataKey="rho" position="right" formatter={(v: unknown) => `\u03c1 = ${Number(v).toFixed(3)}`} style={{ fill: MUT, fontSize: 10, ...mono } as object} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 12, marginTop: 8, justifyContent: 'center' }}>
          {([
            [C1, 'Tier 1 - graders + classifiers'],
            [C2, 'Tier 2 - classifier only'],
            [MUT, 'Tier 3 - not significant'],
          ] as const).map(([c, l]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
              <span style={{ ...mono, fontSize: 9, color: MUT }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: CARD, borderRadius: 11, padding: '14px 18px', border: `1px solid ${C1}44` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C1, marginBottom: 7 }}>Tier 1: Graders + Classifiers</div>
          <p style={{ fontSize: 12, color: MUT, lineHeight: 1.65, margin: 0 }}>{'\u0394'}EC ({'\u03c1'}=0.798), {'\u0394'}Clust ({'\u03c1'}=0.48), {'\u0394'}BC ({'\u03c1'}=0.32) - all significantly correlated with continuous score. They encode not just <em>is this critical?</em> but <em>how critical?</em></p>
        </div>
        <div style={{ background: CARD, borderRadius: 11, padding: '14px 18px', border: `1px solid ${BDR}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: MUT, marginBottom: 7 }}>Tier 2+3: Classifiers Only</div>
          <p style={{ fontSize: 12, color: MUT, lineHeight: 1.65, margin: 0 }}>Time-averaged betweenness ({'\u03c1'}=0.21, ns) and waveform/HFO features ({'\u03c1'}{'\u2248'}{'\u22120.025'}) contribute to threshold classification but carry no graded signal about criticality <em>degree</em>.</p>
        </div>
      </div>

      <div style={{ background: `${AMB}0d`, border: `1px solid ${AMB}44`, borderRadius: 10, padding: '12px 16px' }}>
        <p style={{ margin: 0, fontSize: 13, color: TXT, lineHeight: 1.65 }}>
          <strong style={{ color: AMB }}>Clinical implication:</strong> Because the score is meaningfully graded - and {'\u0394'}EC ({'\u03c1'}=0.798) is its primary carrier - CN-Suite supports <strong>ranked prioritization of surgical targets</strong>, not just binary inclusion/exclusion. Contact ordering by score directly reflects seizure-network centrality at onset.
        </p>
      </div>
    </div>
  );
}

// ── Root ─────────────────────────────────────────────────────────────

const TABS = [
  { id: 'hierarchy', label: 'Feature Hierarchy' },
  { id: 'network', label: 'Network Topology' },
  { id: 'independence', label: 'Independence' },
  { id: 'grading', label: 'Grading vs. Classification' },
];

export default function App() {
  const [tab, setTab] = useState('hierarchy');

  return (
    <div style={{ fontFamily: "'Fraunces',serif", background: BG, minHeight: '100vh', color: TXT }}>
      {/* Header */}
      <div style={{ background: SURF, borderBottom: `1px solid ${BDR}`, padding: '16px 28px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: MUT, marginBottom: 5 }}>
            FIND Neuro · CN-Suite · Validation Run 20260112 · Confidential
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -.3, color: TXT }}>SHAP Feature Attribution Analysis</h1>
            <div style={{ display: 'flex', gap: 6 }}>
              <Tag col={C1}>N=19,257 obs</Tag>
              <Tag col={C2}>59 patients</Tag>
              <Tag col={MUT}>4 centers</Tag>
            </div>
          </div>
          <p style={{ ...mono, fontSize: 11, color: MUT, marginTop: 4 }}>Mechanistic interpretation of criticality predictions · March 2026</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: SURF, borderBottom: `1px solid ${BDR}` }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '11px 18px', fontSize: 12, fontWeight: tab === t.id ? 600 : 400, ...mono, cursor: 'pointer',
              background: 'none', border: 'none',
              color: tab === t.id ? C1 : MUT,
              borderBottom: tab === t.id ? `2px solid ${C1}` : '2px solid transparent',
              marginBottom: -1, transition: 'color .15s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '28px 28px' }}>
        {tab === 'hierarchy' && <HierarchyPanel />}
        {tab === 'network' && <NetworkPanel />}
        {tab === 'independence' && <IndependencePanel />}
        {tab === 'grading' && <GradingPanel />}
      </div>
    </div>
  );
}
