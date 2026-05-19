import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

export const metadata: Metadata = {
  title: 'Am I Superhuman? | RebelTechnologist Superhuman Index',
  description: 'Paste your LinkedIn profile. Get your Superhuman Score across 5 AI-readiness dimensions. Find out exactly which tools will multiply your output — role by role, step by step.',
  openGraph: {
    title: 'Am I Superhuman? | RebelTechnologist',
    description: 'Grade your LinkedIn profile against the Superhuman Index. Are you ready for the AI transition?',
    url: 'https://amisuperhuman.com',
    siteName: 'RebelTechnologist',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Am I Superhuman? | RebelTechnologist',
    description: 'Grade your LinkedIn against the Superhuman Index.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics 4 — G-VHL22LXLGY */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-VHL22LXLGY"
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-VHL22LXLGY');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  );
}
