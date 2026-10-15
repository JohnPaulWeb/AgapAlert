import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgapAlert — Intelligent DRRM Flood Early Warning & Evacuation Command Center',
  description:
    'Integrated Disaster Risk Reduction & Management Hub: Real-time river basin telemetry, PAGASA color-coded flood risk alerts, evacuation center capacity monitoring, and crowdsourced rescue dispatch for Philippine communities.',
  keywords: [
    'AgapAlert',
    'DRRM',
    'PAGASA Flood Warning',
    'Sinocalan River',
    'Marikina River',
    'Evacuation Center Philippines',
    'Early Warning System',
    'MDRRMO',
  ],
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#050b14',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#050b14] text-slate-100 min-h-screen selection:bg-cyan-500/30 selection:text-cyan-100 font-sans">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
