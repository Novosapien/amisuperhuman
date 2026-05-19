import React from 'react';
import path from 'path';
import {
  Document, Page, View, Text, Image, StyleSheet, renderToBuffer,
} from '@react-pdf/renderer';
import type { SuperhumanAnalysis } from './types';

const GREEN  = '#47F061';
const NAVY   = '#1C0A33';
const WHITE  = '#FFFFFF';
const DIM    = '#8B7FAB';
const CARD   = '#2A1647';
const BORDER = '#3D2560';
const AMBER  = '#F5C842';

// A4 = 595 x 842pt.
// Header: ~52pt. Footer (absolute): 32pt from bottom, ~26pt tall.
// Body safe zone: paddingTop 28, paddingBottom 80 (clears absolute footer).
const s = StyleSheet.create({
  page:  { backgroundColor: NAVY, fontFamily: 'Helvetica' },

  // ── Header ───────────────────────────────────────────────────────────────
  header:       { backgroundColor: GREEN, paddingHorizontal: 40, paddingVertical: 14,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLogo:   { height: 24, width: 116, objectFit: 'contain' },
  headerLabel:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 1.5 },

  // ── Body ─────────────────────────────────────────────────────────────────
  // paddingBottom 76 reserves space so content never runs under the absolute footer
  body:         { paddingHorizontal: 40, paddingTop: 28, paddingBottom: 76 },

  // ── Footer — absolute, pinned to page bottom ──────────────────────────────
  footer:       { position: 'absolute', bottom: 28, left: 40, right: 40,
                  borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 10,
                  flexDirection: 'row', justifyContent: 'space-between' },
  footerText:   { fontSize: 7.5, color: DIM },
  footerGreen:  { fontSize: 7.5, color: GREEN },

  // ── Page section title ────────────────────────────────────────────────────
  pageTitle:    { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GREEN,
                  letterSpacing: 2.5, marginBottom: 24 },

  // ── PAGE 1: Score ─────────────────────────────────────────────────────────
  scoreWrap:    { alignItems: 'center' },
  eyebrow:      { fontSize: 9, fontFamily: 'Helvetica-Bold', color: GREEN,
                  letterSpacing: 3, marginBottom: 14 },
  scoreRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  scoreNum:     { fontSize: 96, fontFamily: 'Helvetica-Bold', color: GREEN, lineHeight: 1 },
  scoreMax:     { fontSize: 20, color: DIM, paddingBottom: 14 },
  percentile:   { fontSize: 13, color: WHITE, marginTop: 14, marginBottom: 26 },
  verdictBox:   { width: '100%', paddingHorizontal: 22, paddingVertical: 18,
                  backgroundColor: CARD, borderLeftWidth: 4, borderLeftColor: GREEN,
                  marginBottom: 24 },
  verdictText:  { fontSize: 11, color: WHITE, lineHeight: 1.7 },
  builderNote:  { width: '100%', paddingHorizontal: 14, paddingVertical: 12,
                  backgroundColor: '#0C2B10', borderRadius: 5,
                  borderLeftWidth: 3, borderLeftColor: GREEN },
  builderText:  { fontSize: 9, color: GREEN, lineHeight: 1.55 },

  // ── PAGE 2: Dimensions ────────────────────────────────────────────────────
  dimBlock:     { marginBottom: 20 },
  dimRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dimName:      { fontSize: 10, color: WHITE, width: 158 },
  dimBarBg:     { flex: 1, height: 7, backgroundColor: BORDER, borderRadius: 4, marginHorizontal: 12 },
  dimBarFill:   { height: 7, backgroundColor: GREEN, borderRadius: 4 },
  dimScoreTxt:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: GREEN, width: 34, textAlign: 'right' },
  dimDesc:      { fontSize: 9, color: DIM, lineHeight: 1.55, paddingLeft: 158 },

  // ── PAGE 3: Task Stack Analysis (detailed) ────────────────────────────────
  tierSection:  { marginBottom: 18 },
  tierHeader:   { flexDirection: 'row', alignItems: 'center', gap: 10,
                  marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: BORDER },
  tierBadge:    { fontSize: 7.5, fontFamily: 'Helvetica-Bold', letterSpacing: 1.5,
                  paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3 },
  tierMetric:   { fontSize: 14, fontFamily: 'Helvetica-Bold' },
  tierMetaLbl:  { fontSize: 7.5, color: DIM },
  taskCard:     { backgroundColor: CARD, borderRadius: 5, padding: 12,
                  marginBottom: 8, borderWidth: 1, borderColor: BORDER },
  taskCurrent:  { fontSize: 9.5, color: WHITE, marginBottom: 6, lineHeight: 1.45 },
  taskArrow:    { fontSize: 8.5, color: GREEN, marginBottom: 5, lineHeight: 1.45 },
  taskToolsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 6 },
  taskToolTag:  { fontSize: 7, color: GREEN, borderWidth: 1, borderColor: BORDER,
                  paddingHorizontal: 5, paddingVertical: 2, borderRadius: 2 },
  taskTry:      { fontSize: 8, color: AMBER, lineHeight: 1.4 },

  // ── PAGE 4: Action Plan ───────────────────────────────────────────────────
  stepCard:     { backgroundColor: CARD, borderRadius: 6, padding: 18,
                  borderWidth: 1, borderColor: BORDER, marginBottom: 16 },
  stepHeader:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  stepNum:      { fontSize: 8, fontFamily: 'Helvetica-Bold', color: NAVY,
                  backgroundColor: GREEN, paddingHorizontal: 8, paddingVertical: 3,
                  borderRadius: 3, marginRight: 10 },
  stepTime:     { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GREEN, letterSpacing: 1 },
  stepTitle:    { fontSize: 12, fontFamily: 'Helvetica-Bold', color: WHITE, marginBottom: 7 },
  stepBody:     { fontSize: 9.5, color: DIM, lineHeight: 1.6, marginBottom: 10 },
  stepTools:    { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  toolTag:      { fontSize: 7.5, color: GREEN, borderWidth: 1, borderColor: BORDER,
                  paddingHorizontal: 7, paddingVertical: 3, borderRadius: 3 },
});

const LOGO_PATH = path.join(process.cwd(), 'public', 'rt-logo-green.png');

const DIM_CONFIG: { key: string; label: string; max: number }[] = [
  { key: 'task_composition',     label: 'D1 - Task Composition',       max: 25 },
  { key: 'ai_signal_strength',   label: 'D2 - AI Signal Strength',     max: 25 },
  { key: 'skill_transferability',label: 'D3 - Skill Transferability',   max: 20 },
  { key: 'seniority_leverage',   label: 'D4 - Seniority Leverage',     max: 15 },
  { key: 'industry_velocity',    label: 'D5 - Industry AI Velocity',   max: 10 },
  { key: 'career_momentum',      label: 'D6 - Career Momentum',        max:  5 },
];

const TIER_COLORS: Record<string, string> = { mundane: GREEN, mediocre: AMBER, core: WHITE };
const TIER_BG:     Record<string, string> = { mundane: '#0C2B10', mediocre: '#302900', core: '#25203A' };
const TIER_LABELS: Record<string, string> = {
  mundane:  'TIER 1 — MUNDANE',
  mediocre: 'TIER 2 — MEDIOCRE',
  core:     'TIER 3 — CORE',
};

export async function generateReportPdf(analysis: SuperhumanAnalysis, name: string): Promise<Buffer> {
  const E = React.createElement;
  const a = analysis;
  const tiers = ['mundane', 'mediocre', 'core'] as const;
  const displayName = a.detected_name || name;

  // Shared header component
  const hdr = (label: string) =>
    E(View, { style: s.header },
      E(Image, { style: s.headerLogo, src: LOGO_PATH }),
      E(Text, { style: s.headerLabel }, label)
    );

  // Shared footer component — position:absolute pins it to page bottom
  const ftr = (left: string, right: string) =>
    E(View, { style: s.footer },
      E(Text, { style: s.footerText }, left),
      E(Text, { style: s.footerGreen }, right)
    );

  const doc = E(Document, { title: 'Superhuman Report', author: 'RebelTechnologist' },

    // ════════════════════════════════════════════════
    //  PAGE 1 — Superhuman Score
    // ════════════════════════════════════════════════
    E(Page, { size: 'A4', style: s.page },
      hdr('SUPERHUMAN REPORT  2026'),
      E(View, { style: s.body },
        E(Text, { style: s.pageTitle }, 'YOUR SUPERHUMAN SCORE'),

        E(View, { style: s.scoreWrap },
          E(Text, { style: s.eyebrow }, 'OVERALL READINESS'),
          E(View, { style: s.scoreRow },
            E(Text, { style: s.scoreNum }, String(a.overall_score)),
            E(Text, { style: s.scoreMax }, '/ 100')
          ),
          E(Text, { style: s.percentile }, a.percentile_label)
        ),

        E(View, { style: s.verdictBox },
          E(Text, { style: s.verdictText }, a.verdict)
        ),

        ...(a.builder_paradox_note ? [
          E(View, { style: s.builderNote },
            E(Text, { style: s.builderText }, a.builder_paradox_note)
          )
        ] : []),

        ...(a.agentic_bonus_applied ? [
          E(View, { style: { marginTop: 12, backgroundColor: '#0C2B10', borderRadius: 5,
                             borderLeftWidth: 3, borderLeftColor: GREEN,
                             paddingHorizontal: 14, paddingVertical: 10 } },
            E(Text, { style: { fontSize: 9, color: GREEN, fontFamily: 'Helvetica-Bold', letterSpacing: 1 } },
              'AGENTIC BONUS UNLOCKED +5 - Autonomous multi-step AI workflow detected in profile.')
          )
        ] : []),

        E(View, { style: { marginTop: 20, paddingHorizontal: 20, paddingVertical: 14,
                           backgroundColor: CARD, borderRadius: 6, borderWidth: 1, borderColor: BORDER } },
          E(Text, { style: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: GREEN,
                             letterSpacing: 2, marginBottom: 6 } }, 'SCORE BAND'),
          E(Text, { style: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: WHITE,
                             marginBottom: 4 } }, a.score_band ?? ''),
          E(Text, { style: { fontSize: 10, color: DIM } }, (() => {
            const m: Record<string, string> = {
              Foundation: 'The tools exist. The roadmap starts here.',
              Emerging:   "You've got the instincts. Now build the stack.",
              Advancing:  "You're ahead of the curve. Push harder.",
              Superhuman: "Top tier. You're in the top percentile globally.",
            };
            return m[a.score_band ?? ''] ?? '';
          })())
        )
      ),
      ftr('amisuperhuman.com  |  RebelTechnologist', displayName + '  |  ' + a.detected_role)
    ),

    // ════════════════════════════════════════════════
    //  PAGE 2 — 5-Dimension Breakdown
    // ════════════════════════════════════════════════
    E(Page, { size: 'A4', style: s.page },
      hdr('6-DIMENSION BREAKDOWN'),
      E(View, { style: s.body },
        E(Text, { style: s.pageTitle }, '6-DIMENSION SCORE BREAKDOWN'),

        ...DIM_CONFIG.map(({ key, label, max }) => {
          const dim = (a.dimensions as Record<string, { score: number; description: string }>)[key];
          if (!dim) return null;
          const pct = Math.round((dim.score / max) * 100);
          return E(View, { key, style: s.dimBlock, wrap: false },
            E(View, { style: s.dimRow },
              E(Text, { style: s.dimName }, label),
              E(View, { style: s.dimBarBg },
                E(View, { style: [s.dimBarFill, { width: String(pct) + '%' }] })
              ),
              E(Text, { style: s.dimScoreTxt }, String(dim.score) + '/' + String(max))
            ),
            E(Text, { style: s.dimDesc }, dim.description)
          );
        })
      ),
      ftr('amisuperhuman.com  |  RebelTechnologist', 'Overall: ' + a.overall_score + '/100  |  ' + a.percentile_label)
    ),

    // ════════════════════════════════════════════════
    //  PAGE 3 — Task Stack Analysis (full detail)
    // ════════════════════════════════════════════════
    E(Page, { size: 'A4', style: s.page },
      hdr('YOUR TASK STACK ANALYSIS'),
      E(View, { style: s.body },
        E(Text, { style: s.pageTitle }, 'BEFORE AND AFTER YOUR SUPERHUMAN STACK'),

        ...tiers.map(tier => {
          const t = a.task_tiers[tier];
          if (!t) return null;
          const colour = TIER_COLORS[tier];
          const bg     = TIER_BG[tier];
          return E(View, { key: tier, style: s.tierSection },
            // Tier header row: badge + metric
            E(View, { style: s.tierHeader },
              E(View, { style: [s.tierBadge, { backgroundColor: bg }] },
                E(Text, { style: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: colour, letterSpacing: 1.5 } },
                  TIER_LABELS[tier])
              ),
              E(View, { style: { marginLeft: 'auto', alignItems: 'flex-end' } },
                E(Text, { style: [s.tierMetric, { color: colour }] }, t.metric_value),
                E(Text, { style: s.tierMetaLbl }, t.metric_label)
              )
            ),
            // Task cards
            ...t.tasks.map((task, i) =>
              E(View, { key: i, style: s.taskCard, wrap: false },
                E(Text, { style: s.taskCurrent }, 'Currently: ' + task.current_text),
                E(Text, { style: { fontSize: 7.5, color: DIM, marginBottom: 6 } }, task.current_sub),
                E(Text, { style: s.taskArrow }, 'Superhuman: ' + task.superhuman_action),
                E(View, { style: s.taskToolsRow },
                  ...task.tools.map((tool, ti) =>
                    E(Text, { key: ti, style: s.taskToolTag }, tool)
                  )
                ),
                E(Text, { style: s.taskTry }, 'Try this: ' + task.try_this)
              )
            )
          );
        }).filter(Boolean)
      ),
      ftr('amisuperhuman.com  |  RebelTechnologist', displayName + '  |  ' + a.detected_role)
    ),

    // ════════════════════════════════════════════════
    //  PAGE 4 — 3-Step Action Plan
    // ════════════════════════════════════════════════
    E(Page, { size: 'A4', style: s.page },
      hdr('YOUR ACTION PLAN'),
      E(View, { style: s.body },
        E(Text, { style: s.pageTitle }, 'YOUR 3-STEP SUPERHUMAN PLAN'),

        ...a.action_plan.map(step =>
          E(View, { key: step.step, style: s.stepCard, wrap: false },
            E(View, { style: s.stepHeader },
              E(Text, { style: s.stepNum }, 'STEP ' + step.step),
              E(Text, { style: s.stepTime }, step.time_frame.toUpperCase())
            ),
            E(Text, { style: s.stepTitle }, step.title),
            E(Text, { style: s.stepBody }, step.body),
            E(View, { style: s.stepTools },
              ...step.tools.map((tool, i) =>
                E(Text, { key: i, style: s.toolTag }, tool)
              )
            )
          )
        )
      ),
      ftr('amisuperhuman.com  |  RebelTechnologist', 'Score: ' + a.overall_score + '/100  |  ' + a.percentile_label)
    )
  );

  return renderToBuffer(doc) as Promise<Buffer>;
}
