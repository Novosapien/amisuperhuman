'use client';
import { useEffect, useRef, useState } from 'react';
import type { SuperhumanAnalysis } from '@/lib/types';
import ShareModal from './ShareModal';

interface Props {
  analysis: SuperhumanAnalysis;
  formData: { name: string; linkedinUrl: string; profileText: string };
  onGradeColleague: () => void;
}

// 6-dimension config — label, max points, description of what moves the score
const DIM_CONFIG = [
  {
    key: 'task_composition' as const,
    label: 'D1 — Task Composition',
    shortLabel: 'Task Composition',
    max: 25,
    improve: 'Rewrite role descriptions to highlight strategic and cross-functional work.',
  },
  {
    key: 'ai_signal_strength' as const,
    label: 'D2 — AI Signal Strength',
    shortLabel: 'AI Signal Strength',
    max: 25,
    improve: 'Name AI tools in your About section. Describe an agentic workflow to unlock the +5 Agentic Bonus.',
  },
  {
    key: 'skill_transferability' as const,
    label: 'D3 — Skill Transferability',
    shortLabel: 'Skill Transferability',
    max: 20,
    improve: 'Add cross-functional projects, certifications, or active learning signals.',
  },
  {
    key: 'seniority_leverage' as const,
    label: 'D4 — Seniority Leverage',
    shortLabel: 'Seniority Leverage',
    max: 15,
    improve: 'Show direct work outputs in your profile, not just delegation.',
  },
  {
    key: 'industry_velocity' as const,
    label: 'D5 — Industry AI Velocity',
    shortLabel: 'Industry Velocity',
    max: 10,
    improve: 'Fixed to your industry — focus on other dimensions.',
  },
  {
    key: 'career_momentum' as const,
    label: 'D6 — Career Momentum',
    shortLabel: 'Career Momentum',
    max: 5,
    improve: 'Add recent certs, promotions, or thought leadership content.',
  },
] as const;

const SCORE_BAND_COPY: Record<string, { headline: string; sub: string }> = {
  Foundation:  { headline: 'Foundation',  sub: 'The tools exist. The roadmap starts here.' },
  Emerging:    { headline: 'Emerging',    sub: "You've got the instincts. Now build the stack." },
  Advancing:   { headline: 'Advancing',   sub: "You're ahead of the curve. Push harder." },
  Superhuman:  { headline: 'Superhuman',  sub: "Top tier. You're in the top percentile globally." },
};

const TIER_CONFIG = {
  mundane:  { label: 'Tier 1 — Mundane',  color: 'rgba(255,255,255,0.5)', stripe: 'rgba(255,255,255,0.2)' },
  mediocre: { label: 'Tier 2 — Mediocre', color: 'var(--amber)',          stripe: 'var(--amber)' },
  core:     { label: 'Tier 3 — Core',     color: 'var(--green)',          stripe: 'var(--green)' },
};

export default function ReportScreen({ analysis, formData, onGradeColleague }: Props) {
  const ringRef  = useRef<SVGCircleElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [emailName, setEmailName] = useState(formData.name);
  const [emailAddr, setEmailAddr] = useState('');
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [sendError, setSendError] = useState('');

  useEffect(() => {
    // Animate score ring
    const circumference = 440;
    const offset = circumference - (circumference * analysis.overall_score) / 100;
    setTimeout(() => {
      if (ringRef.current) ringRef.current.style.strokeDashoffset = String(offset);
    }, 300);

    // Fade-in sections
    document.querySelectorAll('.report-section').forEach((s, i) => {
      setTimeout(() => s.classList.add('visible'), i * 200);
    });

    // Animate dimension bars
    setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.dim-bar-fill').forEach((bar, j) => {
        setTimeout(() => { bar.style.width = (bar.dataset.width ?? '0') + '%'; }, j * 100);
      });
    }, 400);
  }, [analysis.overall_score]);

  async function handleSendReport(e: React.FormEvent) {
    e.preventDefault();
    if (!emailAddr.includes('@')) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch('/api/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: emailName,
          email: emailAddr,
          linkedinUrl: formData.linkedinUrl,
          profileText: formData.profileText,
          analysis,
        }),
      });
      if (!res.ok) throw new Error('Send failed');
      setSent(true);
    } catch {
      setSendError('Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const d = analysis.dimensions;
  const score = analysis.overall_score;
  const band = SCORE_BAND_COPY[analysis.score_band] ?? SCORE_BAND_COPY['Emerging'];

  return (
    <>
      <div id="screen-report" className="screen active">
        {/* Report nav */}
        <div className="report-nav">
          <div className="report-nav-brand">ЯEBEL TECHNOLOGIST</div>
          <div className="report-nav-title">Superhuman Report — {analysis.detected_name || formData.name}</div>
          <button className="btn-ghost" onClick={() => setShareOpen(true)}>Share My Score</button>
        </div>

        {/* ── Hero + score ring ── */}
        <div className="report-section report-hero" id="sec-hero">
          <div className="report-hero-inner">
            <div>
              <div className="report-eyebrow">Official Superhuman Assessment</div>
              <div className="report-name">{analysis.detected_name || formData.name || 'Your'} Superhuman Report</div>
              <div className="report-role">{analysis.detected_role} · {analysis.detected_industry}</div>

              {/* Agentic bonus badge */}
              {analysis.agentic_bonus_applied && (
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'rgba(71,240,97,0.12)', border: '1px solid rgba(71,240,97,0.35)',
                  color: 'var(--green)', fontSize: 11, fontWeight: 700,
                  letterSpacing: '1.5px', textTransform: 'uppercase',
                  padding: '5px 12px', borderRadius: 100, marginBottom: 12,
                }}>
                  <span style={{ fontSize: 14 }}>⚡</span> Agentic Bonus Unlocked +5
                </div>
              )}

              {/* Builder's paradox note */}
              {analysis.builder_paradox_note && (
                <div style={{
                  fontSize: 12, color: 'var(--amber)',
                  background: 'rgba(245,200,66,.08)', border: '1px solid rgba(245,200,66,.2)',
                  borderRadius: 4, padding: '8px 12px', marginBottom: 12,
                }}>
                  ⚡ {analysis.builder_paradox_note}
                </div>
              )}

              <div className="report-verdict">{analysis.verdict}</div>
            </div>

            {/* Score ring */}
            <div className="score-display">
              <div className="score-ring-container">
                <svg viewBox="0 0 160 160" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle className="score-ring-bg" cx="80" cy="80" r="70" />
                  <circle ref={ringRef} className="score-ring-fill" cx="80" cy="80" r="70"
                    style={{ strokeDashoffset: 440 }} />
                </svg>
                <div className="score-center">
                  <div className="score-number">{score}</div>
                  <div className="score-label">/ 100</div>
                </div>
              </div>
              <div className="score-title">{score}% Superhuman</div>
              <div className="score-subtitle">{analysis.percentile_label}</div>

              {/* Score band chip */}
              <div style={{
                marginTop: 8, display: 'inline-block',
                background: 'rgba(71,240,97,0.12)', border: '1px solid rgba(71,240,97,0.3)',
                color: 'var(--green)', fontSize: 10, fontWeight: 700,
                letterSpacing: '2px', textTransform: 'uppercase',
                padding: '4px 12px', borderRadius: 100,
              }}>
                {band.headline}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6, textAlign: 'center' }}>
                {band.sub}
              </div>
            </div>
          </div>
        </div>

        <div className="report-body">

          {/* ── 6-Dimension Breakdown ── */}
          <div className="report-section" id="sec-dims">
            <div className="section-title">6-Dimension Score Breakdown</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.6 }}>
              Every dimension maps directly to what you can update on your LinkedIn profile to improve it on re-run.
            </div>

            <div className="dimensions-grid">
              {DIM_CONFIG.map(({ key, label, max, improve }) => {
                const dim = d[key];
                if (!dim) return null;
                const pct = Math.round((dim.score / max) * 100);
                const barColor = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : '#ff6b6b';

                return (
                  <div key={key} className="dim-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div className="dim-name">{label}</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, flexShrink: 0 }}>
                        <span className="dim-score" style={{ fontSize: 22 }}>{dim.score}</span>
                        <span className="dim-max">/{max}</span>
                      </div>
                    </div>
                    <div className="dim-bar-track">
                      <div className="dim-bar-fill" data-width={pct}
                        style={{ width: 0, background: barColor }} />
                    </div>
                    <div className="dim-verdict">{dim.description}</div>
                    {/* Improvement hint */}
                    {pct < 80 && (
                      <div style={{
                        marginTop: 8, fontSize: 11, color: 'rgba(71,240,97,0.7)',
                        borderTop: '1px solid rgba(71,240,97,0.1)', paddingTop: 8, lineHeight: 1.55,
                      }}>
                        <span style={{ fontWeight: 700, color: 'var(--green)' }}>To improve: </span>
                        {improve}
                      </div>
                    )}
                    {/* Agentic bonus callout on D2 */}
                    {key === 'ai_signal_strength' && analysis.agentic_bonus_applied && (
                      <div style={{
                        marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(71,240,97,0.1)', border: '1px solid rgba(71,240,97,0.25)',
                        borderRadius: 100, padding: '2px 10px', fontSize: 10, fontWeight: 700,
                        color: 'var(--green)', letterSpacing: '1px', textTransform: 'uppercase',
                      }}>
                        ⚡ Agentic Bonus +5 applied
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Task tier analysis ── */}
          <div className="report-section" id="sec-tasks">
            <div className="section-title">Your Task Stack Analysis</div>
            {(['mundane', 'mediocre', 'core'] as const).map(tier => {
              const cfg  = TIER_CONFIG[tier];
              const data = analysis.task_tiers?.[tier];
              if (!data) return null;
              return (
                <div key={tier} className="task-tier">
                  <div className="task-tier-header">
                    <div className="tier-stripe" style={{ background: cfg.stripe }} />
                    <div>
                      <div className="tier-label" style={{ color: cfg.color }}>{cfg.label}</div>
                      <div className="tier-description">
                        {tier === 'mundane'  && 'High-volume, repetitive, low-judgment work — automate this first.'}
                        {tier === 'mediocre' && 'AI-assistable tasks that still benefit from your direction.'}
                        {tier === 'core'     && 'Your highest-value work. AI amplifies this — it does not replace it.'}
                      </div>
                    </div>
                    <div>
                      <div className="saving-number" style={{ color: cfg.color }}>{data.metric_value}</div>
                      <div className="saving-label">{data.metric_label}</div>
                    </div>
                  </div>
                  {data.tasks.map((task, ti) => (
                    <div key={ti} className="task-item">
                      <div className="task-current">
                        <div className="task-item-label">You currently</div>
                        <div className="task-current-text">{task.current_text}</div>
                        <div className="task-current-sub">{task.current_sub}</div>
                      </div>
                      <div className="task-superhuman">
                        <div className="task-item-label">As a Superhuman</div>
                        <div className="task-super-action">{task.superhuman_action}</div>
                        <div>{task.tools.map(t => <span key={t} className="task-tool-chip">{t}</span>)}</div>
                        <div className="task-try"><strong>Try this first:</strong> {task.try_this}</div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* ── 3-Phase Action Plan ── */}
          <div className="report-section" id="sec-plan">
            <div className="section-title">Your 3-Phase Action Plan</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.6 }}>
              Foundation → Integration → Transformation. Each phase builds on the last.
            </div>
            {analysis.action_plan.map(step => (
              <div key={step.step} className="action-step">
                <div className="step-number">{step.step}</div>
                <div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '.15em',
                    textTransform: 'uppercase', color: 'var(--green)', marginBottom: 6,
                  }}>
                    {step.time_frame}
                  </div>
                  <div className="step-title">{step.title}</div>
                  <div className="step-body"
                    dangerouslySetInnerHTML={{ __html: step.body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  <div className="step-tools">
                    {step.tools.map(t => <span key={t} className="tool-tag">{t}</span>)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Email capture ── */}
          <div className="report-section" id="sec-email">
            {!sent ? (
              <div className="email-capture-section">
                <div className="email-capture-eyebrow">Your report is ready</div>
                <div className="email-capture-title">Get your <span className="accent">full report</span> delivered</div>
                <div className="email-capture-sub">
                  Enter your details and we&apos;ll email you your Superhuman Report with PDF attached.
                  Your profile is added to the anonymous Superhuman Index.
                </div>
                <form className="email-form" onSubmit={handleSendReport}>
                  <input type="text" placeholder="Your name" value={emailName}
                    onChange={e => setEmailName(e.target.value)} />
                  <input type="email" placeholder="Your email address" value={emailAddr}
                    onChange={e => setEmailAddr(e.target.value)} required />
                  <button type="submit" className="email-send-btn" disabled={sending}>
                    {sending ? 'Sending...' : 'Send My Report →'}
                  </button>
                </form>
                {sendError && (
                  <div style={{ color: 'var(--amber)', fontSize: 12, marginTop: 8 }}>{sendError}</div>
                )}
                <div className="email-privacy">No spam. No sales calls. Unsubscribe any time.</div>
              </div>
            ) : (
              <div className="email-capture-section">
                <div className="sent-icon">✓</div>
                <div className="sent-title">Report sent to <span className="accent">{emailAddr}</span></div>
                <div className="sent-detail">
                  Your Superhuman Report is on its way. Your profile has been added to the Superhuman Index.
                </div>
                <div className="sent-tags">
                  <span className="sent-tag">Report Queued</span>
                  <span className="sent-tag">Personalised Plan Included</span>
                  <span className="sent-tag">Sent to {emailAddr}</span>
                </div>
                <div className="sent-actions">
                  <button className="cta-green" onClick={() => setShareOpen(true)}>Share My Score</button>
                  <button className="cta-outline" onClick={onGradeColleague}>Grade a Colleague</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ShareModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        score={score}
        percentileLabel={analysis.percentile_label}
        onGradeColleague={onGradeColleague}
      />
    </>
  );
}
