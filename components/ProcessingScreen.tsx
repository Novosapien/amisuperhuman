'use client';
import { useEffect, useRef } from 'react';

const CODE_LINES = [
  { text: '$ python3 superhuman_advisor.py --profile "analysing..."', cls: 'white' },
  { text: '> Initialising Superhuman Advisor v2.6 ...', cls: '' },
  { text: '> Loading RebelTechnologist scoring model ...', cls: 'dim' },
  { text: '> Connecting to profile data pipeline ...', cls: 'dim' },
  { text: '> Verifying API credentials ...', cls: 'dim' },
  { text: '[OK] Connection established', cls: 'blue' },
  { text: '', cls: '' },
  { text: '> Parsing profile content ...', cls: '' },
  { text: '  >> Extracting role signals ...', cls: 'blue' },
  { text: '  >> Detecting industry category ...', cls: 'blue' },
  { text: '  >> Identifying seniority level ...', cls: 'blue' },
  { text: '  >> Mapping skills to AI leverage model ...', cls: 'blue' },
  { text: '  >> Cross-referencing career trajectory ...', cls: 'blue' },
  { text: '  >> Scanning endorsements and recommendations ...', cls: 'blue' },
  { text: '', cls: '' },
  { text: '> Running Dimension 1: Role Automation Risk ...', cls: '' },
  { text: '  >> Analysing task composition ...', cls: 'dim' },
  { text: '  >> Checking automation velocity in sector ...', cls: 'dim' },
  { text: '  >> Comparing against 2026 displacement index ...', cls: 'dim' },
  { text: '  >> Weighting repetitive vs. judgment-based tasks ...', cls: 'dim' },
  { text: '  >> Score: computing ...', cls: 'yellow' },
  { text: '', cls: '' },
  { text: '> Running Dimension 2: AI Awareness ...', cls: '' },
  { text: '  >> Scanning for AI tool signals ...', cls: 'dim' },
  { text: '  >> Checking certifications and pivots ...', cls: 'dim' },
  { text: '  >> Detecting AI-adjacent project history ...', cls: 'dim' },
  { text: '  >> Mapping tool adoption to role category ...', cls: 'dim' },
  { text: '  >> Score: computing ...', cls: 'yellow' },
  { text: '', cls: '' },
  { text: '> Running Dimension 3: Skill Transferability ...', cls: '' },
  { text: '  >> Mapping communication leverage ...', cls: 'dim' },
  { text: '  >> Assessing strategic depth ...', cls: 'dim' },
  { text: '  >> Evaluating adaptability signals ...', cls: 'dim' },
  { text: '  >> Checking cross-functional exposure ...', cls: 'dim' },
  { text: '  >> Score: computing ...', cls: 'yellow' },
  { text: '', cls: '' },
  { text: '> Running Dimension 4: Seniority & Leverage ...', cls: '' },
  { text: '  >> Evaluating authority multiplier ...', cls: 'dim' },
  { text: '  >> Assessing org-level influence range ...', cls: 'dim' },
  { text: '  >> Scoring leadership tenure signals ...', cls: 'dim' },
  { text: '  >> Score: computing ...', cls: 'yellow' },
  { text: '', cls: '' },
  { text: '> Running Dimension 5: Industry AI Velocity ...', cls: '' },
  { text: '  >> Benchmarking sector against AI adoption curve ...', cls: 'dim' },
  { text: '  >> Loading industry disruption forecast ...', cls: 'dim' },
  { text: '  >> Checking peer adoption rates ...', cls: 'dim' },
  { text: '  >> Score: computing ...', cls: 'yellow' },
  { text: '', cls: '' },
  { text: '> Aggregating scores ...', cls: '' },
  { text: '  >> Calculating overall Superhuman readiness ...', cls: 'dim' },
  { text: '  >> Determining percentile ranking globally ...', cls: 'dim' },
  { text: '  >> Running Builder Paradox detection ...', cls: 'dim' },
  { text: '  >> Calibrating score floor to 35 minimum ...', cls: 'dim' },
  { text: '', cls: '' },
  { text: '> Building task tier analysis ...', cls: '' },
  { text: '  >> Identifying Mundane task opportunities ...', cls: 'dim' },
  { text: '  >> Estimating time reclaim potential ...', cls: 'dim' },
  { text: '  >> Identifying Mediocre task amplifiers ...', cls: 'dim' },
  { text: '  >> Mapping AI-assist coverage per task ...', cls: 'dim' },
  { text: '  >> Identifying Core task leverage points ...', cls: 'dim' },
  { text: '  >> Calculating output multipliers ...', cls: 'dim' },
  { text: '', cls: '' },
  { text: '> Generating personalised action plan ...', cls: '' },
  { text: '  >> Selecting highest-ROI starting point ...', cls: 'dim' },
  { text: '  >> Step 1: This week ...', cls: 'dim' },
  { text: '  >> Sequencing dependencies ...', cls: 'dim' },
  { text: '  >> Step 2: Next two weeks ...', cls: 'dim' },
  { text: '  >> Building transformational milestone ...', cls: 'dim' },
  { text: '  >> Step 3: This month ...', cls: 'dim' },
  { text: '  >> Mapping tools to each step ...', cls: 'dim' },
  { text: '', cls: '' },
  { text: '> Recommending Superhuman tool stack ...', cls: '' },
  { text: '  >> Cross-referencing role category ...', cls: 'dim' },
  { text: '  >> Filtering to highest-impact tools ...', cls: 'dim' },
  { text: '  >> Adding 30-second first actions ...', cls: 'dim' },
  { text: '', cls: '' },
  { text: '> Rendering Superhuman Report ...', cls: '' },
  { text: '  >> Building score visualisation ...', cls: 'dim' },
  { text: '  >> Formatting task analysis ...', cls: 'dim' },
  { text: '  >> Preparing dimension breakdown ...', cls: 'dim' },
  { text: '  >> Generating share card ...', cls: 'dim' },
  { text: '  >> Composing PDF report ...', cls: 'dim' },
  { text: '  >> Writing to Supabase ...', cls: 'dim' },
  { text: '', cls: '' },
  { text: '> Running final quality checks ...', cls: '' },
  { text: '  >> Verifying score consistency ...', cls: 'dim' },
  { text: '  >> Checking action plan specificity ...', cls: 'dim' },
  { text: '  >> Validating tool recommendations ...', cls: 'dim' },
  { text: '', cls: '' },
  { text: '[OK] Quality checks passed.', cls: 'blue' },
  { text: '[OK] Report generation complete.', cls: 'blue' },
  { text: '[OK] Opening your Superhuman Report now ...', cls: 'blue' },
];

export default function ProcessingScreen() {
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = outputRef.current;
    if (!el) return;
    el.innerHTML = '';

    let idx = 0;
    const total = CODE_LINES.length;
    const MS_PER_LINE = 365; // 280ms slowed by ~30% — deliberate, non-obvious loop

    const timer = setInterval(() => {
      const line = CODE_LINES[idx % total];
      const span = document.createElement('span');
      span.className = `code-line${line.cls ? ' ' + line.cls : ''}`;
      span.textContent = line.text || ' ';
      el.appendChild(span);

      // Keep last 18 lines visible
      const all = el.querySelectorAll('.code-line');
      if (all.length > 18) all[0].remove();

      idx++;
      // No clearInterval — loops continuously until component unmounts
    }, MS_PER_LINE);

    return () => clearInterval(timer);
  }, []);

  return (
    <div id="screen-processing" className="screen active">
      <div className="processing-bg-glow" />
      <div className="mac-frame">
        <div className="mac-titlebar">
          <div className="mac-dot red" />
          <div className="mac-dot yellow" />
          <div className="mac-dot green" />
          <div className="mac-title">superhuman_advisor.py — running analysis</div>
        </div>
        <div className="mac-screen">
          <div id="code-output" ref={outputRef} />
        </div>
      </div>
      <div className="processing-status">
        <div className="processing-label">Analysing your profile</div>
        <div className="processing-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}
