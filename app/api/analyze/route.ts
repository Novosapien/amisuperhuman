import { NextRequest, NextResponse } from 'next/server';
import { analyzeProfile } from '@/lib/claude';

// ── EnrichLayer profile fetch ─────────────────────────────────────────────────
async function fetchLinkedInProfile(linkedinUrl: string): Promise<string> {
  const apiKey = process.env.ENRICHLAYER_API_KEY;
  if (!apiKey) throw new Error('ENRICHLAYER_API_KEY is not set');

  const endpoint = `https://enrichlayer.com/api/v2/profile?profile_url=${encodeURIComponent(linkedinUrl)}`;

  const res = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch {}
    console.error(`[enrichlayer] ${res.status} — ${body}`);
    switch (res.status) {
      case 401: throw new Error('EnrichLayer API key is invalid. Check your ENRICHLAYER_API_KEY.');
      case 403: throw new Error('EnrichLayer account not authorised. Check your plan at enrichlayer.com.');
      case 404: throw new Error('LinkedIn profile not found. Make sure the URL is correct and the profile is public.');
      case 429: throw new Error('EnrichLayer rate limit hit. Please wait a moment and try again.');
      default:  throw new Error(`Failed to fetch LinkedIn profile (${res.status}).`);
    }
  }

  const p = await res.json() as Record<string, unknown>;

  if (!p || !p.first_name) {
    console.error('[enrichlayer] unexpected response shape:', JSON.stringify(p).slice(0, 300));
    throw new Error('LinkedIn profile returned empty data. The profile may be private.');
  }

  console.log(`[enrichlayer] fetched: ${p.full_name} — ${p.headline}`);
  return formatEnrichLayerProfile(p);
}

// ── Convert EnrichLayer response → readable text for Claude ──────────────────
function formatEnrichLayerProfile(p: Record<string, unknown>): string {
  const lines: string[] = [];

  // Basic info
  if (p.full_name)     lines.push(`Name: ${p.full_name}`);
  if (p.headline)      lines.push(`Headline: ${p.headline}`);
  if (p.occupation)    lines.push(`Current role: ${p.occupation}`);
  if (p.location_str)  lines.push(`Location: ${p.location_str}`);
  if (p.industry)      lines.push(`Industry: ${p.industry}`);
  if (p.follower_count) lines.push(`LinkedIn followers: ${p.follower_count}`);
  if (p.connections)   lines.push(`Connections: ${p.connections}`);

  // Summary / About (richest signal)
  if (p.summary) {
    const clean = String(p.summary).replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
    lines.push('', 'About:', clean);
  }

  // Work experience
  const experiences = p.experiences as Array<Record<string, unknown>> | undefined;
  if (experiences?.length) {
    lines.push('', 'Experience:');
    for (const exp of experiences.slice(0, 8)) {
      const company = String(exp.company ?? '');
      const title   = String(exp.title ?? '');
      const start   = (exp.starts_at as Record<string, unknown>)?.year ?? '';
      const end     = exp.ends_at ? (exp.ends_at as Record<string, unknown>)?.year ?? 'present' : 'present';
      lines.push(`- ${title} at ${company} (${start}–${end})`);
      if (exp.description) {
        const desc = String(exp.description).replace(/<[^>]+>/g, '').slice(0, 200);
        lines.push(`  ${desc}`);
      }
    }
  }

  // Education
  const education = p.education as Array<Record<string, unknown>> | undefined;
  if (education?.length) {
    lines.push('', 'Education:');
    for (const edu of education.slice(0, 3)) {
      lines.push(`- ${edu.degree_name ?? ''} ${edu.field_of_study ? 'in ' + edu.field_of_study : ''} at ${edu.school ?? ''}`);
    }
  }

  // Certifications
  const certs = p.certifications as Array<Record<string, unknown>> | undefined;
  if (certs?.length) {
    lines.push('', 'Certifications:');
    for (const cert of certs.slice(0, 8)) {
      lines.push(`- ${cert.name ?? ''} (${cert.authority ?? ''})`);
    }
  }

  // Published articles (signals thought leadership)
  const articles = p.articles as Array<Record<string, unknown>> | undefined;
  if (articles?.length) {
    lines.push('', `Published articles: ${articles.length} LinkedIn articles`);
    for (const art of articles.slice(0, 4)) {
      lines.push(`- "${art.title ?? ''}"`);
    }
  }

  // Honours & awards
  const awards = p.accomplishment_honors_awards as Array<Record<string, unknown>> | undefined;
  if (awards?.length) {
    lines.push('', 'Honours & Awards:');
    for (const a of awards.slice(0, 5)) {
      lines.push(`- ${a.title ?? ''} (${a.issuer ?? ''})`);
    }
  }

  // Languages
  const langs = p.languages as string[] | undefined;
  if (langs?.length) lines.push('', `Languages: ${langs.join(', ')}`);

  return lines.join('\n');
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkedinUrl, name } = body as { linkedinUrl: string; name?: string };

    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) {
      return NextResponse.json(
        { error: 'Please provide a valid LinkedIn profile URL, e.g. https://www.linkedin.com/in/yourname' },
        { status: 400 }
      );
    }

    // 1 · Fetch profile via EnrichLayer
    let profileText: string;
    try {
      profileText = await fetchLinkedInProfile(linkedinUrl);
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Failed to fetch LinkedIn profile.' },
        { status: 422 }
      );
    }

    if (!profileText || profileText.trim().length < 50) {
      return NextResponse.json(
        { error: 'LinkedIn profile appears to be private or empty. Please make your profile public and try again.' },
        { status: 422 }
      );
    }

    // 2 · Run Claude analysis
    const analysis = await analyzeProfile(profileText, linkedinUrl, name);
    return NextResponse.json({ analysis, profileText });

  } catch (err) {
    console.error('[analyze]', err);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
