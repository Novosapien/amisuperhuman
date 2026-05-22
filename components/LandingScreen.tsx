'use client';
import { useState } from 'react';

interface Props {
  onSubmit: (data: { name: string; linkedinUrl: string; profileText: string }) => void;
  initialName?: string;
}

export default function LandingScreen({ onSubmit, initialName = '' }: Props) {
  const [name, setName] = useState(initialName);
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!linkedinUrl.trim() || !linkedinUrl.includes('linkedin.com/in/')) {
      setError('Please enter a valid LinkedIn profile URL — e.g. linkedin.com/in/yourname');
      return;
    }
    setError('');
    // profileText is empty — the API will fetch it via Proxycurl
    onSubmit({ name, linkedinUrl: linkedinUrl.trim(), profileText: '' });
  }

  return (
    <div id="screen-landing" className="screen active">
      <div className="grid-lines" />
      <nav>
        <div className="nav-logo">ЯEBEL TECHNOLOGIST</div>
        <div className="nav-badge">Superhuman Index — 2026</div>
      </nav>

      {/* Hero */}
      <div className="hero">
        <div className="hero-eyebrow">The Superhuman Job Application</div>
        <h1>
          Think you&apos;ve got what<br />
          it takes to be <span className="accent">Superhuman?</span><br />
          <span className="dim">Let&apos;s find out.</span>
        </h1>
        <p className="hero-sub">
          Every role in every organisation is either going to be automated by AI, or won by a
          human who chose to become Superhuman. <strong>Which one are you?</strong>
        </p>
        <button className="hero-cta" onClick={() => {
          document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' });
        }}>
          Apply for the Superhuman Role →
        </button>
      </div>

      {/* Testimonials */}
      <div className="testimonials">
        <div className="testimonials-inner">
          <div className="testimonials-label">What Superhumans say</div>
          <div className="testimonials-grid">
            {[
              { q: "I used to spend three days producing a campaign. Now I do it in three hours with Claude. That\'s not productivity — that\'s a different job.", name: "Sarah M.", role: "Head of Marketing, Series B SaaS" },
              { q: "My score was 61. Within six weeks of following the action plan, I was running five prospect sequences simultaneously while attending fewer meetings.", name: "James T.", role: "Enterprise AE, FinTech" },
              { q: "I was skeptical. An 8-minute profile analysis that actually understood my role? The recommendations were more specific than any consultant I\'ve paid.", name: "Priya K.", role: "VP Operations, Scale-up" },
            ].map((t, i) => (
              <div key={i} className="testimonial-card">
                <div className="testimonial-quote">{t.q}&rdquo;</div>
                <div className="testimonial-author">
                  <div className="author-avatar">{t.name[0]}</div>
                  <div>
                    <div className="author-name">{t.name}</div>
                    <div className="author-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stats-inner">
          {[
            { n: '300M+', l: 'Jobs partially automatable (Goldman Sachs)' },
            { n: '14–40%', l: 'Productivity gain from AI tools (MIT/Stanford)' },
            { n: '97M', l: 'New roles created by AI transition (WEF)' },
            { n: '2026', l: '80% of enterprise software embeds AI (Gartner)' },
          ].map((s, i) => (
            <div key={i}>
              <span className="stat-number">{s.n}</span>
              <span className="stat-label">{s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Application form */}
      <div className="application-section" id="application-form">
        <div className="application-left">
          <h2>Apply for the <span className="accent">Superhuman</span> Role</h2>
          <p>
            Drop in your LinkedIn URL. Our Superhuman Advisor analyses your full profile
            automatically — role, seniority, skills, industry — and scores your AI readiness
            across five dimensions with a personalised action plan built for your exact job.
          </p>
          <ul className="requirements">
            {[
              ['One URL, 60 seconds', 'We fetch and analyse your profile automatically. No copy-pasting.'],
              ['Scores 5 dimensions', 'Role risk, AI awareness, transferability, seniority, industry velocity.'],
              ['Role-specific action plan', 'Not generic advice — specific tools for your exact job.'],
              ['100% positive framing', 'Your score tells you how far you\'ve come, not how far to go.'],
            ].map(([strong, rest], i) => (
              <li key={i}>
                <span className="req-icon">✓</span>
                <span><span className="req-strong">{strong}.</span> {rest}</span>
              </li>
            ))}
          </ul>
        </div>

        <form className="application-form" onSubmit={handleSubmit}>
          <div className="form-job-badge">Position Open</div>
          <div className="form-title">Superhuman — [Your Role]</div>
          <div className="form-subtitle">RebelTechnologist · Remote · Starts immediately</div>

          <div className="form-group">
            <label>Your Name (optional)</label>
            <input
              type="text"
              placeholder="e.g. Alex Chen"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>LinkedIn Profile URL *</label>
            <input
              type="url"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedinUrl}
              onChange={e => { setLinkedinUrl(e.target.value); setError(''); }}
              required
            />
            <div className="form-hint">
              Make sure your LinkedIn profile is set to <strong style={{color:'var(--white)'}}>public</strong> so we can read it.{' '}
              <a href="https://www.linkedin.com/help/linkedin/answer/a522735" target="_blank" rel="noreferrer">How to make your profile public →</a>
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--amber)', fontSize: 12, marginBottom: 12, padding: '8px 12px', background: 'rgba(245,200,66,.08)', border: '1px solid rgba(245,200,66,.2)', borderRadius: 4 }}>
              {error}
            </div>
          )}

          <button type="submit" className="submit-btn">
            Apply for the Superhuman Role →
          </button>
          <div className="form-disclaimer">
            We read your public LinkedIn profile only. No login required. Your data is used only
            to generate your personal report and anonymised aggregates for the Superhuman Index.
          </div>
        </form>
      </div>
    </div>
  );
}
