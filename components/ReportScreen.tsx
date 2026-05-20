'use client';
import { useEffect, useRef, useState } from 'react';
import type { SuperhumanAnalysis } from '@/lib/types';
import ShareModal from './ShareModal';

interface Props {
  analysis: SuperhumanAnalysis;
  formData: { name: string; linkedinUrl: string; profileText: string };
  onGradeColleague: () => void;
}

const DIM_LABELS = [
  { key: 'automation_risk',       label: 'Role Automation Risk' },
  { key: 'ai_awareness',          label: 'AI Awareness' },
  { key: 'skill_transferability', label: 'Skill Transferability' },
  { key: 'seniority_leverage',    label: 'Seniority & Leverage' },
  { key: 'industry_velocity',     label: 'Industry AI Velocity' },
] as const;

const TIER_CONFIG = {
  mundane:  { label: 'Tier 1 — Mundane Tasks',  color: 'rgba(255,255,255,0.4)', stripe: 'rgba(255,255,255,0.15)' },
  mediocre: { label: 'Tier 2 — Mediocre Tasks', color: 'var(--amber)',           stripe: 'var(--amber)' },
  core:     { label: 'Tier 3 — Core Tasks',     color: 'var(--green)',           stripe: 'var(--green)' },
};

export default function ReportScreen({ analysis, formData, onGradeColleague }: Props) {
  const ringRef = useRef<SVGCircleElement>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [emailName, setEmailName] = useState(formData.name);
  const [emailAddr, setEmailAddr] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState('');

  // Animate score ring + fade-in sections on mount
  useEffect(() => {
    const circumference = 440;
    const offset = circumference - (circumference * analysis.overall_score) / 100;
    setTimeout(() => {
      if (ringRef.current) {
        ringRef.current.style.strokeDashoffset = String(offset);
      }
    }, 300);

    const sections = document.querySelectorAll('.report-section');
    sections.forEach((s, i) => {
      setTimeout(() => s.classList.add('visible'), i * 200);
    });

    // Animate dim bars
    setTimeout(() => {
      document.querySelectorAll<HTMLElement>('.dim-bar-fill').forEach((bar, j) => {
        setTimeout(() => {
          bar.style.width = (bar.dataset.width ?? '0') + '%';
        }, j * 100);
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

  return (
    <>
      <div id="screen-report" className="screen active">
        {/* Report nav */}
        <div className="report-nav">
          <div className="report-nav-brand">ЯEBEL TECHNOLOGIST</div>
          <div className="report-nav-title">Superhuman Report — {analysis.detected_name || formData.name}</div>
          <button className="btn-ghost" onClick={() => setShareOpen(true)}>Share My Score</button>
        </div>

        {/* Hero + score ring */}
        <div className="report-section report-hero" id="sec-hero">
          <div className="report-hero-inner">
            <div>
              <div className="report-eyebrow">Official Superhuman Assessment</div>
              <div className="report-name">{analysis.detected_name || formData.name || 'Your'} Superhuman Report</div>
              <div className="report-role">{analysis.detected_role} · {analysis.detected_industry}</div>
              {analysis.builder_paradox_note && (
                <div style={{ fontSize: 12, color: 'var(--amber)', background: 'rgba(245,200,66,.08)', border: '1px solid rgba(245,200,66,.2)', borderRadius: 4, padding: '8px 12px', marginBottom: 12 }}>
                  ⚡ {analysis.builder_paradox_note}
                </div>
              )}
              <div className="report-verdict">{analysis.verdict}</div>
            </div>
            <div className="score-display">
              <div className="score-ring-container">
                <svg viewBox="0 0 160 160" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
                  <circle className="score-ring-bg" cx="80" cy="80" r="70" />
                  <circle
                    ref={ringRef}
                    className="score-ring-fill"
                    cx="80" cy="80" r="70"
                    style={{ strokeDashoffset: 440 }}
                  />
                </svg>
                <div className="score-center">
                  <div className="score-number">{score}</div>
                  <div className="score-label">/ 100</div>
                </div>
              </div>
              <div className="score-title">{score}% Superhuman</div>
              <div className="score-subtitle">{analysis.percentile_label}</div>
            </div>
          </div>
        </div>

        <div className="report-body">
          {/* 5 Dimensions */}
          <div className="report-section" id="sec-dims">
            <div className="section-title">5-Dimension Breakdown</div>
            <div className="dimensions-grid">
              {DIM_LABELS.map(({ key, label }) => {
                const dim = d[key];
                const pct = Math.round((dim.score / 20) * 100);
                return (
                  <div key={key} className="dim-card">
                    <div className="dim-name">{label}</div>
                    <div className="dim-score">{dim.score}<span className="dim-max">/20</span></div>
                    <div className="dim-bar-track">
                      <div className="dim-bar-fill" data-width={pct} style={{ width: 0, background: pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : '#ff6b6b' }} />
                    </div>
                    <div className="dim-verdict">{dim.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Task tiers */}
          <div className="report-section" id="sec-tasks">
            <div className="section-title">Your Task Stack Analysis</div>
            {(['mundane', 'mediocre', 'core'] as const).map(tier => {
              const cfg = TIER_CONFIG[tier];
              const data = analysis.task_tiers[tier];
              return (
                <div key={tier} className="task-tier">
                  <div className="task-tier-header">
                    <div className="tier-stripe" style={{ background: cfg.stripe }} />
                    <div>
                      <div className="tier-label" style={{ color: cfg.color }}>{cfg.label}</div>
                      <div className="tier-description">
                        {tier === 'mundane' && 'High-volume, repetitive, low-judgment work — automate this first.'}
                        {tier === 'mediocre' && 'AI-assistable tasks that still benefit from your direction.'}
                        {tier === 'core' && 'Your highest-value work. AI amplifies this — it does not replace it.'}
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

          {/* Action plan */}
          <div className="report-section" id="sec-plan">
            <div className="section-title">Your 3-Step Action Plan</div>
            {analysis.action_plan.map(step => (
              <div key={step.step} className="action-step">
                <div className="step-number">{step.step}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--green)', marginBottom: 6 }}>{step.time_frame}</div>
                  <div className="step-title">{step.title}</div>
                  <div className="step-body" dangerouslySetInnerHTML={{ __html: step.body.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  <div className="step-tools">{step.tools.map(t => <span key={t} className="tool-tag">{t}</span>)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Email capture */}
          <div className="report-section" id="sec-email">
            {!sent ? (
              <div className="email-capture-section">
                <div className="email-capture-eyebrow">Your report is ready</div>
                <div className="email-capture-title">Get your <span className="accent">full report</span> delivered</div>
                <div className="email-capture-sub">
                  Enter your details and we&apos;ll email you your Superhuman Report. Your profile is also added to the anonymous Superhuman Index.
                </div>
                <form className="email-form" onSubmit={handleSendReport}>
                  <input type="text" placeholder="Your name" value={emailName} onChange={e => setEmailName(e.target.value)} />
                  <input type="email" placeholder="Your email address" value={emailAddr} onChange={e => setEmailAddr(e.target.value)} required />
                  <button type="submit" className="email-send-btn" disabled={sending}>
                    {sending ? 'Sending...' : 'Send My Report →'}
                  </button>
                </form>
                {sendError && <div style={{ color: 'var(--amber)', fontSize: 12, marginTop: 8 }}>{sendError}</div>}
                <div className="email-privacy">No spam. No sales calls. Unsubscribe any time.</div>
              </div>
            ) : (
              <div className="email-capture-section">
                <div className="sent-icon">✓</div>
                <div className="sent-title">Report sent to <span className="accent">{emailAddr}</span></div>
                <div className="sent-detail">Your Superhuman Report is on its way. Your profile has been added to the Superhuman Index.</div>
                <div className="sent-tags">
                  <span className="sent-tag">Report sent</span>
                  <span className="sent-tag">Added to Superhuman Index</span>
                  <span className="sent-tag">Profile saved</span>
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
