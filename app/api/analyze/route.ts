import { NextRequest, NextResponse } from 'next/server';
import { analyzeProfile } from '@/lib/claude';

// ── Proxycurl profile fetch ───────────────────────────────────────────────────
async function fetchLinkedInProfile(linkedinUrl: string): Promise<string> {
  const apiKey = process.env.PROXYCURL_API_KEY;
  if (!apiKey) throw new Error('PROXYCURL_API_KEY is not set');

  const endpoint = `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}&use_cache=if-present&fallback_to_cache=on-error`;

  const res = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${apiKey}` },
    next: { revalidate: 0 },
  });

  if (res.status === 404) throw new Error('LinkedIn profile not found. Make sure the URL is correct and the profile is public.');
  if (res.status === 401) throw new Error('Proxycurl API key is invalid.');
  if (res.status === 429) throw new Error('Profile fetch limit reached. Please try again later.');
  if (!res.ok) throw new Error(`Failed to fetch LinkedIn profile (${res.status})`);

  const data = await res.json();
  return formatProxycurlProfile(data);
}

// ── Convert Proxycurl JSON → readable text for Claude ────────────────────────
function formatProxycurlProfile(p: Record<string, unknown>): string {
  const lines: string[] = [];

  if (p.full_name)  lines.push(`Name: ${p.full_name}`);
  if (p.headline)   lines.push(`Headline: ${p.headline}`);
  if (p.occupation) lines.push(`Current occupation: ${p.occupation}`);
  if (p.city || p.country) lines.push(`Location: ${[p.city, p.country].filter(Boolean).join(', ')}`);
  if (p.follower_count) lines.push(`LinkedIn followers: ${p.follower_count}`);

  if (p.summary) {
    lines.push('', 'About:', String(p.summary));
  }

  const experiences = p.experiences as Array<Record<string, unknown>> | undefined;
  if (experiences?.length) {
    lines.push('', 'Experience:');
    for (const exp of experiences.slice(0, 8)) {
      const start = (exp.starts_at as Record<string,number> | null)?.year ?? '';
      const end   = (exp.ends_at   as Record<string,number> | null)?.year ?? 'Present';
      lines.push(`- ${exp.title ?? ''} at ${exp.company ?? ''} (${start}–${end})`);
      if (exp.description) lines.push(`  ${String(exp.description).slice(0, 300)}`);
    }
  }

  const education = p.education as Array<Record<string, unknown>> | undefined;
  if (education?.length) {
    lines.push('', 'Education:');
    for (const edu of education.slice(0, 4)) {
      lines.push(`- ${edu.degree_name ?? ''} ${edu.field_of_study ?? ''} — ${edu.school ?? ''}`);
    }
  }

  const skills = p.skills as string[] | undefined;
  if (skills?.length) {
    lines.push('', `Skills: ${skills.slice(0, 20).join(', ')}`);
  }

  const certifications = p.certifications as Array<Record<string, unknown>> | undefined;
  if (certifications?.length) {
    lines.push('', 'Certifications:');
    for (const cert of certifications.slice(0, 6)) {
      lines.push(`- ${cert.name ?? ''} (${cert.authority ?? ''})`);
    }
  }

  return lines.join('\n');
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkedinUrl, name } = body as { linkedinUrl: string; name?: string };

    if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) {
      return NextResponse.json(
        { error: 'Please provide a valid LinkedIn profile URL.' },
        { status: 400 }
      );
    }

    // 1 · Fetch profile from LinkedIn via Proxycurl
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
