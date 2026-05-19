import { NextRequest, NextResponse } from 'next/server';
import { analyzeProfile } from '@/lib/claude';

// ── Extract LinkedIn username from URL ────────────────────────────────────────
function extractUsername(linkedinUrl: string): string | null {
  const match = linkedinUrl.match(/linkedin\.com\/in\/([^/?#]+)/);
  return match ? match[1].replace(/\/$/, '') : null;
}

// ── LinkdAPI profile fetch ────────────────────────────────────────────────────
async function fetchLinkedInProfile(linkedinUrl: string): Promise<string> {
  const apiKey = process.env.LINKDAPI_KEY;
  if (!apiKey) throw new Error('LINKDAPI_KEY is not set');

  const username = extractUsername(linkedinUrl);
  if (!username) throw new Error('Could not extract LinkedIn username from URL.');

  const endpoint = `https://linkdapi.com/api/v1/profile/full?username=${encodeURIComponent(username)}`;

  const res = await fetch(endpoint, {
    headers: {
      'X-linkdapi-apikey': apiKey,
      'Accept': 'application/json',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch {}
    console.error(`[linkdapi] ${res.status} — ${body}`);
    switch (res.status) {
      case 401: throw new Error('LinkdAPI key is invalid. Check your LINKDAPI_KEY.');
      case 403: throw new Error('LinkdAPI account not authorised. Check your plan at linkdapi.com.');
      case 404: throw new Error('LinkedIn profile not found. Make sure the URL is correct and the profile is public.');
      case 429: throw new Error('LinkdAPI rate limit hit. Please wait a moment and try again.');
      default:  throw new Error(`Failed to fetch LinkedIn profile (${res.status}).`);
    }
  }

  const json = await res.json();

  // LinkdAPI wraps data in a { success, data } envelope
  const p = (json.data ?? json) as Record<string, unknown>;

  if (!p || !p.firstName) {
    console.error('[linkdapi] unexpected response shape:', JSON.stringify(json).slice(0, 300));
    throw new Error('LinkedIn profile returned empty data. The profile may be private.');
  }

  console.log(`[linkdapi] fetched: ${p.firstName} ${p.lastName} — ${p.headline}`);
  return formatLinkdAPIProfile(p);
}

// ── Convert LinkdAPI response → readable text for Claude ─────────────────────
function formatLinkdAPIProfile(p: Record<string, unknown>): string {
  const lines: string[] = [];

  // Basic info
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
  if (name) lines.push(`Name: ${name}`);
  if (p.headline) lines.push(`Headline: ${p.headline}`);

  // Location
  const geo = p.geo as Record<string, unknown> | undefined;
  if (geo?.full) lines.push(`Location: ${geo.full}`);

  // Industry
  const industry = p.industry as Record<string, unknown> | undefined;
  if (industry?.name) lines.push(`Industry: ${industry.name}`);

  // Follower/connection counts (signal of seniority/influence)
  if (p.followerCount) lines.push(`LinkedIn followers: ${p.followerCount}`);
  if (p.connectionsCount) lines.push(`Connections: ${p.connectionsCount}`);

  // About / summary (the richest signal)
  if (p.summary) lines.push('', 'About:', String(p.summary));

  // Current positions
  const currentPositions = p.currentPositions as Array<Record<string, unknown>> | undefined;
  if (currentPositions?.length) {
    lines.push('', 'Current Role(s):');
    for (const pos of currentPositions) {
      const company = (pos.company as Record<string, unknown>)?.name ?? pos.companyName ?? '';
      lines.push(`- ${pos.title ?? pos.role ?? ''} at ${company}`);
    }
  }

  // Skills
  const skills = p.skills as Array<Record<string, unknown>> | undefined;
  if (skills?.length) {
    const skillNames = skills.slice(0, 25).map(s => String(s.name ?? s));
    lines.push('', `Skills: ${skillNames.join(', ')}`);
  }

  // Certifications
  const certs = p.certifications as Array<Record<string, unknown>> | undefined;
  if (certs?.length) {
    lines.push('', 'Certifications:');
    for (const cert of certs.slice(0, 6)) {
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
        { error: 'Please provide a valid LinkedIn profile URL — e.g. https://www.linkedin.com/in/yourname' },
        { status: 400 }
      );
    }

    // 1 · Fetch profile via LinkdAPI
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
