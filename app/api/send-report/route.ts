import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServiceClient } from '@/lib/supabase';
import type { SuperhumanAnalysis } from '@/lib/types';
import { generateReportPdf } from '@/lib/generatePdf';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, linkedinUrl, profileText, analysis } = body as {
      name: string;
      email: string;
      linkedinUrl: string;
      profileText: string;
      analysis: SuperhumanAnalysis;
    };

    const supabase = getServiceClient();

    // 1 · Save profile --------------------------------------------------------
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .insert({
        linkedin_url: linkedinUrl || '',
        raw_text: profileText,
        role_category: analysis.detected_role,
        seniority_level: analysis.detected_seniority,
        industry: analysis.detected_industry,
        skills_json: [],
        submitted_name: name,
        submitted_email: email,
      })
      .select('id')
      .single();

    if (profileErr) console.error('[send-report] profile insert:', profileErr);

    // 2 · Save scores — all 6 dimensions + agentic bonus + band ---------------
    if (profile?.id) {
      const d = analysis.dimensions;
      const tools = Array.from(new Set(analysis.action_plan.flatMap((s) => s.tools))).slice(0, 5);

      const { error: scoreErr } = await supabase.from('scores').insert({
        profile_id:                  profile.id,
        // Legacy column (keep for backward compat)
        automation_risk_score:       d.task_composition?.score ?? null,
        superhuman_readiness_score:  analysis.overall_score,
        top_recommended_tools_json:  tools,
        action_plan_text:            analysis.action_plan.map((s) => s.title).join(' | '),
        full_analysis_json:          analysis,
        // New D1-D6 columns
        d1_task_composition:         d.task_composition?.score ?? null,
        d2_ai_signal_strength:       d.ai_signal_strength?.score ?? null,
        d3_skill_transferability:    d.skill_transferability?.score ?? null,
        d4_seniority_leverage:       d.seniority_leverage?.score ?? null,
        d5_industry_velocity:        d.industry_velocity?.score ?? null,
        d6_career_momentum:          d.career_momentum?.score ?? null,
        agentic_bonus_applied:       analysis.agentic_bonus_applied ?? false,
        score_band:                  analysis.score_band ?? null,
      });
      if (scoreErr) console.error('[send-report] score insert:', scoreErr);
    }

    // 3 · Generate PDF attachment ---------------------------------------------
    let pdfBuffer: Buffer | undefined;
    try {
      pdfBuffer = await generateReportPdf(analysis, name);
      console.log('[send-report] PDF generated, size:', pdfBuffer.length);
    } catch (pdfErr) {
      console.error('[send-report] PDF generation failed (sending without attachment):', pdfErr);
    }

    // 4 · Send email ----------------------------------------------------------
    const { error: emailErr } = await resend.emails.send({
      from: 'Superhuman Index <hello@amisuperhuman.com>',
      to: email,
      subject: `Your Superhuman Score: ${analysis.overall_score}/100 — ${analysis.percentile_label}`,
      html: buildEmail(name, analysis),
      ...(pdfBuffer && {
        attachments: [{
          filename: `superhuman-report-${analysis.overall_score}.pdf`,
          content: pdfBuffer,
        }],
      }),
    });
    if (emailErr) console.error('[send-report] email:', emailErr);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-report]', err);
    return NextResponse.json({ error: 'Failed to send report.' }, { status: 500 });
  }
}

function buildEmail(name: string, a: SuperhumanAnalysis): string {
  const bandCopy: Record<string, string> = {
    Foundation: 'The tools exist. The roadmap starts here.',
    Emerging:   "You've got the instincts. Now build the stack.",
    Advancing:  "You're ahead of the curve. Push harder.",
    Superhuman: "Top tier. You're in the top percentile globally.",
  };

  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0F0720;font-family:-apple-system,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:40px 20px;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td style="background:#47F061;padding:20px 40px;border-radius:8px 8px 0 0;">
      <span style="font-size:13px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;color:#1C0A33;">ЯEBEL TECHNOLOGIST</span>
    </td></tr>
    <tr><td style="background:#1C0A33;padding:48px 40px;text-align:center;border:1px solid rgba(71,240,97,.15);border-top:none;">
      <div style="font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#47F061;margin-bottom:8px;">YOUR SUPERHUMAN SCORE</div>
      <div style="font-size:80px;font-weight:900;color:#47F061;line-height:1;">${a.overall_score}</div>
      <div style="font-size:14px;font-weight:700;color:#47F061;letter-spacing:.15em;text-transform:uppercase;margin:6px 0;">${a.score_band ?? ''}</div>
      <div style="font-size:14px;color:rgba(255,255,255,.4);margin-bottom:8px;">${a.percentile_label}</div>
      <div style="font-size:12px;color:rgba(71,240,97,.7);margin-bottom:20px;">${bandCopy[a.score_band] ?? ''}</div>
      ${a.agentic_bonus_applied ? '<div style="display:inline-block;background:rgba(71,240,97,.12);border:1px solid rgba(71,240,97,.3);color:#47F061;font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;padding:4px 14px;border-radius:100px;margin-bottom:20px;">⚡ AGENTIC BONUS UNLOCKED +5</div>' : ''}
      <div style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.8);max-width:460px;margin:0 auto;text-align:left;padding:16px 20px;background:rgba(71,240,97,.06);border-left:3px solid #47F061;">${a.verdict}</div>
    </td></tr>
    <tr><td style="background:#200D3A;padding:36px 40px;border:1px solid rgba(71,240,97,.1);border-top:none;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#47F061;margin-bottom:16px;">6-DIMENSION BREAKDOWN</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          { label: 'D1 Task Composition',   score: a.dimensions.task_composition?.score,    max: 25 },
          { label: 'D2 AI Signal Strength',  score: a.dimensions.ai_signal_strength?.score,  max: 25 },
          { label: 'D3 Skill Transferability', score: a.dimensions.skill_transferability?.score, max: 20 },
          { label: 'D4 Seniority Leverage',  score: a.dimensions.seniority_leverage?.score,  max: 15 },
          { label: 'D5 Industry Velocity',   score: a.dimensions.industry_velocity?.score,   max: 10 },
          { label: 'D6 Career Momentum',     score: a.dimensions.career_momentum?.score,     max: 5  },
        ].map(dim => {
          const pct = dim.score != null ? Math.round((dim.score / dim.max) * 100) : 0;
          const barColor = pct >= 75 ? '#47F061' : pct >= 50 ? '#F5C842' : '#ff6b6b';
          return `<tr>
            <td style="font-size:11px;color:rgba(255,255,255,.6);padding:6px 0;width:160px;">${dim.label}</td>
            <td style="padding:6px 12px;">
              <div style="background:rgba(255,255,255,.08);border-radius:3px;height:5px;overflow:hidden;">
                <div style="width:${pct}%;height:5px;background:${barColor};border-radius:3px;"></div>
              </div>
            </td>
            <td style="font-size:12px;font-weight:700;color:#47F061;text-align:right;white-space:nowrap;padding:6px 0;">${dim.score ?? '-'}/${dim.max}</td>
          </tr>`;
        }).join('')}
      </table>
    </td></tr>
    <tr><td style="background:#200D3A;padding:0 40px 36px;border:1px solid rgba(71,240,97,.1);border-top:none;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#47F061;margin-bottom:16px;">YOUR 3-PHASE ACTION PLAN</div>
      ${a.action_plan.map(step => `
      <div style="margin-bottom:14px;padding:16px 20px;background:#1C0A33;border:1px solid rgba(255,255,255,.07);border-radius:6px;">
        <div style="font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:#47F061;margin-bottom:4px;">STEP ${step.step} — ${step.time_frame}</div>
        <div style="font-size:14px;font-weight:700;color:#F5F5F0;margin-bottom:6px;">${step.title}</div>
        <div style="font-size:12px;line-height:1.6;color:rgba(255,255,255,.55);">${step.body}</div>
      </div>`).join('')}
    </td></tr>
    <tr><td style="background:#1C0A33;padding:36px 40px;text-align:center;border:1px solid rgba(71,240,97,.1);border-top:none;border-radius:0 0 8px 8px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://amisuperhuman.com'}" style="display:inline-block;background:#47F061;color:#1C0A33;padding:13px 30px;border-radius:4px;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;">View Full Report →</a>
      <div style="margin-top:24px;font-size:11px;color:rgba(255,255,255,.25);">RebelTechnologist · amisuperhuman.com</div>
    </td></tr>
  </table>
  </td></tr>
</table>
</body></html>`;
}
