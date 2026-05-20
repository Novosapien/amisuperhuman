import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getServiceClient } from '@/lib/supabase';
import type { SuperhumanAnalysis } from '@/lib/types';

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

    // 2 · Save scores --------------------------------------------------------
    if (profile?.id) {
      const tools = Array.from(new Set(analysis.action_plan.flatMap((s) => s.tools))).slice(0, 5);
      const { error: scoreErr } = await supabase.from('scores').insert({
        profile_id: profile.id,
        automation_risk_score: analysis.dimensions.automation_risk.score,
        superhuman_readiness_score: analysis.overall_score,
        top_recommended_tools_json: tools,
        action_plan_text: analysis.action_plan.map((s) => s.title).join(' | '),
        full_analysis_json: analysis,
      });
      if (scoreErr) console.error('[send-report] score insert:', scoreErr);
    }

    // 3 · Send email ---------------------------------------------------------
    const { error: emailErr } = await resend.emails.send({
      from: 'Superhuman Index <hello@amisuperhuman.com>',
      to: email,
      subject: `Your Superhuman Score: ${analysis.overall_score}/100 — ${analysis.percentile_label}`,
      html: buildEmail(name, analysis),
    });
    if (emailErr) console.error('[send-report] email:', emailErr);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[send-report]', err);
    return NextResponse.json({ error: 'Failed to send report.' }, { status: 500 });
  }
}

function buildEmail(name: string, a: SuperhumanAnalysis): string {
  const first = name.split(' ')[0];
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
      <div style="font-size:15px;color:rgba(255,255,255,.4);margin-bottom:16px;">/100 &nbsp;·&nbsp; ${a.percentile_label}</div>
      <div style="font-size:14px;line-height:1.7;color:rgba(255,255,255,.8);max-width:460px;margin:0 auto;text-align:left;padding:16px 20px;background:rgba(71,240,97,.06);border-left:3px solid #47F061;">${a.verdict}</div>
    </td></tr>
    <tr><td style="background:#200D3A;padding:36px 40px;border:1px solid rgba(71,240,97,.1);border-top:none;">
      <div style="font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#47F061;margin-bottom:20px;">YOUR 3-STEP ACTION PLAN</div>
      ${a.action_plan.map(step => `
      <div style="margin-bottom:16px;padding:18px 22px;background:#1C0A33;border:1px solid rgba(255,255,255,.07);border-radius:6px;">
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
