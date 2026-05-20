'use client';
import { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  score: number;
  percentileLabel: string;
  onGradeColleague: () => void;
}

export default function ShareModal({ isOpen, onClose, score, percentileLabel, onGradeColleague }: Props) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://amisuperhuman.com';
  const shareText = `I just scored ${score}/100 on the @RebelTechnologist Superhuman Index — ${percentileLabel}. Are you Superhuman?`;

  function handleCopy() {
    navigator.clipboard.writeText(`${shareText} ${appUrl}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const circumference = 345.6; // 2π × 55
  const offset = circumference - (circumference * score) / 100;

  return (
    <div className="share-overlay open" onClick={handleBackdrop}>
      <div className="share-modal">
        <div className="share-card">
          <div className="share-card-top">
            <div className="share-card-logo">
              <span className="rt-badge">ЯT</span>REBEL TECHNOLOGIST
            </div>
            <div className="share-card-url">amisuperhuman.com</div>
          </div>
          <div className="share-card-body">
            <div>
              <div className="share-card-headline">Official Superhuman Verdict</div>
              <div className="share-card-claim">
                I am <span className="accent">{score}%</span><br />Superhuman.
              </div>
              <div className="share-card-sub">
                <strong>{percentileLabel}</strong> of all profiles graded worldwide.<br />
                Scored across 5 AI-readiness dimensions<br />by the RebelTechnologist Superhuman Index.
              </div>
              <div className="share-card-domain">amisuperhuman.com</div>
            </div>
            <div className="share-score-ring">
              <div className="share-score-wrap">
                <svg viewBox="0 0 120 120" width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle className="share-score-ring-bg" cx="60" cy="60" r="55" />
                  <circle
                    className="share-score-ring-fill"
                    cx="60" cy="60" r="55"
                    style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
                  />
                </svg>
                <div className="share-score-center">
                  <div className="share-score-num">{score}</div>
                  <div className="share-score-denom">/100</div>
                </div>
              </div>
              <div className="share-score-label">Superhuman</div>
              <div className="share-score-pct">{percentileLabel}</div>
            </div>
          </div>
          <div className="share-card-footer">
            <div className="share-card-tag">Superhuman Index — {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</div>
            <div className="share-card-month">RebelTechnologist.com</div>
          </div>
        </div>

        <div className="share-actions">
          <button className={`share-btn share-btn-copy${copied ? ' copied' : ''}`} onClick={handleCopy}>
            {copied ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Link</>
            )}
          </button>
          <a
            className="share-btn share-btn-linkedin"
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(appUrl)}&summary=${encodeURIComponent(shareText)}`}
            target="_blank" rel="noreferrer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
            LinkedIn
          </a>
          <a
            className="share-btn share-btn-twitter"
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + ' →')}&url=${encodeURIComponent(appUrl)}`}
            target="_blank" rel="noreferrer"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X / Twitter
          </a>
        </div>
        <button className="share-close" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
